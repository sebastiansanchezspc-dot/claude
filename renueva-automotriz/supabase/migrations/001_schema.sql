-- Renueva Automotriz — esquema inicial + RLS
-- Ejecutar en el SQL Editor de Supabase (o via supabase db push)

create extension if not exists "pgcrypto";

-- =========================================================
-- TABLAS
-- =========================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text,
  rol text not null default 'vendedor' check (rol in ('admin', 'vendedor', 'readonly')),
  fono text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.vendedores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  fono text,
  activo boolean not null default true,
  comision_tipo text not null default 'pct' check (comision_tipo in ('pct', 'monto')),
  comision_valor numeric not null default 0 check (comision_valor >= 0),
  created_at timestamptz not null default now(),
  automotora_id uuid
);

create table if not exists public.autos (
  id uuid primary key default gen_random_uuid(),
  marca text not null,
  modelo text not null,
  anio int,
  tipo text,
  color text,
  km int default 0,
  patente text,
  costo numeric not null default 0,
  pagos_compra jsonb not null default '[]'::jsonb,
  prov_nombre text,
  prov_fono text,
  vendedor_compra_id uuid references public.vendedores (id) on delete set null,
  notas text,
  fecha_ingreso date not null default current_date,
  estado text not null default 'disponible' check (estado in ('disponible', 'vendido')),
  precio_venta numeric,
  fecha_venta date,
  vendedor_venta_id uuid references public.vendedores (id) on delete set null,
  cliente_nombre text,
  cliente_fono text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);

create table if not exists public.ventas (
  id uuid primary key default gen_random_uuid(),
  auto_id uuid not null references public.autos (id) on delete cascade,
  fecha date not null default current_date,
  vendedor_id uuid references public.vendedores (id) on delete set null,
  pagos jsonb not null default '[]'::jsonb,
  cliente_nombre text,
  cliente_fono text,
  comision_tipo text default 'pct' check (comision_tipo in ('pct', 'monto')),
  comision_valor numeric default 0,
  precio_venta numeric not null default 0,
  costo numeric not null default 0,
  ganancia numeric not null default 0,
  comision numeric not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);

create table if not exists public.gastos (
  id uuid primary key default gen_random_uuid(),
  concepto text not null,
  categoria text not null default 'otro' check (categoria in ('arriendo', 'sueldo', 'servicio', 'marketing', 'mantención', 'otro')),
  monto numeric not null default 0,
  fecha date not null default current_date,
  es_fijo boolean not null default false,
  notas text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);

create table if not exists public.temas (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  tema_key text not null default 'azul'
);

create index if not exists idx_autos_estado on public.autos (estado);
create index if not exists idx_ventas_fecha on public.ventas (fecha);
create index if not exists idx_ventas_vendedor on public.ventas (vendedor_id);
create index if not exists idx_gastos_fecha on public.gastos (fecha);

-- =========================================================
-- HELPERS DE ROL (evitan recursión RLS en profiles)
-- =========================================================

create or replace function public.current_role_() returns text
language sql stable security definer set search_path = public as $$
  select rol from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select rol from public.profiles where id = auth.uid()) = 'admin', false);
$$;

-- =========================================================
-- TRIGGER: crear profile automáticamente al registrarse
-- =========================================================

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nombre, rol, activo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'rol', 'vendedor'),
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================
-- RLS
-- =========================================================

alter table public.profiles enable row level security;
alter table public.vendedores enable row level security;
alter table public.autos enable row level security;
alter table public.ventas enable row level security;
alter table public.gastos enable row level security;
alter table public.temas enable row level security;

-- PROFILES: cada uno ve/edita el suyo; admin ve y edita todos
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert
  with check (id = auth.uid() or public.is_admin());

-- VENDEDORES: todos los roles autenticados pueden leer; solo admin escribe
drop policy if exists vendedores_select on public.vendedores;
create policy vendedores_select on public.vendedores for select
  using (auth.uid() is not null);

drop policy if exists vendedores_write on public.vendedores;
create policy vendedores_write on public.vendedores for all
  using (public.is_admin()) with check (public.is_admin());

-- AUTOS (stock): todos los roles autenticados pueden leer; solo admin escribe/edita
drop policy if exists autos_select on public.autos;
create policy autos_select on public.autos for select
  using (auth.uid() is not null);

drop policy if exists autos_insert on public.autos;
create policy autos_insert on public.autos for insert
  with check (public.is_admin());

drop policy if exists autos_update on public.autos;
create policy autos_update on public.autos for update
  using (
    public.is_admin()
    or (public.current_role_() = 'vendedor' and estado = 'disponible')
  );

drop policy if exists autos_delete on public.autos;
create policy autos_delete on public.autos for delete
  using (public.is_admin());

-- VENTAS:
--   admin: todo
--   vendedor: lee/crea/edita solo sus propias ventas (vendedor_id le pertenece)
--   readonly: solo lectura de todo (sin ver comisiones se filtra en la app; RLS deja pasar fila completa
--             porque la comisión es un dato de la venta, no un campo separado con RLS de columna)
drop policy if exists ventas_select_admin on public.ventas;
create policy ventas_select_admin on public.ventas for select
  using (public.is_admin());

drop policy if exists ventas_select_propias on public.ventas;
create policy ventas_select_propias on public.ventas for select
  using (
    public.current_role_() = 'vendedor'
    and vendedor_id in (select id from public.vendedores where nombre = (select nombre from public.profiles where id = auth.uid()))
  );

drop policy if exists ventas_select_readonly on public.ventas;
create policy ventas_select_readonly on public.ventas for select
  using (public.current_role_() = 'readonly');

drop policy if exists ventas_insert on public.ventas;
create policy ventas_insert on public.ventas for insert
  with check (
    public.is_admin()
    or (
      public.current_role_() = 'vendedor'
      and vendedor_id in (select id from public.vendedores where nombre = (select nombre from public.profiles where id = auth.uid()))
    )
  );

drop policy if exists ventas_update on public.ventas;
create policy ventas_update on public.ventas for update
  using (
    public.is_admin()
    or (
      public.current_role_() = 'vendedor'
      and vendedor_id in (select id from public.vendedores where nombre = (select nombre from public.profiles where id = auth.uid()))
    )
  );

drop policy if exists ventas_delete on public.ventas;
create policy ventas_delete on public.ventas for delete
  using (public.is_admin());

-- GASTOS: solo admin lee y escribe (vendedor y readonly no ven gastos)
drop policy if exists gastos_all on public.gastos;
create policy gastos_all on public.gastos for all
  using (public.is_admin()) with check (public.is_admin());

-- TEMAS: cada usuario administra su propio tema
drop policy if exists temas_all on public.temas;
create policy temas_all on public.temas for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
