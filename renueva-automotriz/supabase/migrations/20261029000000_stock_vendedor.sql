-- =====================================================================
-- RENUEVA · los vendedores ingresan stock y el administrador pone el precio
-- Lo que ingresa un vendedor queda "pendiente" hasta que el administrador
-- define precio de venta y costo. El vendedor no puede cambiar precios ni
-- costos, ni aprobar, ni borrar algo que no sea su propio ingreso pendiente.
-- =====================================================================

create or replace function public.trg_items_vendedor() returns trigger
language plpgsql security definer set search_path = public as $$
declare r public.docs;
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

  if tg_op = 'DELETE' then
    if coalesce(old.data ->> 'aprob', '') <> 'pendiente' or lower(coalesce(old.data -> 'creadoPor' ->> 'email', '')) <> public.mi_email() then
      raise exception 'Solo el administrador puede eliminar del stock' using errcode = 'P0001';
    end if;
    return old;
  end if;

  -- UPDATE: no se aprueba ni se tocan precios o costos
  if coalesce(old.data ->> 'aprob', '') is distinct from coalesce(new.data ->> 'aprob', '')
     or (coalesce(old.data ->> 'aprob', '') <> 'pendiente' and (old.data -> 'precio') is distinct from (new.data -> 'precio'))
     or (old.data -> 'costo') is distinct from (new.data -> 'costo')
     or (old.data -> 'costoU') is distinct from (new.data -> 'costoU')
     or (old.data -> 'recon') is distinct from (new.data -> 'recon') then
    raise exception 'Solo el administrador puede cambiar precios y costos' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists docs_items_vendedor on public.docs;
create trigger docs_items_vendedor before insert or update or delete on public.docs
  for each row execute function public.trg_items_vendedor();

revoke execute on function public.trg_items_vendedor() from public, anon, authenticated;
