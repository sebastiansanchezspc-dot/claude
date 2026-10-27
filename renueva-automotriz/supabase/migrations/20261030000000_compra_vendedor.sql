-- =====================================================================
-- GESTIX · el vendedor ingresa el precio de compra
-- Mientras su ingreso está pendiente, el vendedor puede corregir el precio
-- de compra (costo). El precio de venta lo sigue poniendo solo el
-- administrador al aprobar, y nadie más que él toca un ítem aprobado.
-- =====================================================================

create or replace function public.trg_items_vendedor() returns trigger
language plpgsql security definer set search_path = public as $$
declare r public.docs; pend boolean; propio boolean;
begin
  if tg_op = 'DELETE' then r := old; else r := new; end if;
  if r.col <> 'items' or not public.es_vendedor(r.org_id) then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    if coalesce(new.data ->> 'aprob', '') <> 'pendiente' then
      raise exception 'Lo que ingresa un vendedor queda pendiente del precio del administrador' using errcode = 'P0001';
    end if;
    return new;
  end if;

  pend := coalesce(old.data ->> 'aprob', '') = 'pendiente';
  propio := lower(coalesce(old.data -> 'creadoPor' ->> 'email', '')) = public.mi_email();

  if tg_op = 'DELETE' then
    if not pend or not propio then
      raise exception 'Solo el administrador puede eliminar del stock' using errcode = 'P0001';
    end if;
    return old;
  end if;

  -- UPDATE: no se aprueba; el precio de venta solo mientras está pendiente (queda en 0);
  -- el precio de compra solo en su propio ingreso pendiente
  if coalesce(old.data ->> 'aprob', '') is distinct from coalesce(new.data ->> 'aprob', '')
     or (not pend and (old.data -> 'precio') is distinct from (new.data -> 'precio'))
     or (not (pend and propio) and ((old.data -> 'costo') is distinct from (new.data -> 'costo')
                                    or (old.data -> 'costoU') is distinct from (new.data -> 'costoU')))
     or (old.data -> 'recon') is distinct from (new.data -> 'recon') then
    raise exception 'Solo el administrador puede cambiar precios y costos' using errcode = 'P0001';
  end if;
  return new;
end $$;

revoke execute on function public.trg_items_vendedor() from public, anon, authenticated;
