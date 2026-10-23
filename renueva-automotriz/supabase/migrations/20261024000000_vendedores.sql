-- =====================================================================
-- RENUEVA · cada vendedor ve solo lo suyo
-- Las ventas, consultas, recordatorios y la ficha de equipo llevan "dueño"
-- (el correo del vendedor). Un vendedor solo recibe y modifica lo suyo; no ve
-- gastos. El stock y los contactos son compartidos. Admin y solo lectura ven todo.
-- =====================================================================

alter table public.docs add column if not exists dueno text;
create index if not exists docs_dueno on public.docs (org_id, lower(dueno));

create or replace function public.mi_email() returns text
language sql stable as $$ select lower(coalesce(auth.jwt() ->> 'email', '')) $$;

create or replace function public.es_vendedor(p_org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from miembros where org_id = p_org and user_id = auth.uid() and activo and rol = 'vendedor')
$$;

-- lo que un vendedor puede ver de cada colección
create or replace function public.vendedor_ve(p_col text, p_dueno text) returns boolean
language sql stable as $$
  select p_col in ('items', 'contactos', 'config')
      or (p_col in ('ventas', 'leads', 'rems', 'equipo') and lower(coalesce(p_dueno, '')) = public.mi_email())
$$;

-- lo que un vendedor puede crear o cambiar
create or replace function public.vendedor_escribe(p_col text, p_dueno text) returns boolean
language sql stable as $$
  select p_col in ('items', 'contactos')
      or (p_col in ('ventas', 'leads', 'rems') and lower(coalesce(p_dueno, '')) = public.mi_email())
$$;

drop policy if exists docs_ver on public.docs;
create policy docs_ver on public.docs for select
  using (public.puede_ver(org_id, mundo) and (not public.es_vendedor(org_id) or public.vendedor_ve(col, dueno)));
drop policy if exists docs_crear on public.docs;
create policy docs_crear on public.docs for insert
  with check (public.puede_escribir(org_id, mundo, col) and (not public.es_vendedor(org_id) or public.vendedor_escribe(col, dueno)));
drop policy if exists docs_editar on public.docs;
create policy docs_editar on public.docs for update
  using (public.puede_escribir(org_id, mundo, col) and (not public.es_vendedor(org_id) or public.vendedor_escribe(col, dueno)))
  with check (public.puede_escribir(org_id, mundo, col) and (not public.es_vendedor(org_id) or public.vendedor_escribe(col, dueno)));
drop policy if exists docs_borrar on public.docs;
create policy docs_borrar on public.docs for delete
  using (public.puede_escribir(org_id, mundo, col) and (not public.es_vendedor(org_id) or public.vendedor_escribe(col, dueno)));

revoke execute on function public.mi_email(), public.es_vendedor(uuid), public.vendedor_ve(text, text), public.vendedor_escribe(text, text) from public, anon;
grant execute on function public.mi_email(), public.es_vendedor(uuid), public.vendedor_ve(text, text), public.vendedor_escribe(text, text) to authenticated;
