-- =====================================================================
-- RENUEVA · notificaciones push (llegan al celular aunque la app esté cerrada)
-- Cada celular que acepta las notificaciones queda registrado en push_subs.
-- Cada minuto, pg_cron llama a la función "push", que pide a push_pendientes()
-- los recordatorios que vencieron y los envía a los celulares que corresponden.
-- =====================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- configuración privada: claves VAPID (las genera la función la primera vez) y la
-- llave con que pg_cron llama a la función. Nadie la lee por la API (RLS sin políticas).
create table if not exists public.push_config (
  id int primary key default 1 check (id = 1),
  vapid_public text,
  vapid_private text,
  subject text not null default 'mailto:sebastian.sanchez.spc@gmail.com',
  cron_key text not null default encode(extensions.gen_random_bytes(24), 'hex')
);
alter table public.push_config enable row level security;
revoke all on public.push_config from anon, authenticated;
insert into public.push_config (id) values (1) on conflict do nothing;

-- un registro por celular/navegador
create table if not exists public.push_subs (
  endpoint text primary key check (endpoint like 'https://%' and char_length(endpoint) < 1000),
  user_id uuid not null references auth.users (id) on delete cascade,
  org_id uuid not null references public.orgs (id) on delete cascade,
  email text not null,
  p256dh text not null check (char_length(p256dh) between 60 and 120),
  auth text not null check (char_length(auth) between 16 and 40),
  creado timestamptz not null default now()
);
create index if not exists push_subs_org on public.push_subs (org_id);
alter table public.push_subs enable row level security;
revoke all on public.push_subs from anon, authenticated;

-- recordatorios ya enviados (para no repetir); se limpia sola a los 30 días
create table if not exists public.push_enviados (
  org_id uuid not null,
  rem_id text not null,
  cuando text not null,
  enviado timestamptz not null default now(),
  primary key (org_id, rem_id, cuando)
);
alter table public.push_enviados enable row level security;
revoke all on public.push_enviados from anon, authenticated;

-- el celular se registra (o se da de baja) a nombre del usuario con sesión
create or replace function public.guardar_push(p_endpoint text, p_p256dh text, p_auth text) returns void
language plpgsql security definer set search_path = public as $$
declare v_org uuid := mi_org();
begin
  if auth.uid() is null or v_org is null then raise exception 'Inicia sesión primero' using errcode = 'P0001'; end if;
  insert into push_subs (endpoint, user_id, org_id, email, p256dh, auth)
    values (p_endpoint, auth.uid(), v_org, mi_email(), p_p256dh, p_auth)
    on conflict (endpoint) do update set user_id = excluded.user_id, org_id = excluded.org_id, email = excluded.email,
      p256dh = excluded.p256dh, auth = excluded.auth, creado = now();
end $$;

create or replace function public.quitar_push(p_endpoint text) returns void
language sql security definer set search_path = public as $$
  delete from push_subs where endpoint = p_endpoint and user_id = auth.uid()
$$;

-- recordatorios que vencieron en los últimos 15 minutos y aún no se avisan.
-- Los marca como enviados y devuelve a qué celulares mandarlos:
-- el del vendedor dueño del recordatorio, o los administradores si no tiene dueño.
create or replace function public.push_pendientes() returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_out jsonb; v_ahora timestamp := now() at time zone 'America/Santiago';
begin
  delete from push_enviados where enviado < now() - interval '30 days';
  with vencidos as (
    select d.org_id, d.id as rem_id, d.data ->> 'cuando' as cuando, d.data ->> 'titulo' as titulo, d.data ->> 'w' as w, lower(d.dueno) as dueno
    from docs d
    where d.col = 'rems'
      and coalesce(d.data ->> 'hecho', 'false') <> 'true'
      and d.data ->> 'cuando' ~ '^\d{4}-\d\d-\d\dT\d\d:\d\d$'
      and (d.data ->> 'cuando')::timestamp <= v_ahora
      and (d.data ->> 'cuando')::timestamp > v_ahora - interval '15 minutes'
  ), nuevos as (
    insert into push_enviados (org_id, rem_id, cuando)
    select org_id, rem_id, cuando from vencidos
    on conflict do nothing
    returning org_id, rem_id, cuando
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth,
      'title', 'Recordatorio', 'body', v.titulo, 'tag', 'rem-' || v.rem_id,
      'url', '/?rem=' || v.rem_id || '&w=' || coalesce(v.w, ''))), '[]'::jsonb)
  into v_out
  from vencidos v
  join nuevos n using (org_id, rem_id, cuando)
  join push_subs s on s.org_id = v.org_id
  join miembros m on m.user_id = s.user_id and m.org_id = v.org_id and m.activo
  where (v.dueno is not null and v.dueno <> '' and lower(s.email) = v.dueno)
     or ((v.dueno is null or v.dueno = '') and m.rol = 'admin');
  return v_out;
end $$;

revoke execute on function public.guardar_push(text, text, text), public.quitar_push(text), public.push_pendientes() from public, anon;
grant execute on function public.guardar_push(text, text, text), public.quitar_push(text) to authenticated;
revoke execute on function public.push_pendientes() from authenticated;
grant execute on function public.push_pendientes() to service_role;

-- cada minuto: llamar a la función que envía (con la llave privada de pg_cron)
select cron.unschedule('renueva-push') where exists (select 1 from cron.job where jobname = 'renueva-push');
select cron.schedule('renueva-push', '* * * * *', $cron$
  select net.http_post(
    url := 'https://wfypxmhighfqqzpfqnpj.supabase.co/functions/v1/push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-key', (select cron_key from public.push_config where id = 1)),
    body := '{"action":"cron"}'::jsonb,
    timeout_milliseconds := 20000)
$cron$);
