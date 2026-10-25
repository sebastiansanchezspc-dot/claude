-- =====================================================================
-- RENUEVA · notificaciones más claras
-- Título: el recordatorio mismo ("Llamar a Javiera Molina hoy").
-- Texto: hora del recordatorio, mundo y teléfono del cliente si está asociado.
-- =====================================================================
create or replace function public.push_pendientes() returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_out jsonb; v_ahora timestamp := now() at time zone 'America/Santiago';
begin
  delete from push_enviados where enviado < now() - interval '30 days';
  with vencidos as (
    select d.org_id, d.id as rem_id, d.data ->> 'cuando' as cuando, d.data ->> 'titulo' as titulo, d.data ->> 'w' as w, lower(d.dueno) as dueno,
           d.data -> 'ref' ->> 't' as ref_t, d.data -> 'ref' ->> 'id' as ref_id
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
  ), mensajes as (
    select v.*,
      concat_ws(' · ',
        '⏰ Recordatorio de las ' || substr(v.cuando, 12, 5),
        case v.w when 'auto' then 'Auto' when 'prop' then 'Propiedades' when 'tienda' then 'Tienda' end,
        nullif(c.data ->> 'fono', '')) as cuerpo
    from vencidos v
    left join docs c on c.org_id = v.org_id and c.id = v.ref_id
      and c.col = case v.ref_t when 'lead' then 'leads' when 'contacto' then 'contactos' end
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth,
      'title', coalesce(nullif(v.titulo, ''), 'Recordatorio'), 'body', v.cuerpo, 'tag', 'rem-' || v.rem_id,
      'url', '/?rem=' || v.rem_id || '&w=' || coalesce(v.w, ''))), '[]'::jsonb)
  into v_out
  from mensajes v
  join nuevos n using (org_id, rem_id, cuando)
  join push_subs s on s.org_id = v.org_id
  join miembros m on m.user_id = s.user_id and m.org_id = v.org_id and m.activo
  where (v.dueno is not null and v.dueno <> '' and lower(s.email) = v.dueno)
     or ((v.dueno is null or v.dueno = '') and m.rol = 'admin');
  return v_out;
end $$;

revoke execute on function public.push_pendientes() from public, anon, authenticated;
grant execute on function public.push_pendientes() to service_role;
