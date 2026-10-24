-- =====================================================================
-- RENUEVA · cada cuenta pertenece a una sola empresa
-- 1) Quien tiene una invitación pendiente no puede crear otra empresa:
--    debe aceptar la invitación (así un vendedor no termina en una empresa propia).
-- 2) No se puede invitar un correo que ya usa Renueva en otra empresa.
-- =====================================================================

create or replace function public.crear_organizacion(p_nombre text, p_mundos text[], p_nombre_admin text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_inv text;
begin
  if auth.uid() is null then raise exception 'Inicia sesión primero'; end if;
  if exists (select 1 from miembros where user_id = auth.uid()) then raise exception 'Tu usuario ya pertenece a una empresa' using errcode = 'P0001'; end if;
  select g.nombre into v_inv from invitaciones i join orgs g on g.id = i.org_id
   where i.aceptada_at is null and lower(i.email) = lower(auth.jwt() ->> 'email') limit 1;
  if v_inv is not null then
    raise exception 'Tienes una invitación de %. Acéptala para entrar a esa empresa.', v_inv using errcode = 'P0001';
  end if;
  if coalesce(trim(p_nombre), '') = '' then raise exception 'Escribe el nombre de tu empresa' using errcode = 'P0001'; end if;
  insert into orgs (nombre, mundos, creado_por)
    values (trim(p_nombre), coalesce(nullif(p_mundos, '{}'), array['auto', 'prop', 'tienda']), auth.uid())
    returning id into v_org;
  insert into miembros (org_id, user_id, nombre, email, rol, mundos)
    values (v_org, auth.uid(), coalesce(nullif(trim(p_nombre_admin), ''), split_part(auth.jwt() ->> 'email', '@', 1)), auth.jwt() ->> 'email', 'admin', array['auto', 'prop', 'tienda']);
  return v_org;
end $$;

create or replace function public.invitar(p_email text, p_nombre text, p_rol text, p_mundos text[]) returns text
language plpgsql security definer set search_path = public as $$
declare v_org uuid := mi_org(); v_token text;
begin
  if mi_rol() is distinct from 'admin' then raise exception 'Solo el administrador puede invitar' using errcode = 'P0001'; end if;
  if not org_escribible(v_org) then raise exception 'Tu cuenta está en solo lectura: elige un plan' using errcode = 'P0001'; end if;
  if exists (select 1 from miembros where org_id = v_org and lower(email) = lower(p_email)) then raise exception 'Esa persona ya es parte de tu empresa' using errcode = 'P0001'; end if;
  if exists (select 1 from miembros where org_id <> v_org and lower(email) = lower(p_email)) then
    raise exception 'Ese correo ya usa Renueva en otra empresa. Pídele que use otro correo.' using errcode = 'P0001';
  end if;
  select token into v_token from invitaciones where org_id = v_org and lower(email) = lower(p_email) and aceptada_at is null;
  if v_token is not null then return v_token; end if;
  if usados_usuarios(v_org) >= limite_usuarios(v_org) then raise exception 'Llegaste al límite de usuarios de tu plan' using errcode = 'P0001'; end if;
  insert into invitaciones (org_id, email, nombre, rol, mundos, creado_por)
    values (v_org, lower(trim(p_email)), coalesce(p_nombre, ''), p_rol, p_mundos, auth.uid()) returning token into v_token;
  return v_token;
end $$;
