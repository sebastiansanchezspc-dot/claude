-- Renueva Automotriz -> app multi-rubro (Automotriz / Inmobiliaria / Retail general)
-- Generaliza la tabla `autos` a `items` con atributos dinámicos por rubro y soporte
-- de stock por cantidad (retail). Ejecutar después de 001_schema.sql.

-- =========================================================
-- CONFIGURACIÓN DEL NEGOCIO (qué rubros están activos)
-- =========================================================

create table if not exists public.negocio_config (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique,
  nombre_negocio text not null default 'Mi Negocio',
  rubros_activos text[] not null default array['automotriz'],
  created_at timestamptz not null default now()
);

insert into public.negocio_config (nombre_negocio, rubros_activos)
values ('Renueva', array['automotriz', 'inmobiliaria', 'retail'])
on conflict (singleton) do nothing;

alter table public.negocio_config enable row level security;

drop policy if exists negocio_config_select on public.negocio_config;
create policy negocio_config_select on public.negocio_config for select
  using (auth.uid() is not null);

drop policy if exists negocio_config_update on public.negocio_config;
create policy negocio_config_update on public.negocio_config for update
  using (public.is_admin()) with check (public.is_admin());

-- =========================================================
-- GENERALIZAR autos -> items
-- =========================================================

alter table public.autos rename to items;

alter table public.items add column if not exists rubro text not null default 'automotriz'
  check (rubro in ('automotriz', 'inmobiliaria', 'retail'));
alter table public.items add column if not exists nombre text;
alter table public.items add column if not exists sku text;
alter table public.items add column if not exists atributos jsonb not null default '{}'::jsonb;
alter table public.items add column if not exists stock_cantidad int not null default 1;
alter table public.items add column if not exists stock_inicial int not null default 1;
alter table public.items add column if not exists costo_unitario numeric;

-- Migra los datos existentes (autos) hacia nombre / sku / atributos
update public.items set
  nombre = coalesce(nombre, trim(coalesce(marca, '') || ' ' || coalesce(modelo, ''))),
  sku = coalesce(sku, patente),
  atributos = coalesce(atributos, '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object(
    'marca', marca, 'modelo', modelo, 'anio', anio, 'km', km, 'color', color, 'tipo', tipo
  )),
  costo_unitario = coalesce(costo_unitario, costo)
where rubro = 'automotriz';

alter table public.items drop column if exists marca;
alter table public.items drop column if exists modelo;
alter table public.items drop column if exists anio;
alter table public.items drop column if exists km;
alter table public.items drop column if exists color;
alter table public.items drop column if exists tipo;
alter table public.items drop column if exists patente;

alter table public.items alter column nombre set not null;

alter table public.items drop constraint if exists autos_estado_check;
alter table public.items add constraint items_estado_check
  check (estado in ('disponible', 'reservado', 'vendido', 'agotado'));

comment on column public.items.rubro is 'automotriz | inmobiliaria | retail';
comment on column public.items.atributos is 'campos dinámicos según el rubro, ver src/lib/rubros.js';
comment on column public.items.stock_cantidad is 'unidades disponibles actualmente (retail); siempre 1 en automotriz/inmobiliaria';
comment on column public.items.stock_inicial is 'unidades ingresadas originalmente, para referencia';
comment on column public.items.costo_unitario is 'costo por unidad = costo / stock_inicial, usado para calcular ganancia en ventas parciales (retail)';

-- =========================================================
-- GENERALIZAR ventas.auto_id -> ventas.item_id + cantidad
-- =========================================================

alter table public.ventas rename column auto_id to item_id;
alter table public.ventas add column if not exists cantidad int not null default 1;

-- =========================================================
-- Renombrar índices y políticas ligadas al nombre anterior
-- (las políticas siguen apuntando a la tabla renombrada automáticamente,
-- solo las renombramos para que el nombre sea consistente)
-- =========================================================

alter policy if exists autos_select on public.items rename to items_select;
alter policy if exists autos_insert on public.items rename to items_insert;
alter policy if exists autos_update on public.items rename to items_update;
alter policy if exists autos_delete on public.items rename to items_delete;

drop index if exists idx_autos_estado;
create index if not exists idx_items_estado on public.items (estado);
create index if not exists idx_items_rubro on public.items (rubro);
