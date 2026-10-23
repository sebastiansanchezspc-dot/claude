export const PLANES = {
  standard: { key: 'standard', label: 'Standard', maxUsuarios: 1, descripcion: '1 usuario (el admin)' },
  media: { key: 'media', label: 'Media', maxUsuarios: 3, descripcion: 'Hasta 3 usuarios' },
  premium: { key: 'premium', label: 'Premium', maxUsuarios: 7, descripcion: 'Hasta 7 usuarios' },
}

export const PLANES_LIST = Object.values(PLANES)

export function getPlan(key) {
  return PLANES[key] || PLANES.standard
}
