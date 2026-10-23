# Renueva

Gestión de ventas para **automotoras**, **corredoras de propiedades** y **tiendas**, en tres "mundos" separados.
Hecha para el celular (se instala como app en iPhone y Android) y funciona también en el computador.

- **App:** Vite + JavaScript (sin framework), diseño propio.
- **Datos y usuarios:** Supabase (Postgres con permisos por fila, inicio de sesión, archivos, tiempo real).
- **Cobros:** Flow.cl (suscripción mensual o anual con cargo automático a tarjeta, en pesos chilenos).
- **Hosting:** Vercel.

Sin variables de entorno la app abre en **modo demo** con datos de ejemplo. Agregando `?demo` a la URL también se ve la demo.

---

## Quién maneja qué

| Quién | Qué hace | Dónde |
|---|---|---|
| **Cliente (administrador de cada empresa)** | Crea su cuenta, prueba 14 días gratis, elige plan, paga con tarjeta en Flow, invita a vendedores y usuarios de solo lectura, elige mundos. | App → Ajustes → Plan / Usuarios |
| **Vendedor** | Registra consultas, ventas, recordatorios en los mundos que le asignaron. No ve el plan ni edita catálogos ni comisiones. | App |
| **Solo lectura** | Ve todo lo de sus mundos, no cambia nada. | App |
| **Tú (dueño de Renueva)** | Ves todas las empresas, cuánto se cobra al mes, quién está en prueba o vencido. Activas planes pagados por transferencia, extiendes pruebas, suspendes cuentas. | App → Ajustes → **Panel de la plataforma** (solo aparece para ti) |
| **Flow** | Guarda la tarjeta del cliente, cobra cada mes/año y avisa a Renueva cada pago. El dinero llega a tu cuenta bancaria registrada en Flow. | flow.cl |

Reglas que aplica la base de datos (no se pueden saltar desde el navegador):

- Exactamente **un administrador** por empresa; los demás son vendedor o solo lectura.
- Límite de usuarios y de mundos según el plan (Standard 1/1, Media 3/2, Premium 7/3).
- Cuando termina la prueba sin pago (o el pago vence hace más de 5 días), la empresa queda en **solo lectura**: no se borra nada.
- Cada persona solo ve los datos de su empresa y de los mundos que tiene asignados.

---

## Puesta en marcha (una sola vez)

### 1. Supabase

1. Crea un proyecto en <https://supabase.com> (región São Paulo es la más cercana a Chile).
2. **SQL Editor** → pega todo el archivo `supabase/migrations/20261023000000_renueva.sql` → **Run**.
   Se puede volver a correr sin problema. (Si antes corriste las migraciones de la versión anterior, esas tablas quedan sin uso; no molestan.)
3. **Authentication → URL Configuration**
   - *Site URL:* la URL de producción, por ejemplo `https://renueva.vercel.app` (o tu dominio).
   - *Redirect URLs:* agrega la misma URL y `https://*-tu-usuario.vercel.app/**` para las vistas previas.
4. **Authentication → Emails:** opcional pero recomendado, configura un SMTP propio (Resend, Brevo, etc.) para que los correos de confirmación no queden limitados ni lleguen a spam. Puedes traducir las plantillas al español.
5. **Project Settings → API:** copia `Project URL` y la clave `anon public`.

### 2. Vercel

1. En el proyecto ya conectado a GitHub: **Settings → Environment Variables**
   - `VITE_SUPABASE_URL` = Project URL
   - `VITE_SUPABASE_ANON_KEY` = anon public key
2. *Settings → Build:* Root Directory `renueva-automotriz`, Framework **Vite**, Build `npm run build`, Output `dist`.
3. **Redeploy**. Al abrir la URL aparece el inicio de sesión. Si sale "Falta un paso", falta el SQL del punto 1.2.

### 3. Hazte dueño de la plataforma

Crea tu cuenta en la app (con tu correo) y luego en Supabase → SQL Editor:

```sql
insert into public.plataforma_admins (user_id)
select id from auth.users where email = 'TU_CORREO@ejemplo.cl';
```

Recarga la app: en **Ajustes** aparece **Panel de la plataforma**.

### 4. Cobros con Flow

Mientras no configures Flow, la app funciona igual: cuando un cliente elige plan durante la prueba queda registrado, y tú activas el pago (por transferencia) desde el **Panel de la plataforma** → empresa → *Registrar pago y activar*.

Para cobrar con tarjeta automáticamente:

1. Crea tu cuenta de comercio en <https://www.flow.cl> y activa el producto **Suscripciones / Cargo automático**. Revisa comisiones vigentes en <https://web.flow.cl/es-cl/tarifas>.
2. Prueba primero en sandbox: <https://sandbox.flow.cl> (Mis datos → *apiKey* y *secretKey*).
3. Instala la CLI de Supabase y publica las funciones:

   ```bash
   npx supabase login
   npx supabase link --project-ref TU_PROJECT_REF
   npx supabase secrets set FLOW_API_KEY=xxxx FLOW_SECRET_KEY=yyyy APP_URL=https://tu-app.vercel.app FLOW_SANDBOX=1
   npx supabase functions deploy billing
   npx supabase functions deploy flow-webhook --no-verify-jwt
   ```

4. Crea los 6 planes en Flow (Standard, Media y Premium × mensual/anual) con la URL de aviso correcta. Desde la app, entrando como dueño de la plataforma, abre la consola del navegador y ejecuta:

   ```js
   await RV.billingSetup()
   ```

   (o créalos a mano en Flow con los `planId` `renueva_standard_m`, `renueva_standard_a`, `renueva_media_m`, `renueva_media_a`, `renueva_premium_m`, `renueva_premium_a` y URL callback `https://TU_PROJECT_REF.supabase.co/functions/v1/flow-webhook`).
5. Prueba el flujo completo con una tarjeta de prueba de Flow. Cuando funcione: cambia las claves por las de producción y `FLOW_SANDBOX=0`, y vuelve a crear los planes en la cuenta de producción.

**Cómo funciona el cobro:** el admin elige plan → la app pide a la función `billing` el enlace de Flow → el cliente registra su tarjeta en Flow → Flow vuelve a `flow-webhook`, que crea la suscripción y deja la empresa activa → cada mes Flow cobra y avisa a `flow-webhook`, que actualiza *pagado hasta* y el historial de pagos. Cambiar o cancelar el plan también pasa por `billing`.

Precios: están en la tabla `planes` (SQL) y en `src/app/10-data.js` (`PLANES`). Si los cambias, cambia ambos y vuelve a crear los planes en Flow.

---

## Desarrollo local

```bash
cd renueva-automotriz
npm install
cp .env.example .env.local   # pon tu URL y anon key (o déjalo vacío para la demo)
npm run dev                   # http://localhost:5173
```

Con Docker puedes levantar Supabase completo en tu computador: `npx supabase start` (usa `supabase/config.toml` y aplica la migración).

### Cómo está organizado

```
index.html              estructura de la pantalla
src/styles.css          diseño (colores por mundo, tipografías, animaciones)
src/cloud.js            Supabase: sesión, guardado automático, tiempo real, archivos, cobros
src/app/10-data.js      reloj, mundos, catálogos, colecciones, planes, permisos
src/app/12-demo.js      datos de ejemplo (demo y "empezar con ejemplos")
src/app/20-core.js      iconos, alertas, navegación, permisos por acción, fotos
src/app/30-screens.js   inicio, panel, stock, ventas, caja, equipo
src/app/40-details.js   fichas y formularios (ítem, venta, vendedor, gastos)
src/app/50-crm.js       consultas, contactos, recordatorios
src/app/60-plan.js      ajustes, catálogos, plan, usuarios
src/app/70-gate.js      inicio de sesión, crear empresa, panel de la plataforma
src/app/90-main.js      arranque
supabase/migrations/    base de datos, permisos y reglas de plan
supabase/functions/     billing y flow-webhook (Flow)
```

Los archivos de `src/app` se unen en orden al compilar (ver `vite.config.js`).

**Cómo se guardan los datos:** cada registro (vehículo, venta, consulta, etc.) es un documento JSON en la tabla `docs`. La app guarda sola los cambios ~1 segundo después de cada acción y recibe en vivo los cambios de los demás usuarios. Fotos y comprobantes se achican en el celular y se suben al almacenamiento privado `archivos`.

---

## Pendiente / próximos pasos

- Notificaciones push con la app cerrada (requiere claves VAPID y un envío programado en el servidor). Hoy los avisos llegan con la app abierta o en segundo plano reciente.
- WhatsApp automático (API de WhatsApp Business, costo por mensaje). Hoy se abre el chat con el mensaje listo.
- Boleta/factura electrónica del cobro de la suscripción (Flow puede emitirla si lo activas en tu cuenta; si no, emitir desde el SII).
- Exportar a Excel.
- Términos del servicio y política de privacidad (Ley 19.628) antes de abrir a clientes.
