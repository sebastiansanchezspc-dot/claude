# Bot de WhatsApp e Instagram (Meta Graph API)

Bot base con webhooks ya funcionales para WhatsApp Cloud API e Instagram Messaging API.

## 1. Instalar dependencias

```bash
npm install
```

## 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Rellena `.env` con lo que vayas obteniendo en [Meta for Developers](https://developers.facebook.com/):

- `VERIFY_TOKEN`: cualquier string secreto que tú inventes (debe coincidir con el que pongas en el dashboard).
- `WHATSAPP_ACCESS_TOKEN` y `WHATSAPP_PHONE_NUMBER_ID`: en tu App > WhatsApp > API Setup.
- `INSTAGRAM_ACCESS_TOKEN` (Page Access Token) y `INSTAGRAM_PAGE_ID`: la cuenta de Instagram debe ser Business/Creator y estar vinculada a una Página de Facebook.

## 3. Correr en local

```bash
npm run dev
```

Expón el puerto con un túnel para que Meta pueda llamar a tu webhook:

```bash
ngrok http 3000
```

## 4. Configurar el webhook en Meta

En tu App de Meta for Developers, en el producto WhatsApp e Instagram (Messenger API for Instagram):

- Callback URL: `https://<tu-url-de-ngrok>/webhook`
- Verify Token: el mismo valor que pusiste en `VERIFY_TOKEN`
- Suscríbete al campo `messages` (WhatsApp) y `messages`/`messaging_postbacks` (Instagram)

Meta hará un `GET /webhook` para verificar; si el servidor está corriendo, se valida solo.

## 5. Probar

Escríbele al número de prueba de WhatsApp o a la cuenta de Instagram conectada. El bot responde con un eco simple (`src/handlers/messageHandler.js`) — reemplaza `buildReply` con tu lógica real.

## Estructura

```
src/
  index.js               servidor Express
  routes/webhook.js       verificación (GET) y recepción de eventos (POST)
  handlers/messageHandler.js   lógica del bot
  services/whatsapp.js    envío de mensajes vía WhatsApp Cloud API
  services/instagram.js   envío de mensajes vía Instagram Messaging API
```
