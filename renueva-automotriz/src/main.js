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
  const falta = alto - innerHeight
  document.documentElement.style.setProperty('--app-h', falta > 0 && falta < 120 ? alto + 'px' : '')
}
altoReal()
addEventListener('resize', altoReal)
addEventListener('orientationchange', () => setTimeout(altoReal, 300))
