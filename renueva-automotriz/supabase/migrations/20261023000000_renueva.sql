-- =====================================================================
-- RENUEVA · base de datos (multiempresa)
-- Cada empresa (org) tiene sus miembros (1 admin + vendedores / solo lectura),
-- sus datos como documentos JSON por colección y su suscripción.
-- Se puede correr completo en el SQL Editor de Supabase (es repetible).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- planes
create table if not exists public.planes (
  k text primary key,
  nombre text not null,
  usuarios int not null,
  mundos int not null,
  precio_mensual int not null,          -- CLP, IVA incluido
  precio_anual int not null,
  flow_plan_mensual text,               -- planId creado en Flow
  flow_plan_anual text,
  orden int not null default 0
);
insert into public.planes (k, nombre, usuarios, mundos, precio_mensual, precio_anual, flow_plan_mensual, flow_plan_anual, orden) values
  ('standard', 'Standard', 1, 1, 19990, 199900, 'renueva_standard_m', 'renueva_standard_a', 1),
  ('media',    'Media',    3, 2, 39990, 399900, 'renueva_media_m',    'renueva_media_a',    2),
  ('premium',  'Premium',  7, 3, 69990, 699900, 'renueva_premium_m',  'renueva_premium_a',  3)
on conflict (k) do nothing;

-- ---------------------------------------------------------------- empresas
create table if not exists public.orgs (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  plan text not null default 'premium' references public.planes(k),
  ciclo text not null default 'mensual' check (ciclo in ('mensual', 'anual')),
  mundos text[] not null default array['auto', 'prop', 'tienda'],
  extra_usuarios int not null default 0,
  extra_mundos int not null default 0,
  trial_hasta timestamptz not null default now() + interval '14 days',
  pagado_hasta timestamptz,                 -- hasta cuándo está pagado (Flow o activación manual)
  suspendida boolean not null default false,
  flow_customer_id text,
  flow_subscription_id text,
  flow_cancelada boolean not null default false,
  plan_pendiente jsonb,                     -- plan elegido mientras registra la tarjeta
  notas text,                               -- notas internas de la plataforma
  creado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.miembros (
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null default '',
  email text not null default '',
  rol text not null check (rol in ('admin', 'vendedor', 'lectura')),
  mundos text[] not null default array['auto', 'prop', 'tienda'],
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
-- exactamente un administrador por empresa
create unique index if not exists miembros_un_admin on public.miembros (org_id) where rol = 'admin';
-- una persona pertenece a una sola empresa
create unique index if not exists miembros_una_org on public.miembros (user_id);

create table if not exists public.invitaciones (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default encode(gen_random_bytes(18), 'hex'),
  org_id uuid not null references public.orgs(id) on delete cascade,
  email text not null,
  nombre text not null default '',
  rol text not null check (rol in ('vendedor', 'lectura')),
  mundos text[] not null,
  creado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  aceptada_at timestamptz
);
create unique index if not exists invitaciones_pendiente on public.invitaciones (org_id, lower(email)) where aceptada_at is null;

-- datos de la app: un documento JSON por registro (vehículo, venta, consulta…)
create table if not exists public.docs (
  org_id uuid not null references public.orgs(id) on delete cascade,
  col text not null check (col in ('items', 'ventas', 'gastos', 'equipo', 'leads', 'rems', 'contactos', 'config')),
  id text not null,
  mundo text check (mundo in ('auto', 'prop', 'tienda')),
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid(),
  primary key (org_id, col, id)
);
alter table public.docs replica identity full;

create table if not exists public.pagos (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  proveedor text not null default 'flow',
  referencia text,
  monto int not null default 0,
  estado text not null,
  periodo_hasta timestamptz,
  detalle jsonb,
  created_at timestamptz not null default now(),
  unique (proveedor, referencia)
);

create table if not exists public.plataforma_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- ---------------------------------------------------------------- funciones de apoyo
create or replace function public.es_plataforma() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from plataforma_admins where user_id = auth.uid())
$$;

create or replace function public.mi_org() returns uuid
language sql stable security definer set search_path = public as $$
  select org_id from miembros where user_id = auth.uid() and activo limit 1
$$;

create or replace function public.mi_rol() returns text
language sql stable security definer set search_path = public as $$
  select rol from miembros where user_id = auth.uid() and activo limit 1
$$;

-- ¿puede la empresa seguir registrando? (prueba vigente o pago al día, con 5 días de gracia)
create or replace function public.org_escribible(p_org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select not suspendida and (trial_hasta > now() or coalesce(pagado_hasta, '-infinity') + interval '5 days' > now())
                   from orgs where id = p_org), false)
$$;

create or replace function public.puede_ver(p_org uuid, p_mundo text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from miembros m join orgs o on o.id = m.org_id
                 where m.org_id = p_org and m.user_id = auth.uid() and m.activo
                   and (p_mundo is null or m.rol = 'admin' or p_mundo = any (m.mundos)))
$$;

create or replace function public.puede_escribir(p_org uuid, p_mundo text, p_col text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.org_escribible(p_org) and exists (
    select 1 from miembros m join orgs o on o.id = m.org_id
    where m.org_id = p_org and m.user_id = auth.uid() and m.activo
      and (m.rol = 'admin'
           or (m.rol = 'vendedor' and p_col not in ('config', 'equipo')
               and p_mundo = any (m.mundos) and p_mundo = any (o.mundos))))
$$;

create or replace function public.limite_usuarios(p_org uuid) returns int
language sql stable security definer set search_path = public as $$
  select p.usuarios + o.extra_usuarios from orgs o join planes p on p.k = o.plan where o.id = p_org
$$;

create or replace function public.usados_usuarios(p_org uuid) returns int
language sql stable security definer set search_path = public as $$
  select (select count(*) from miembros where org_id = p_org and activo)::int
       + (select count(*) from invitaciones where org_id = p_org and aceptada_at is null)::int
$$;

-- ---------------------------------------------------------------- reglas de límites
create or replace function public.trg_miembros_limite() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.activo and (tg_op = 'INSERT' or not old.activo) then
    if (select count(*) from miembros where org_id = new.org_id and activo and user_id <> new.user_id)
       + (select count(*) from invitaciones where org_id = new.org_id and aceptada_at is null and lower(email) <> lower(new.email))
       >= limite_usuarios(new.org_id) then
      raise exception 'Llegaste al límite de usuarios de tu plan' using errcode = 'P0001';
    end if;
  end if;
  if tg_op = 'UPDATE' and old.rol = 'admin' and (new.rol <> 'admin' or not new.activo) then
    raise exception 'La empresa siempre necesita un administrador activo' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists miembros_limite on public.miembros;
create trigger miembros_limite before insert or update on public.miembros
  for each row execute function public.trg_miembros_limite();

create or replace function public.trg_orgs_mundos() returns trigger
language plpgsql security definer set search_path = public as $$
declare lim int;
begin
  select p.mundos + new.extra_mundos into lim from planes p where p.k = new.plan;
  if coalesce(array_length(new.mundos, 1), 0) < 1 then raise exception 'Debe haber al menos un mundo activo' using errcode = 'P0001'; end if;
  if array_length(new.mundos, 1) > lim then raise exception 'Tu plan permite % mundo(s)', lim using errcode = 'P0001'; end if;
  return new;
end $$;
drop trigger if exists orgs_mundos on public.orgs;
create trigger orgs_mundos before insert or update of mundos, plan, extra_mundos on public.orgs
  for each row execute function public.trg_orgs_mundos();

-- ---------------------------------------------------------------- RLS
alter table public.planes enable row level security;
alter table public.orgs enable row level security;
alter table public.miembros enable row level security;
alter table public.invitaciones enable row level security;
alter table public.docs enable row level security;
alter table public.pagos enable row level security;
alter table public.plataforma_admins enable row level security;

drop policy if exists planes_ver on public.planes;
create policy planes_ver on public.planes for select using (true);

drop policy if exists orgs_ver on public.orgs;
create policy orgs_ver on public.orgs for select using (id = public.mi_org() or public.es_plataforma());
-- los cambios a la empresa pasan por funciones (crear_organizacion, set_mundos, billing)

drop policy if exists miembros_ver on public.miembros;
create policy miembros_ver on public.miembros for select using (org_id = public.mi_org() or public.es_plataforma());

drop policy if exists invitaciones_ver on public.invitaciones;
create policy invitaciones_ver on public.invitaciones for select using ((org_id = public.mi_org() and public.mi_rol() = 'admin') or public.es_plataforma());

drop policy if exists docs_ver on public.docs;
create policy docs_ver on public.docs for select using (public.puede_ver(org_id, mundo));
drop policy if exists docs_crear on public.docs;
create policy docs_crear on public.docs for insert with check (public.puede_escribir(org_id, mundo, col));
drop policy if exists docs_editar on public.docs;
create policy docs_editar on public.docs for update using (public.puede_escribir(org_id, mundo, col)) with check (public.puede_escribir(org_id, mundo, col));
drop policy if exists docs_borrar on public.docs;
create policy docs_borrar on public.docs for delete using (public.puede_escribir(org_id, mundo, col));

drop policy if exists pagos_ver on public.pagos;
create policy pagos_ver on public.pagos for select using ((org_id = public.mi_org() and public.mi_rol() = 'admin') or public.es_plataforma());

drop policy if exists plataforma_ver on public.plataforma_admins;
create policy plataforma_ver on public.plataforma_admins for select using (user_id = auth.uid());

-- ---------------------------------------------------------------- funciones que usa la app
create or replace function public.mi_contexto() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare m miembros; o orgs; p planes;
begin
  if auth.uid() is null then return null; end if;
  select * into m from miembros where user_id = auth.uid() and activo limit 1;
  if m is null then
    return jsonb_build_object('org', null, 'plataforma', es_plataforma(),
      'invitaciones', coalesce((select jsonb_agg(jsonb_build_object('token', i.token, 'org', g.nombre, 'rol', i.rol))
        from invitaciones i join orgs g on g.id = i.org_id
        where i.aceptada_at is null and lower(i.email) = lower(auth.jwt() ->> 'email')), '[]'::jsonb),
      'inactivo', exists (select 1 from miembros where user_id = auth.uid() and not activo));
  end if;
  select * into o from orgs where id = m.org_id;
  select * into p from planes where k = o.plan;
  return jsonb_build_object(
    'org', jsonb_build_object('id', o.id, 'nombre', o.nombre, 'plan', o.plan, 'ciclo', o.ciclo, 'mundos', o.mundos,
      'extra_usuarios', o.extra_usuarios, 'extra_mundos', o.extra_mundos, 'trial_hasta', o.trial_hasta,
      'pagado_hasta', o.pagado_hasta, 'suspendida', o.suspendida, 'flow', o.flow_subscription_id is not null,
      'flow_cancelada', o.flow_cancelada),
    'miembro', jsonb_build_object('nombre', m.nombre, 'email', m.email, 'rol', m.rol, 'mundos', m.mundos),
    'plataforma', es_plataforma(),
    'escribible', org_escribible(o.id),
    'usuarios', usados_usuarios(o.id),
    'pagos', case when m.rol = 'admin' then coalesce((select jsonb_agg(jsonb_build_object('fecha', created_at, 'monto', monto, 'estado', estado) order by created_at desc)
      from (select * from pagos where org_id = o.id order by created_at desc limit 12) x), '[]'::jsonb) else '[]'::jsonb end);
end $$;

create or replace function public.crear_organizacion(p_nombre text, p_mundos text[], p_nombre_admin text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  if auth.uid() is null then raise exception 'Inicia sesión primero'; end if;
  if exists (select 1 from miembros where user_id = auth.uid()) then raise exception 'Tu usuario ya pertenece a una empresa' using errcode = 'P0001'; end if;
  if coalesce(trim(p_nombre), '') = '' then raise exception 'Escribe el nombre de tu empresa' using errcode = 'P0001'; end if;
  insert into orgs (nombre, mundos, creado_por)
    values (trim(p_nombre), coalesce(nullif(p_mundos, '{}'), array['auto', 'prop', 'tienda']), auth.uid())
    returning id into v_org;
  insert into miembros (org_id, user_id, nombre, email, rol, mundos)
    values (v_org, auth.uid(), coalesce(nullif(trim(p_nombre_admin), ''), split_part(auth.jwt() ->> 'email', '@', 1)), auth.jwt() ->> 'email', 'admin', array['auto', 'prop', 'tienda']);
  return v_org;
end $$;

create or replace function public.aceptar_invitacion(p_token text, p_nombre text default '') returns uuid
language plpgsql security definer set search_path = public as $$
declare i invitaciones;
begin
  select * into i from invitaciones where token = p_token and aceptada_at is null;
  if i is null then raise exception 'La invitación no existe o ya fue usada' using errcode = 'P0001'; end if;
  if lower(i.email) <> lower(auth.jwt() ->> 'email') then
    raise exception 'Esta invitación es para %. Entra con ese correo.', i.email using errcode = 'P0001';
  end if;
  if exists (select 1 from miembros where user_id = auth.uid()) then raise exception 'Tu usuario ya pertenece a una empresa' using errcode = 'P0001'; end if;
  update invitaciones set aceptada_at = now() where id = i.id;
  insert into miembros (org_id, user_id, nombre, email, rol, mundos)
    values (i.org_id, auth.uid(), coalesce(nullif(trim(p_nombre), ''), nullif(i.nombre, ''), split_part(i.email, '@', 1)), i.email, i.rol, i.mundos);
  return i.org_id;
end $$;

create or replace function public.listar_miembros() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'miembros', coalesce((select jsonb_agg(jsonb_build_object('id', user_id, 'nombre', nombre, 'email', email, 'rol', rol, 'mundos', mundos, 'activo', activo) order by rol <> 'admin', created_at)
                          from miembros where org_id = mi_org()), '[]'::jsonb),
    'invitaciones', case when mi_rol() = 'admin' then coalesce((select jsonb_agg(jsonb_build_object('id', id, 'nombre', nombre, 'email', email, 'rol', rol, 'mundos', mundos, 'token', token) order by created_at)
                          from invitaciones where org_id = mi_org() and aceptada_at is null), '[]'::jsonb) else '[]'::jsonb end)
$$;

create or replace function public.invitar(p_email text, p_nombre text, p_rol text, p_mundos text[]) returns text
language plpgsql security definer set search_path = public as $$
declare v_org uuid := mi_org(); v_token text;
begin
  if mi_rol() is distinct from 'admin' then raise exception 'Solo el administrador puede invitar' using errcode = 'P0001'; end if;
  if not org_escribible(v_org) then raise exception 'Tu cuenta está en solo lectura: elige un plan' using errcode = 'P0001'; end if;
  if exists (select 1 from miembros where org_id = v_org and lower(email) = lower(p_email)) then raise exception 'Esa persona ya es parte de tu empresa' using errcode = 'P0001'; end if;
  select token into v_token from invitaciones where org_id = v_org and lower(email) = lower(p_email) and aceptada_at is null;
  if v_token is not null then return v_token; end if;
  if usados_usuarios(v_org) >= limite_usuarios(v_org) then raise exception 'Llegaste al límite de usuarios de tu plan' using errcode = 'P0001'; end if;
  insert into invitaciones (org_id, email, nombre, rol, mundos, creado_por)
    values (v_org, lower(trim(p_email)), coalesce(p_nombre, ''), p_rol, p_mundos, auth.uid()) returning token into v_token;
  return v_token;
end $$;

create or replace function public.actualizar_miembro(p_user uuid, p_rol text, p_mundos text[], p_activo boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if mi_rol() is distinct from 'admin' then raise exception 'Solo el administrador puede cambiar permisos' using errcode = 'P0001'; end if;
  if p_rol not in ('vendedor', 'lectura') and p_user <> auth.uid() then raise exception 'Rol no válido' using errcode = 'P0001'; end if;
  update miembros set rol = case when p_user = auth.uid() then rol else p_rol end, mundos = p_mundos, activo = case when p_user = auth.uid() then true else p_activo end
   where org_id = mi_org() and user_id = p_user;
end $$;

create or replace function public.quitar_miembro(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if mi_rol() is distinct from 'admin' then raise exception 'Solo el administrador puede quitar usuarios' using errcode = 'P0001'; end if;
  if p_user = auth.uid() then raise exception 'No puedes quitarte a ti mismo' using errcode = 'P0001'; end if;
  delete from miembros where org_id = mi_org() and user_id = p_user and rol <> 'admin';
end $$;

create or replace function public.cancelar_invitacion(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if mi_rol() is distinct from 'admin' then raise exception 'Solo el administrador' using errcode = 'P0001'; end if;
  delete from invitaciones where id = p_id and org_id = mi_org() and aceptada_at is null;
end $$;

create or replace function public.set_mundos(p_mundos text[]) returns void
language plpgsql security definer set search_path = public as $$
begin
  if mi_rol() is distinct from 'admin' then raise exception 'Solo el administrador' using errcode = 'P0001'; end if;
  update orgs set mundos = p_mundos where id = mi_org();
end $$;

create or replace function public.renombrar_org(p_nombre text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if mi_rol() is distinct from 'admin' then raise exception 'Solo el administrador' using errcode = 'P0001'; end if;
  update orgs set nombre = trim(p_nombre) where id = mi_org() and trim(p_nombre) <> '';
end $$;

-- durante la prueba el admin puede elegir plan sin pagar todavía (queda definido al pagar)
create or replace function public.elegir_plan_prueba(p_plan text, p_ciclo text, p_mundos text[]) returns void
language plpgsql security definer set search_path = public as $$
begin
  if mi_rol() is distinct from 'admin' then raise exception 'Solo el administrador' using errcode = 'P0001'; end if;
  if usados_usuarios(mi_org()) > (select usuarios from planes where k = p_plan) + (select extra_usuarios from orgs where id = mi_org()) then
    raise exception 'Tienes más usuarios de los que permite ese plan' using errcode = 'P0001';
  end if;
  update orgs set plan = p_plan, ciclo = p_ciclo, mundos = p_mundos where id = mi_org() and trial_hasta > now() and flow_subscription_id is null;
end $$;

-- ---------------------------------------------------------------- panel de la plataforma (dueño de Renueva)
create or replace function public.plataforma_orgs() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not es_plataforma() then raise exception 'Sin permiso' using errcode = '42501'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
      'id', o.id, 'nombre', o.nombre, 'plan', o.plan, 'ciclo', o.ciclo, 'mundos', o.mundos, 'trial_hasta', o.trial_hasta,
      'pagado_hasta', o.pagado_hasta, 'suspendida', o.suspendida, 'flow', o.flow_subscription_id is not null, 'flow_cancelada', o.flow_cancelada,
      'extra_usuarios', o.extra_usuarios, 'extra_mundos', o.extra_mundos, 'notas', o.notas, 'created_at', o.created_at,
      'escribible', org_escribible(o.id),
      'admin', (select jsonb_build_object('nombre', nombre, 'email', email) from miembros where org_id = o.id and rol = 'admin'),
      'usuarios', (select count(*) from miembros where org_id = o.id and activo),
      'registros', (select count(*) from docs where org_id = o.id),
      'ultimo_uso', (select max(updated_at) from docs where org_id = o.id),
      'cobrado', (select coalesce(sum(monto), 0) from pagos where org_id = o.id and estado = 'pagado'))
    order by o.created_at desc) from orgs o), '[]'::jsonb);
end $$;

create or replace function public.plataforma_set_org(p_org uuid, p_cambios jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not es_plataforma() then raise exception 'Sin permiso' using errcode = '42501'; end if;
  update orgs set
    plan = coalesce(p_cambios ->> 'plan', plan),
    ciclo = coalesce(p_cambios ->> 'ciclo', ciclo),
    trial_hasta = coalesce((p_cambios ->> 'trial_hasta')::timestamptz, trial_hasta),
    pagado_hasta = case when p_cambios ? 'pagado_hasta' then (p_cambios ->> 'pagado_hasta')::timestamptz else pagado_hasta end,
    suspendida = coalesce((p_cambios ->> 'suspendida')::boolean, suspendida),
    extra_usuarios = coalesce((p_cambios ->> 'extra_usuarios')::int, extra_usuarios),
    extra_mundos = coalesce((p_cambios ->> 'extra_mundos')::int, extra_mundos),
    notas = coalesce(p_cambios ->> 'notas', notas)
  where id = p_org;
  if p_cambios ? 'pago_manual' then
    insert into pagos (org_id, proveedor, referencia, monto, estado, periodo_hasta, detalle)
    values (p_org, 'manual', gen_random_uuid()::text, coalesce((p_cambios ->> 'pago_manual')::int, 0), 'pagado', (p_cambios ->> 'pagado_hasta')::timestamptz, p_cambios);
  end if;
end $$;

-- ---------------------------------------------------------------- permisos de ejecución
revoke all on function public.plataforma_orgs() from public, anon;
revoke all on function public.plataforma_set_org(uuid, jsonb) from public, anon;
grant execute on function public.mi_contexto(), public.crear_organizacion(text, text[], text), public.aceptar_invitacion(text, text),
  public.listar_miembros(), public.invitar(text, text, text, text[]), public.actualizar_miembro(uuid, text, text[], boolean),
  public.quitar_miembro(uuid), public.cancelar_invitacion(uuid), public.set_mundos(text[]), public.renombrar_org(text),
  public.elegir_plan_prueba(text, text, text[]), public.plataforma_orgs(), public.plataforma_set_org(uuid, jsonb) to authenticated;

-- nadie sin sesión llama funciones de Renueva; los disparadores no se llaman por API
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname in ('aceptar_invitacion','actualizar_miembro','cancelar_invitacion','crear_organizacion','elegir_plan_prueba','es_plataforma','invitar','limite_usuarios','listar_miembros','mi_contexto','mi_org','mi_rol','org_escribible','puede_escribir','puede_ver','quitar_miembro','renombrar_org','set_mundos','trg_miembros_limite','trg_orgs_mundos','usados_usuarios','plataforma_orgs','plataforma_set_org')
  loop
    execute format('revoke execute on function %s from public, anon', f.sig);
    if f.proname like 'trg_%' then execute format('revoke execute on function %s from authenticated', f.sig);
    else execute format('grant execute on function %s to authenticated', f.sig); end if;
  end loop;
end $$;

-- ---------------------------------------------------------------- tiempo real (cambios de otros usuarios en vivo)
do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null; when undefined_object then null; end $$;

-- ---------------------------------------------------------------- archivos (fotos y comprobantes)
insert into storage.buckets (id, name, public) values ('archivos', 'archivos', false) on conflict (id) do nothing;
drop policy if exists archivos_ver on storage.objects;
create policy archivos_ver on storage.objects for select to authenticated
  using (bucket_id = 'archivos' and (storage.foldername(name))[1] = public.mi_org()::text);
drop policy if exists archivos_subir on storage.objects;
create policy archivos_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'archivos' and (storage.foldername(name))[1] = public.mi_org()::text
              and public.mi_rol() in ('admin', 'vendedor') and public.org_escribible(public.mi_org()));
drop policy if exists archivos_borrar on storage.objects;
create policy archivos_borrar on storage.objects for delete to authenticated
  using (bucket_id = 'archivos' and (storage.foldername(name))[1] = public.mi_org()::text and public.mi_rol() in ('admin', 'vendedor'));
