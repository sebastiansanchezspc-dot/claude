// Definición de los rubros soportados: qué campos dinámicos pide cada uno,
// cómo se llama su "código" (patente / rol de avalúo / SKU) y su terminología.

export const RUBROS = {
  automotriz: {
    key: 'automotriz',
    label: 'Automotriz',
    emoji: '🚗',
    itemLabel: 'Auto',
    itemLabelPlural: 'Autos',
    skuLabel: 'Patente',
    nombrePlaceholder: 'Ej: Toyota Corolla 2020',
    usaStock: false,
    campos: [
      { key: 'marca', label: 'Marca', type: 'text', required: true, col: 2 },
      { key: 'modelo', label: 'Modelo', type: 'text', required: true, col: 2 },
      { key: 'anio', label: 'Año', type: 'number', required: true, col: 3 },
      { key: 'km', label: 'Kilometraje', type: 'number', col: 3 },
      { key: 'color', label: 'Color', type: 'text', col: 3 },
      { key: 'tipo', label: 'Tipo', type: 'select', col: 2, options: ['Sedán', 'SUV', 'Hatchback', 'Pickup', 'Furgón', 'Camioneta', 'Moto', 'Otro'] },
    ],
  },
  inmobiliaria: {
    key: 'inmobiliaria',
    label: 'Inmobiliaria',
    emoji: '🏠',
    itemLabel: 'Propiedad',
    itemLabelPlural: 'Propiedades',
    skuLabel: 'Rol de avalúo',
    nombrePlaceholder: 'Ej: Depto 3D, Providencia',
    usaStock: false,
    campos: [
      { key: 'tipo_operacion', label: 'Operación', type: 'select', required: true, col: 2, options: ['Venta', 'Arriendo'] },
      { key: 'tipo_propiedad', label: 'Tipo de propiedad', type: 'select', required: true, col: 2, options: ['Casa', 'Departamento', 'Oficina', 'Terreno', 'Parcela', 'Bodega'] },
      { key: 'direccion', label: 'Dirección', type: 'text', required: true, col: 2 },
      { key: 'comuna', label: 'Comuna', type: 'text', col: 2 },
      { key: 'm2_construidos', label: 'm² construidos', type: 'number', col: 3 },
      { key: 'm2_terreno', label: 'm² terreno', type: 'number', col: 3 },
      { key: 'dormitorios', label: 'Dormitorios', type: 'number', col: 3 },
      { key: 'banos', label: 'Baños', type: 'number', col: 3 },
    ],
  },
  retail: {
    key: 'retail',
    label: 'Retail general',
    emoji: '🛍️',
    itemLabel: 'Producto',
    itemLabelPlural: 'Productos',
    skuLabel: 'Código / SKU',
    nombrePlaceholder: 'Ej: Zapatillas Nike Air Max',
    usaStock: true,
    campos: [
      { key: 'marca', label: 'Marca', type: 'text', col: 2 },
      { key: 'categoria', label: 'Categoría', type: 'text', required: true, col: 2 },
      { key: 'variante', label: 'Talla / Variante', type: 'text', col: 3 },
    ],
  },
}

export const RUBROS_LIST = Object.values(RUBROS)

export function getRubro(key) {
  return RUBROS[key] || RUBROS.automotriz
}

// Etiqueta de estado adaptada al rubro (ej: "Arrendado" en vez de "Vendido")
export function estadoLabel(item) {
  const rubro = getRubro(item.rubro)
  if (item.estado === 'disponible') return 'Disponible'
  if (item.estado === 'reservado') return 'Reservado'
  if (item.estado === 'agotado') return 'Agotado'
  if (item.estado === 'vendido') {
    if (rubro.key === 'inmobiliaria' && item.atributos?.tipo_operacion === 'Arriendo') return 'Arrendado'
    return 'Vendido'
  }
  return item.estado
}

export function estadoTone(estado) {
  if (estado === 'disponible') return 'disponible'
  if (estado === 'reservado') return 'warn'
  return 'vendido'
}
