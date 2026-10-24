# Publicar Renueva en el App Store

Guía paso a paso y lista de requisitos que Apple revisa. Lo marcado ✅ ya está hecho en el código.

## Lo que ya cumple la app

| Requisito de Apple | Regla | Estado |
|---|---|---|
| Eliminar la cuenta desde la app | 5.1.1(v) | ✅ Ajustes → Eliminar mi cuenta (borra usuario, empresa, fotos y cancela Flow) |
| Política de privacidad accesible en la app y en la ficha | 5.1.1(i) | ✅ `/privacidad.html`, enlazada en el login, el registro y Ajustes |
| URL de soporte | 1.5 | ✅ `/soporte.html` |
| Sin compras fuera de Apple dentro de la app iOS | 3.1.1 / 3.1.3(c) | ✅ En iPhone no se muestran precios, botones de pago ni "Sube de plan"; no se puede crear empresa (solo unirse por invitación) |
| Funcionalidad nativa, no solo una web | 4.2 | ✅ Notificaciones locales de recordatorios, cámara/galería, barra de estado y pantalla de inicio nativas |
| Manifiesto de privacidad | — | ✅ `ios/App/App/PrivacyInfo.xcprivacy` (sin tracking, API UserDefaults CA92.1) |
| Textos de permisos en español | 5.1.1 | ✅ Cámara y fotos en `Info.plist` |
| Cifrado de exportación | — | ✅ `ITSAppUsesNonExemptEncryption = false` (solo HTTPS) |
| Ícono 1024×1024 sin transparencia | 2.3 | ✅ |
| Sin Sign in with Apple obligatorio | 4.8 | ✅ No hay login con Google/Facebook, solo correo |
| Seguridad del backend | 1.6 / 5.1 | ✅ RLS por empresa y vendedor, cabeceras CSP/HSTS, saneo de texto, `npm audit` en 0 |

## Lo que falta antes de enviar

1. **Datos legales** en `public/legal.js`: responsable (nombre o razón social), RUT y correo de contacto. Apple rechaza páginas con datos "pendiente".
2. **Supabase → Authentication**:
   - Activar *Leaked password protection* y largo mínimo de 8.
   - *URL Configuration*: Site URL `https://renueva-weld.vercel.app` y la misma en Redirect URLs.
3. **Migración** `supabase/migrations/20261024100000_seguridad_y_borrado.sql` aplicada en producción (necesaria para eliminar cuenta).
4. **Cuenta de prueba para el revisor**: crear una empresa demo con datos, activarla desde el panel de plataforma (plan Premium, para que no esté en solo lectura) y anotar correo y contraseña.
5. **Cuenta Apple Developer** (US$99 al año) a nombre de la empresa si es posible: la regla 3.1.3(c) aplica mejor a una organización.

## Compilar en el Mac

Requisitos: macOS con **Xcode 26** o superior (Apple exige el SDK de iOS 26 desde el 28 de abril de 2026), Node 20+.

```bash
git clone https://github.com/sebastiansanchezspc-dot/claude.git
cd claude/renueva-automotriz
npm install
npm run ios        # compila la web y la copia al proyecto iOS
npm run ios:open   # abre Xcode
```

En Xcode:
1. Target **App** → *Signing & Capabilities* → elegir tu *Team* y dejar *Automatically manage signing*. Bundle ID: `cl.renueva.app`.
2. *General* → Version `1.0.0`, Build `1`.
3. Probar en un iPhone real: recordatorios, cámara, iniciar sesión, eliminar una cuenta de prueba.
4. *Product → Archive* → *Distribute App* → *App Store Connect* → *Upload*.

Cada vez que cambie la web: `npm run ios` y volver a archivar subiendo el número de Build.

## Ficha en App Store Connect

- **Nombre**: Renueva · **Subtítulo**: Ventas, stock y caja para tu negocio
- **Categoría**: Negocios (secundaria: Productividad)
- **Idioma principal**: Español (Chile o México)
- **URL de privacidad**: https://renueva-weld.vercel.app/privacidad.html
- **URL de soporte**: https://renueva-weld.vercel.app/soporte.html
- **Clasificación por edad**: responder "No" a todo → 4+
- **Precio**: Gratis (la suscripción se contrata fuera de la app, en la web, por la empresa)
- **Capturas**: iPhone 6,9" (1320×2868) como mínimo; usar la demo con datos de ejemplo.

### Privacidad de la app (etiquetas)

"¿Recopilas datos?" → Sí. Para cada tipo: *vinculado al usuario*, **no** usado para rastreo, propósito *Funcionalidad de la app*:

- Información de contacto: nombre, correo, teléfono
- Contenido del usuario: fotos, otro contenido
- Compras: historial de compras

Debe coincidir con `PrivacyInfo.xcprivacy`.

### Notas para el revisor (copiar y pegar)

> Renueva es un software de gestión para empresas (automotoras, corredoras de propiedades y tiendas). Las empresas contratan el servicio directamente con nosotros fuera de la app, y sus empleados (vendedores y usuarios de solo lectura) usan la app iOS con la cuenta que la empresa les asigna. La app no vende contenido digital ni muestra ofertas o enlaces de compra (Guideline 3.1.3(c), Enterprise Services).
>
> Cuenta de prueba: correo `...` / contraseña `...` (administrador de una empresa demo con datos de ejemplo).
>
> Eliminar cuenta: Ajustes → Eliminar mi cuenta.
> Funciones nativas: recordatorios con notificaciones locales, fotos con cámara o galería.

## Si Apple rechaza

- **3.1.1 (pagos)**: responder citando 3.1.3(c), explicando que se vende a empresas y no a consumidores. Si insisten, la alternativa es agregar compras dentro de la app (StoreKit) para los planes.
- **4.2 (solo web)**: destacar notificaciones locales, cámara y que funciona sin conexión.
- **2.1 (no pudieron entrar)**: revisar que la cuenta de prueba esté activa y no en solo lectura.
