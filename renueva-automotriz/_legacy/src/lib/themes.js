export const THEMES = [
  { key: 'azul', label: 'Azul', bg: '#07101F', surface: '#0D1A2D', accent: '#2563EB' },
  { key: 'grafito', label: 'Grafito', bg: '#0A0A0C', surface: '#151518', accent: '#6B7280' },
  { key: 'dorado', label: 'Dorado', bg: '#0C0A06', surface: '#181410', accent: '#D4A537' },
  { key: 'esmeralda', label: 'Esmeralda', bg: '#04120D', surface: '#0A1F17', accent: '#10B981' },
  { key: 'volcan', label: 'Volcán', bg: '#12050A', surface: '#1F0A12', accent: '#E11D48' },
  { key: 'lavanda', label: 'Lavanda', bg: '#0D0A18', surface: '#181228', accent: '#8B5CF6' },
  { key: 'magenta', label: 'Magenta', bg: '#070B14', surface: '#111827', accent: '#EC4899' },
  { key: 'cobre', label: 'Cobre', bg: '#0E0A07', surface: '#1C130C', accent: '#B45309' },
  { key: 'hielo', label: 'Hielo', bg: '#060F18', surface: '#0C1E2C', accent: '#06B6D4' },
  { key: 'carbon', label: 'Carbón', bg: '#06100A', surface: '#0D1E14', accent: '#4ADE80' },
]

export const DEFAULT_THEME = 'azul'

export function getTheme(key) {
  return THEMES.find((t) => t.key === key) || THEMES[0]
}

export function applyTheme(key) {
  const theme = getTheme(key)
  const root = document.documentElement
  root.style.setProperty('--color-bg', theme.bg)
  root.style.setProperty('--color-surface', theme.surface)
  root.style.setProperty('--color-accent', theme.accent)
}
