import './styles.css'
import './cloud.js'
import 'virtual:renueva-app'

// iPhone en modo app (agregar a inicio): con la barra de estado transparente, iOS informa
// una altura menor que la pantalla y abajo queda una franja negra. Se usa la altura real.
// Con el teclado abierto la diferencia es grande y se deja la altura normal.
function altoReal() {
  if (navigator.standalone !== true) return
  const vertical = innerHeight > innerWidth
  const alto = vertical ? Math.max(screen.width, screen.height) : Math.min(screen.width, screen.height)
  const visible = Math.min(innerHeight, document.documentElement.clientHeight || innerHeight)
  const falta = alto - visible
  const v = falta > 0 && falta < 120 ? alto + 'px' : ''
  if (document.documentElement.style.getPropertyValue('--app-h') !== v) document.documentElement.style.setProperty('--app-h', v)
}
// iOS a veces cambia la altura un momento después de abrir o al volver a la app, sin avisar:
// se vuelve a revisar en esos momentos y cada segundo (solo en modo app; es una medición barata)
altoReal()
addEventListener('resize', altoReal)
addEventListener('pageshow', altoReal)
addEventListener('orientationchange', () => setTimeout(altoReal, 300))
document.addEventListener('visibilitychange', () => { if (!document.hidden) { altoReal(); setTimeout(altoReal, 400) } })
if (navigator.standalone === true) setInterval(altoReal, 1000)
