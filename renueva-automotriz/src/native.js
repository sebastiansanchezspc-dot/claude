// Integración con la app nativa de iPhone (Capacitor). En el navegador no hace nada.
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Browser } from '@capacitor/browser'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'

export const NATIVE = Capacitor.isNativePlatform()
// dirección pública de la versión web (enlaces de invitación, correos y páginas legales)
export const APP_URL = import.meta.env.VITE_APP_URL || 'https://renueva-weld.vercel.app'

// id numérico estable para cada recordatorio (iOS pide enteros)
const idNum = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h) || 1 }

export function setupNative(RV) {
  if (!NATIVE) return
  RV.native = true
  RV.appUrl = APP_URL
  RV.openExternal = url => Browser.open({ url, presentationStyle: 'popover' })
  StatusBar.setStyle({ style: Style.Dark }).catch(() => { })
  setTimeout(() => SplashScreen.hide().catch(() => { }), 400)

  RV.askNotif = () => LocalNotifications.requestPermissions().catch(() => { })
  // los recordatorios se programan en el iPhone: llegan aunque la app esté cerrada
  let last = ''
  RV.syncReminders = async rems => {
    const now = Date.now()
    const proximos = rems.filter(r => !r.hecho && new Date(r.cuando + ':00').getTime() > now)
      .sort((a, b) => a.cuando.localeCompare(b.cuando)).slice(0, 60) // iOS admite hasta 64 avisos pendientes
    const firma = JSON.stringify(proximos.map(r => [r.id, r.cuando, r.titulo]))
    if (firma === last) return
    last = firma
    try {
      const perm = await LocalNotifications.checkPermissions()
      if (perm.display !== 'granted') { if (!proximos.length) return; const r = await LocalNotifications.requestPermissions(); if (r.display !== 'granted') return }
      const pend = await LocalNotifications.getPending()
      if (pend.notifications.length) await LocalNotifications.cancel({ notifications: pend.notifications.map(n => ({ id: n.id })) })
      if (proximos.length) await LocalNotifications.schedule({
        notifications: proximos.map(r => ({ id: idNum(r.id), title: 'Recordatorio', body: r.titulo, schedule: { at: new Date(r.cuando + ':00'), allowWhileIdle: true }, extra: { rem: r.id } })),
      })
    } catch (e) { console.warn('recordatorios', e) }
  }
  RV.systemNotify = () => false // con la app abierta se muestra el aviso propio de Renueva
}
