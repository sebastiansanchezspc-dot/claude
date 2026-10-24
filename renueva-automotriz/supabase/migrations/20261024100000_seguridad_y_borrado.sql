-- =====================================================================
-- RENUEVA · seguridad adicional y eliminación de cuenta
-- 1) Nombres y correos se limpian en la base de datos, lleguen por donde lleguen.
-- 2) Límites de tamaño para los documentos.
-- 3) Cada persona puede eliminar su cuenta desde la app (requisito de Apple 5.1.1(v)
--    y derecho de supresión de la Ley 19.628 / 21.719).
-- =====================================================================

-- ---------------------------------------------------------------- textos limpios
create or replace function public.limpiar_texto(t text, largo int default 120) returns text
language sql immutable as $$
  select left(btrim(regexp_replace(coalesce(t, ''), '[<>"''`\u0001-\u001f]', '', 'g')), largo)
$$;

create or replace function public.trg_limpiar_nombres() returns trigger
language plpgsql as $$
begin
  new.nombre := public.limpiar_texto(new.nombre);
  if tg_table_name in ('miembros', 'invitaciones') then
    new.email := lower(btrim(new.email));
    if new.email !~ '^[^@\s<>"]+@[^@\s<>"]+\.[^@\s<>"]+$' then
      raise exception 'Correo no válido' using errcode = 'P0001';
    end if;
  end if;
  if tg_table_name = 'orgs' and new.nombre = '' then
    raise exception 'El nombre de la empresa no puede quedar vacío' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists orgs_limpiar on public.orgs;
create trigger orgs_limpiar before insert or update of nombre on public.orgs
  for each row execute function public.trg_limpiar_nombres();
drop trigger if exists miembros_limpiar on public.miembros;
create trigger miembros_limpiar before insert or update of nombre, email on public.miembros
  for each row execute function public.trg_limpiar_nombres();
drop trigger if exists invitaciones_limpiar on public.invitaciones;
create trigger invitaciones_limpiar before insert or update of nombre, email on public.invitaciones
  for each row execute function public.trg_limpiar_nombres();

-- ---------------------------------------------------------------- límites de los documentos
alter table public.docs drop constraint if exists docs_tamano;
alter table public.docs add constraint docs_tamano check (octet_length(data::text) <= 1000000) not valid;
alter table public.docs validate constraint docs_tamano;
alter table public.docs drop constraint if exists docs_id_largo;
alter table public.docs add constraint docs_id_largo check (char_length(id) between 1 and 100) not valid;
alter table public.docs validate constraint docs_id_largo;

-- ---------------------------------------------------------------- eliminar mi cuenta
-- Admin: se borra la empresa completa (datos, usuarios, invitaciones y pagos registrados).
-- Vendedor o solo lectura: se borra su usuario; las ventas que registró quedan en la empresa
-- porque son registros comerciales de ella.
-- Las fotos se borran desde la app antes de llamar a esta función (la API de archivos lo exige).
create or replace function public.eliminar_mi_cuenta() returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare v_uid uuid := auth.uid(); v_org uuid; v_rol text; v_nombre text;
begin
  if v_uid is null then raise exception 'Inicia sesión primero' using errcode = 'P0001'; end if;
  select org_id, rol into v_org, v_rol from public.miembros where user_id = v_uid limit 1;
  if v_rol = 'admin' then
    select nombre into v_nombre from public.orgs where id = v_org;
    delete from public.orgs where id = v_org;           -- en cascada: miembros, invitaciones, docs, pagos
  elsif v_org is not null then
    delete from public.miembros where user_id = v_uid;
  end if;
  delete from public.invitaciones where lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')) and aceptada_at is null;
  delete from public.plataforma_admins where user_id = v_uid;
  delete from auth.users where id = v_uid;
  return jsonb_build_object('ok', true, 'empresa_eliminada', v_rol = 'admin', 'empresa', v_nombre);
end $$;

revoke execute on function public.eliminar_mi_cuenta() from public, anon;
grant execute on function public.eliminar_mi_cuenta() to authenticated;
revoke execute on function public.trg_limpiar_nombres() from public, anon, authenticated;

-- ---------------------------------------------------------------- search_path fijo (linter de Supabase)
alter function public.mi_email() set search_path = public, auth;
alter function public.vendedor_ve(text, text) set search_path = public, auth;
alter function public.vendedor_escribe(text, text) set search_path = public, auth;
alter function public.limpiar_texto(text, integer) set search_path = public;
alter function public.trg_limpiar_nombres() set search_path = public;
