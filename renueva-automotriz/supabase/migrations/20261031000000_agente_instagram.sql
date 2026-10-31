-- =====================================================================
-- RENUEVA · agente de diseño para Instagram
-- Cuando un vehículo (mundo auto) recibe fotos nuevas, se llama a la función
-- "agente-ig", que arma una pieza 1080×1350 con la marca de la empresa y la
-- envía por correo al vendedor. Cada empresa puede apagarlo con orgs.agente_ig.
-- =====================================================================

alter table public.orgs add column if not exists agente_ig boolean not null default true;

-- historial de piezas generadas (una por tanda de fotos de cada vehículo)
create table if not exists public.ig_piezas (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  item_id text not null,
  fotos_sig text not null,
  estado text not null default 'procesando' check (estado in ('procesando', 'enviada', 'omitida', 'error')),
  imagen text,
  caption text,
  diseno jsonb,
  enviado_a text[],
  error text,
  created_at timestamptz not null default now(),
  unique (org_id, item_id, fotos_sig)
);
create index if not exists ig_piezas_org on public.ig_piezas (org_id, created_at desc);
alter table public.ig_piezas enable row level security;
revoke all on public.ig_piezas from anon, authenticated;
-- los miembros de la empresa pueden ver sus piezas
create policy ig_piezas_ver on public.ig_piezas for select to authenticated using (org_id = mi_org());
grant select on public.ig_piezas to authenticated;

-- rutas de fotos subidas a la nube (las de demo vienen como data: y se ignoran)
create or replace function public.fotos_de(p_org uuid, p_data jsonb) returns text[]
language sql immutable set search_path = public as $$
  select coalesce(array_agg(f order by n), '{}')
  from jsonb_array_elements_text(case when jsonb_typeof(p_data -> 'fotos') = 'array' then p_data -> 'fotos' else '[]'::jsonb end) with ordinality as t(f, n)
  where f like p_org::text || '/%'
$$;

create or replace function public.agente_ig_disparar() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_nuevas text[]; v_viejas text[];
begin
  v_nuevas := fotos_de(new.org_id, new.data);
  v_viejas := case when tg_op = 'UPDATE' then fotos_de(old.org_id, old.data) else '{}' end;
  -- solo si apareció al menos una foto que antes no estaba
  if not exists (select 1 from unnest(v_nuevas) f where f <> all (v_viejas)) then return new; end if;
  if not exists (select 1 from orgs where id = new.org_id and agente_ig and not suspendida) then return new; end if;
  begin
    perform net.http_post(
      url := 'https://wfypxmhighfqqzpfqnpj.supabase.co/functions/v1/agente-ig',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-key', (select cron_key from push_config where id = 1)),
      body := jsonb_build_object('org_id', new.org_id, 'item_id', new.id, 'sig', array_to_string(v_nuevas, '|')),
      timeout_milliseconds := 10000);
  exception when others then
    raise warning 'agente-ig: %', sqlerrm; -- nunca impedir que se guarde el vehículo
  end;
  return new;
end $$;
revoke execute on function public.agente_ig_disparar() from public, anon, authenticated;

drop trigger if exists agente_ig on public.docs;
create trigger agente_ig after insert or update of data on public.docs
  for each row when (new.col = 'items' and new.mundo = 'auto')
  execute function public.agente_ig_disparar();
