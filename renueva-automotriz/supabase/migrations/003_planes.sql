-- Renueva Automotriz -> planes de suscripción con límite de usuarios
-- Standard: 1 usuario · Media: hasta 3 usuarios · Premium: hasta 7 usuarios
-- Siempre debe existir exactamente 1 admin; el resto son vendedor o readonly.

-- =========================================================
-- negocio_config: agrega plan + max_usuarios (derivado del plan)
-- =========================================================

alter table public.negocio_config add column if not exists plan text not null default 'standard'
  check (plan in ('standard', 'media', 'premium'));
alter table public.negocio_config add column if not exists max_usuarios int not null default 1;

create or replace function public.sync_max_usuarios() returns trigger
language plpgsql as $$
begin
  new.max_usuarios := case new.plan
    when 'standard' then 1
    when 'media' then 3
    when 'premium' then 7
    else 1
  end;
  return new;
end;
$$;

drop trigger if exists trg_sync_max_usuarios on public.negocio_config;
create trigger trg_sync_max_usuarios
  before insert or update of plan on public.negocio_config
  for each row execute procedure public.sync_max_usuarios();

-- Aplica el trigger a la fila existente (fuerza recálculo de max_usuarios)
update public.negocio_config set plan = plan;

-- =========================================================
-- Bloquea nuevos usuarios (profiles) por sobre el límite del plan
-- =========================================================

create or replace function public.chequear_limite_usuarios() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  limite int;
  actuales int;
begin
  select max_usuarios into limite from public.negocio_config limit 1;
  select count(*) into actuales from public.profiles;

  if limite is not null and actuales >= limite then
    raise exception 'Límite de usuarios del plan alcanzado (% de %). Sube de plan en Ajustes para agregar más.', actuales, limite
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_limite_usuarios on public.profiles;
create trigger trg_limite_usuarios
  before insert on public.profiles
  for each row execute procedure public.chequear_limite_usuarios();

-- =========================================================
-- Garantiza que siempre exista al menos 1 admin
-- (evita que el único admin se autodegrade o alguien lo degrade sin reemplazo)
-- =========================================================

create or replace function public.chequear_ultimo_admin() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  admins_restantes int;
begin
  if old.rol = 'admin' and new.rol <> 'admin' then
    select count(*) into admins_restantes from public.profiles where rol = 'admin' and id <> old.id;
    if admins_restantes = 0 then
      raise exception 'Debe quedar al menos un usuario admin' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_ultimo_admin on public.profiles;
create trigger trg_ultimo_admin
  before update of rol on public.profiles
  for each row execute procedure public.chequear_ultimo_admin();
