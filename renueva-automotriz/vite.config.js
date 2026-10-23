import { defineConfig } from 'vite'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// La interfaz vive en src/app/*.js como piezas ordenadas (10-, 20-, …) que comparten
// un mismo ámbito. Este plugin las une en un solo módulo, en orden, al compilar.
const APP_DIR = join(process.cwd(), 'src/app')
const ID = 'virtual:renueva-app'

function renuevaApp() {
  return {
    name: 'renueva-app',
    resolveId: id => (id === ID ? '\0' + ID : null),
    load(id) {
      if (id !== '\0' + ID) return null
      const files = readdirSync(APP_DIR).filter(f => f.endsWith('.js')).sort()
      files.forEach(f => this.addWatchFile(join(APP_DIR, f)))
      const code = files.map(f => `// ---- ${f}\n` + readFileSync(join(APP_DIR, f), 'utf8')).join('\n')
      // RV_TEST=1 expone el ámbito de la app para las pruebas automáticas (nunca en producción)
      return process.env.RV_TEST ? code + '\nwindow.__eval = s => eval(s);\n' : code
    },
    handleHotUpdate({ file, server }) {
      if (file.startsWith(APP_DIR)) server.ws.send({ type: 'full-reload' })
    },
  }
}

export default defineConfig({ plugins: [renuevaApp()] })
