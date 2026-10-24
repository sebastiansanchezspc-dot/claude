// Datos del responsable de Renueva, usados por las páginas de privacidad, términos y soporte.
// Completar antes de publicar en la App Store (Apple rechaza textos de relleno).
window.LEGAL = {
  responsable: '',          // nombre de la persona o razón social
  rut: '',                  // RUT del responsable
  email: '',                // correo de contacto y soporte
  ciudad: 'Santiago, Chile',
  actualizado: '24 de octubre de 2026',
}
document.querySelectorAll('[data-l]').forEach(el => {
  const v = window.LEGAL[el.dataset.l] || ''
  if (el.tagName === 'A' && el.dataset.l === 'email' && v) { el.href = 'mailto:' + v; el.textContent = v }
  else el.textContent = v
})
