-- =====================================================================
-- GESTIX · catálogo en línea y refuerzos de seguridad
--  1. Un registro no cambia de empresa, colección ni id (cierra el atajo
--     items → contactos → items para saltarse la aprobación del dueño).
--  2. Límites para los formularios y páginas públicas (por IP, empresa e ítem).
--  3. Catálogo en línea: enlace legible y revocable por empresa y mundo.
--  4. Invitaciones con vencimiento y solo para correos confirmados.
--  5. Archivos: tamaño y tipos permitidos; el vendedor solo borra lo suyo.
--  6. Las notas internas de la plataforma no se exponen a los clientes.
-- =====================================================================

-- 1 ---------------------------------------------------------------- integridad de los registros
create or replace function public.trg_docs_00_integridad() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' then
    if new.org_id is distinct from old.org_id or new.col is distinct from old.col or new.id is distinct from old.id then
      raise exception 'Un registro no se puede mover de colección' using errcode = 'P0001';
    end if;
    if new.mundo is distinct from old.mundo and public.es_vendedor(old.org_id) then
      raise exception 'Solo el administrador puede cambiar el mundo de un registro' using errcode = 'P0001';
    end if;
  end if;
  new.updated_at := now();
  if auth.uid() is not null then new.updated_by := auth.uid(); end if;
  return new;
end $$;
drop trigger if exists docs_00_integridad on public.docs;   -- "00": corre antes que los demás triggers
create trigger docs_00_integridad before insert or update on public.docs
  for each row execute function public.trg_docs_00_integridad();
revoke execute on function public.trg_docs_00_integridad() from public, anon, authenticated;

-- 2 ---------------------------------------------------------------- límites para lo público
create table if not exists public.limites_publicos (
  k text primary key,
  n int not null default 0,
  desde timestamptz not null default now()
);
alter table public.limites_publicos enable row level security;
revoke all on public.limites_publicos from anon, authenticated;

create or replace function public.permitir(p_k text, p_max int, p_ventana interval) returns boolean
language plpgsql security definer set search_path = public as $$
declare v int;
begin
  insert into limites_publicos as l (k, n, desde) values (p_k, 1, now())
  on conflict (k) do update set
    n = case when l.desde < now() - p_ventana then 1 else l.n + 1 end,
    desde = case when l.desde < now() - p_ventana then now() else l.desde end
  returning n into v;
  return v <= p_max;
end $$;
revoke execute on function public.permitir(text, int, interval) from public, anon, authenticated;
grant execute on function public.permitir(text, int, interval) to service_role;

create index if not exists docs_leads_fono on public.docs (org_id, (data ->> 'fono')) where col = 'leads';

-- 3 ---------------------------------------------------------------- catálogo en línea
-- el enlace es /c/<slug>: legible, y si se filtra o se quiere dar de baja, se cambia el slug
create table if not exists public.catalogos (
  slug text primary key check (slug ~ '^[a-z0-9]([a-z0-9-]{1,58})[a-z0-9]$'),
  org_id uuid not null references public.orgs(id) on delete cascade,
  mundo text not null check (mundo in ('auto', 'prop', 'tienda')),
  activo boolean not null default true,
  creado timestamptz not null default now(),
  unique (org_id, mundo)
);
alter table public.catalogos enable row level security;
drop policy if exists catalogos_ver on public.catalogos;
create policy catalogos_ver on public.catalogos for select to authenticated using (org_id = public.mi_org());
drop policy if exists catalogos_crear on public.catalogos;
create policy catalogos_crear on public.catalogos for insert to authenticated
  with check (org_id = public.mi_org() and public.mi_rol() = 'admin' and public.org_escribible(org_id));
drop policy if exists catalogos_editar on public.catalogos;
create policy catalogos_editar on public.catalogos for update to authenticated
  using (org_id = public.mi_org() and public.mi_rol() = 'admin') with check (org_id = public.mi_org() and public.mi_rol() = 'admin');
drop policy if exists catalogos_borrar on public.catalogos;
create policy catalogos_borrar on public.catalogos for delete to authenticated
  using (org_id = public.mi_org() and public.mi_rol() = 'admin');
grant select, insert, update, delete on public.catalogos to authenticated;

-- 4 ---------------------------------------------------------------- invitaciones
alter table public.invitaciones add column if not exists expira timestamptz not null default now() + interval '14 days';

create or replace function public.aceptar_invitacion(p_token text, p_nombre text default '') returns uuid
language plpgsql security definer set search_path = public as $$
declare i invitaciones;
begin
  select * into i from invitaciones where token = p_token and aceptada_at is null and expira > now();
  if i is null then raise exception 'La invitación no existe, ya fue usada o venció. Pídele una nueva al administrador.' using errcode = 'P0001'; end if;
  if lower(i.email) <> lower(auth.jwt() ->> 'email') then
    raise exception 'Esta invitación es para %. Entra con ese correo.', i.email using errcode = 'P0001';
  end if;
  if (select email_confirmed_at from auth.users where id = auth.uid()) is null then
    raise exception 'Confirma tu correo antes de unirte a la empresa' using errcode = 'P0001';
  end if;
  if exists (select 1 from miembros where user_id = auth.uid()) then raise exception 'Tu usuario ya pertenece a una empresa' using errcode = 'P0001'; end if;
  update invitaciones set aceptada_at = now() where id = i.id;
  insert into miembros (org_id, user_id, nombre, email, rol, mundos)
    values (i.org_id, auth.uid(), coalesce(nullif(trim(p_nombre), ''), nullif(i.nombre, ''), split_part(i.email, '@', 1)), i.email, i.rol, i.mundos);
  return i.org_id;
end $$;

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
        where i.aceptada_at is null and i.expira > now() and lower(i.email) = lower(auth.jwt() ->> 'email')
          and (select email_confirmed_at from auth.users where id = auth.uid()) is not null), '[]'::jsonb),
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

-- 5 ---------------------------------------------------------------- archivos
update storage.buckets set file_size_limit = 8 * 1024 * 1024,
       allowed_mime_types = array['image/jpeg', 'image/png', 'application/pdf'] where id = 'archivos';
drop policy if exists archivos_subir on storage.objects;
create policy archivos_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'archivos' and (storage.foldername(name))[1] = public.mi_org()::text
              and name ~ ('^' || public.mi_org()::text || '/[0-9a-f-]{36}\.(jpg|png|pdf)$')
              and public.mi_rol() in ('admin', 'vendedor') and public.org_escribible(public.mi_org()));
drop policy if exists archivos_borrar on storage.objects;
create policy archivos_borrar on storage.objects for delete to authenticated
  using (bucket_id = 'archivos' and (storage.foldername(name))[1] = public.mi_org()::text
         and (public.mi_rol() = 'admin' or (public.mi_rol() = 'vendedor' and owner_id = auth.uid()::text)));

-- 6 ---------------------------------------------------------------- notas internas de la plataforma
-- los clientes leen su empresa con mi_contexto(); la tabla directa solo expone columnas no internas
revoke select on public.orgs from anon, authenticated;
grant select (id, nombre, plan, ciclo, mundos, extra_usuarios, extra_mundos, trial_hasta, pagado_hasta, suspendida, flow_cancelada, created_at)
  on public.orgs to authenticated;

-- las páginas públicas (ficha y catálogo) se pausan si la empresa no está al día
grant execute on function public.org_escribible(uuid) to service_role;
