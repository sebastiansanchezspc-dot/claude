-- =====================================================================
-- RENUEVA · aprobación de ventas del vendedor
-- En autos y propiedades, la venta que registra un vendedor queda "pendiente"
-- hasta que el administrador la aprueba y define la comisión. La base de datos
-- impide que el vendedor la apruebe por su cuenta o cambie una ya aprobada.
-- =====================================================================

create or replace function public.trg_ventas_aprobacion() returns trigger
language plpgsql security definer set search_path = public as $$
declare r public.docs;
begin
  if tg_op = 'DELETE' then r := old; else r := new; end if;
  if r.col <> 'ventas' or r.mundo not in ('auto', 'prop') or not public.es_vendedor(r.org_id) then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  if tg_op in ('UPDATE', 'DELETE') and coalesce(old.data ->> 'aprob', 'aprobada') not in ('pendiente', 'rechazada') then
    raise exception 'Esta venta ya fue aprobada: solo el administrador puede cambiarla' using errcode = 'P0001';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  if coalesce(new.data ->> 'aprob', '') <> 'pendiente' then
    raise exception 'Tu venta queda pendiente hasta que el administrador la apruebe' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists docs_ventas_aprobacion on public.docs;
create trigger docs_ventas_aprobacion before insert or update or delete on public.docs
  for each row execute function public.trg_ventas_aprobacion();

revoke execute on function public.trg_ventas_aprobacion() from public, anon, authenticated;
