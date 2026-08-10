# SETUP: cómo dejar el sistema funcionando

Este sistema hace, todos los días:
1. **Investiga** en Mercado Libre Chile las búsquedas en tendencia y, dentro de ellas, los
   productos más vendidos (`sort=sold_quantity_desc`) que además tengan buen rating
   (por defecto ≥4.5⭐ y ≥10 reseñas).
2. **Genera un post** por producto: captura de pantalla, caption en tono chileno-amigable
   y link de afiliado.
3. Deja todo guardado como borrador en `posts/<fecha>/`.
4. Si están las credenciales de Instagram configuradas, **publica automático**.

Nada de esto queda "andando solo" hasta que completes los pasos de abajo.

---

## 0. Runner self-hosted (por qué existe)

El acceso sin autenticar a Mercado Libre está bloqueado (probado y confirmado): la API
pública devuelve `403 Forbidden` sin importar la IP, y el sitio web exige login para ver
resultados de búsqueda incluso navegando con un navegador real. Por eso el sistema usa la
**API oficial autenticada con OAuth** (sección 0-bis) en vez de tráfico anónimo.

El job `generate` de `.github/workflows/daily-posts.yml` sigue corriendo en
`runs-on: self-hosted` (tu PC) porque ahí es donde se hace el setup inicial del token de
Mercado Libre — el `refresh_token` queda guardado en el disco de ese equipo, no en GitHub.
Los jobs `deploy-pages` y `publish` siguen en `ubuntu-latest` sin problema.

### Cómo instalar el runner self-hosted (una vez)

1. En el repo: `Settings → Actions → Runners → New self-hosted runner`.
2. Elige tu sistema operativo (Windows/Mac/Linux) — GitHub te muestra los comandos exactos
   para tu caso, cópialos y pégalos en una terminal (en Windows, PowerShell) en ese orden:
   descargar el paquete del runner, configurarlo (`./config.sh` o `config.cmd`, te va a
   pedir la URL del repo y un token — ambos ya te los da la misma pantalla), y por último
   iniciarlo (`./run.sh` o `run.cmd`).
3. Mientras esa ventana de terminal quede abierta y el equipo prendido/conectado a
   internet, el runner queda "escuchando" y disponible para correr el job todos los días
   a la hora del cron (13:00 UTC) o cuando lo dispares manual.
4. Si quieres que quede corriendo solo sin tener que abrir la terminal cada vez, en el
   mismo directorio del runner hay un script para instalarlo como servicio:
   `sudo ./svc.sh install && sudo ./svc.sh start` (Linux/Mac) o el instalador de servicio
   que trae el runner para Windows.

**Importante:** si el equipo está apagado o el runner no está corriendo a la hora del
cron, esa corrida del día simplemente no se ejecuta (no genera error, solo no pasa nada).

---

## 0-bis. API oficial de Mercado Libre (OAuth)

Esto reemplaza el acceso anónimo bloqueado. Requiere tu cuenta de Mercado Libre (la misma
de afiliados sirve).

1. Ve a **developers.mercadolibre.com/devcenter**, inicia sesión con tu cuenta de ML, y
   crea una aplicación nueva ("Crear aplicación"). Nombre y descripción los que quieras.
2. En **"Redirect URI"** pon `https://www.mercadolibre.cl/` (no necesita ser un servidor
   funcional propio, solo sirve para que el navegador te muestre la URL con el código al
   final — lo copias de la barra de direcciones aunque la página en sí no cargue nada útil).
3. Guarda el **Client ID** y el **Client secret** que te muestra — esos son tus
   `ML_APP_ID` y `ML_APP_SECRET`. Guárdalos como secrets de GitHub (sección 4) y también en
   tu `.env` local (para el paso 5).
4. Arma esta URL reemplazando `TU_APP_ID` por tu Client ID, y ábrela en el navegador:
   ```
   https://auth.mercadolibre.cl/authorization?response_type=code&client_id=TU_APP_ID&redirect_uri=https://www.mercadolibre.cl/
   ```
5. Inicia sesión con tu cuenta de Mercado Libre y autoriza la app. Vas a terminar en una
   URL tipo `https://www.mercadolibre.cl/?code=TG-XXXXXXXX...` — copia el valor de `code`
   de la barra de direcciones (aunque la página muestre error, el código igual está ahí).
6. **En el mismo PC donde corre el runner self-hosted**, dentro de la carpeta del repo:
   ```bash
   cp .env.example .env   # si no lo habías hecho, y completa ML_APP_ID / ML_APP_SECRET
   npm install             # si no lo habías hecho
   node scripts/ml-oauth-setup.js "EL_CODE_QUE_COPIASTE" "https://www.mercadolibre.cl/"
   ```
   Esto deja el `refresh_token` guardado en tu carpeta de usuario (no en el repo, no se
   sube a git). El sistema lo va renovando solo en cada corrida — no necesitas repetir
   este paso salvo que el token se invalide por completo (poco frecuente).

---

## 1. Afiliados Mercado Libre

Ya tienes cuenta de afiliados, así que solo falta configurar los parámetros del link:

1. Entra a tu panel de Afiliados ML y genera un link de afiliado de prueba para cualquier
   producto (el que uses normalmente para compartir).
2. Copia la URL generada y fíjate en los parámetros de query, típicamente algo como
   `?matt_tool=XXXXXXXX&matt_word=YYYYYYYY`.
3. Guarda esos dos valores como secrets de GitHub (ver sección 4):
   - `ML_AFFILIATE_MATT_TOOL`
   - `ML_AFFILIATE_MATT_WORD`

Si tu panel genera los links de otra forma (por ejemplo con un shortlink propio en vez de
parámetros de query), pásame un link de ejemplo y ajusto `src/affiliateLink.js` al formato
real.

---

## 2. Cuenta de Instagram Business + Meta Graph API

Esto lo tienes que hacer tú porque requiere tu login de Facebook/Instagram. Pasos:

1. **Convierte tu Instagram a cuenta Business o Creator** (Configuración → Cuenta → Cambiar
   a cuenta profesional), si no lo está ya.
2. **Vincúlala a una Página de Facebook** (Configuración de Instagram → Cuenta vinculada a
   Facebook). Si no tienes Página, créala (es gratis).
3. Ve a **developers.facebook.com → My Apps → Create App** (tipo "Business").
4. Dentro de la app, agrega el producto **Instagram Graph API**.
5. En **Graph API Explorer** (developers.facebook.com/tools/explorer):
   - Selecciona tu app.
   - Pide permisos: `instagram_basic`, `instagram_content_publish`, `pages_show_list`,
     `pages_read_engagement`.
   - Genera un **User Access Token** y autoriza tu cuenta/Página.
6. Consigue el **IG Business Account ID**:
   `GET https://graph.facebook.com/v21.0/me/accounts?access_token=TU_TOKEN`
   → toma el `id` de tu Página, luego:
   `GET https://graph.facebook.com/v21.0/<PAGE_ID>?fields=instagram_business_account&access_token=TU_TOKEN`
   → ese `instagram_business_account.id` es tu `IG_BUSINESS_ACCOUNT_ID`.
7. **Cambia el token de corta duración por uno de larga duración (60 días)**:
   `GET https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=APP_ID&client_secret=APP_SECRET&fb_exchange_token=TOKEN_CORTO`
   → ese es tu `IG_ACCESS_TOKEN`.
8. El token de 60 días **igual expira**: para que el cron no se corte solo, agenda renovarlo
   cada ~50 días (recordatorio en tu calendario), o dime y armamos un job separado que lo
   renueve automático con un refresh token de sistema (requiere Business Verification en
   Meta, es un trámite aparte).

Guarda `IG_BUSINESS_ACCOUNT_ID` e `IG_ACCESS_TOKEN` como secrets de GitHub.

---

## 3. Habilitar GitHub Pages (para que Instagram pueda ver las imágenes)

La Graph API de Instagram exige que la imagen esté en una URL pública, no puede ser un
archivo subido directo. El workflow publica las capturas del día en GitHub Pages.

1. En el repo: `Settings → Pages → Build and deployment → Source: GitHub Actions`.
2. Nada más que hacer acá, el workflow ya está configurado para desplegar.

Si el repo es **privado**, GitHub Pages también queda privado salvo que tengas GitHub
Enterprise, y la Graph API de Instagram **no va a poder acceder** a esas imágenes (no tiene
tu sesión de GitHub). En ese caso hay dos opciones:
- Hacer público el repo (o al menos aceptar que las capturas de productos queden públicas,
  que de todas formas es contenido que ya es público en Mercado Libre), o
- Usar otro hosting de imágenes públicas (ej. Cloudinary, S3 con bucket público) en vez de
  GitHub Pages. Si prefieres esto, dime y adapto `src/publish.js`.

---

## 4. Secrets a configurar en GitHub

`Settings → Secrets and variables → Actions → New repository secret`:

| Secret | De dónde sale |
|---|---|
| `ML_APP_ID` | App de Mercado Libre (sección 0-bis) |
| `ML_APP_SECRET` | App de Mercado Libre (sección 0-bis) |
| `ML_AFFILIATE_MATT_TOOL` | Panel de Afiliados ML (sección 1) |
| `ML_AFFILIATE_MATT_WORD` | Panel de Afiliados ML (sección 1) |
| `IG_BUSINESS_ACCOUNT_ID` | Meta Graph API (sección 2) |
| `IG_ACCESS_TOKEN` | Meta Graph API (sección 2) |
| `ANTHROPIC_API_KEY` | Opcional, solo si quieres captions generados con Claude en vez de plantilla fija |

El `refresh_token` de Mercado Libre **no** va en los secrets de GitHub — queda guardado
localmente en el equipo del runner (ver sección 0-bis, paso 6).

---

## 5. Probar en tu propio PC antes de confiar en el cron

```bash
git clone <este repo>
cd <repo>
npm install
npx playwright install --with-deps chromium
cp .env.example .env   # y completa los valores
npm run research        # genera posts/<fecha>/ con capturas + captions + links
npm run publish          # solo publica si ya definiste PAGES_BASE_URL + credenciales IG
```

Revisa `posts/<fecha>/index.json` y las imágenes generadas antes de dejarlo en automático.

---

## 6. Resumen del cron

`.github/workflows/daily-posts.yml` corre todos los días a las 13:00 UTC
(ajusta el `cron:` si quieres otro horario) y también se puede disparar manual desde la
pestaña **Actions → Ofertas Mercado Libre → Instagram → Run workflow**.

## 7. Sobre "dejar Claude en Chrome" publicando

Usar la extensión Claude en Chrome para automatizar el login/publicación manual en
Instagram no es lo mismo que este sistema: implicaría manejar tu sesión de Instagram por
navegador, algo frágil y contra los términos de uso de Instagram (riesgo real de bloqueo de
cuenta). Por eso este sistema usa la **Graph API oficial de Meta** en su lugar. La extensión
Claude en Chrome además corre en tu computador, no en este entorno en la nube, así que no
puede ser parte del cron diario de GitHub Actions de todas formas.
