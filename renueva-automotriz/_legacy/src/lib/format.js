// Formato de dinero chileno ($ + puntos de miles), sin decimales.

export function onlyDigits(str) {
  return String(str ?? '').replace(/[^\d]/g, '')
}

// numFmt: recibe string/number crudo (dígitos), devuelve "12.000.000"
export function numFmt(value) {
  const digits = onlyDigits(value)
  if (!digits) return ''
  return new Intl.NumberFormat('es-CL').format(Number(digits))
}

// unFmt: recibe "12.000.000" o "$12.000.000", devuelve número 12000000
export function unFmt(value) {
  const digits = onlyDigits(value)
  return digits ? Number(digits) : 0
}

// clp: recibe número, devuelve "$12.000.000"
export function clp(value) {
  const n = Number(value) || 0
  return `$${new Intl.NumberFormat('es-CL').format(n)}`
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export function mesNom(mesIndex) {
  return MESES[((mesIndex % 12) + 12) % 12]
}

export function mesCortoNom(mesIndex) {
  return mesNom(mesIndex).slice(0, 3)
}

export function fechaCL(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''))
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function hoyISO() {
  const d = new Date()
  const tzOffset = d.getTimezoneOffset() * 60000
  return new Date(d - tzOffset).toISOString().slice(0, 10)
}
