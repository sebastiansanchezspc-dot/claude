// Autenticación OAuth de Mercado Libre (developers.mercadolibre.com).
// El access_token dura pocas horas; el refresh_token se usa para renovarlo y
// Mercado Libre entrega un refresh_token NUEVO cada vez que se usa (el anterior
// queda inválido). Por eso lo guardamos en un archivo en el disco del equipo que
// corre el runner (no en GitHub Secrets) y lo vamos actualizando solos en cada
// corrida. Ver SETUP.md para el setup inicial (una sola vez).
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const TOKEN_FILE = path.join(os.homedir(), '.ml-ofertas-bot', 'refresh_token.txt');
const TOKEN_ENDPOINT = 'https://api.mercadolibre.com/oauth/token';

function readStoredRefreshToken() {
  try {
    return fs.readFileSync(TOKEN_FILE, 'utf-8').trim() || null;
  } catch (e) {
    return null;
  }
}

function storeRefreshToken(token) {
  fs.mkdirSync(path.dirname(TOKEN_FILE), { recursive: true });
  fs.writeFileSync(TOKEN_FILE, token, 'utf-8');
}

// Canjea un authorization code por el primer par access_token/refresh_token
// (setup inicial, una sola vez). Ver scripts/ml-oauth-setup.js.
async function exchangeCodeForTokens({ clientId, clientSecret, code, redirectUri }) {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`No se pudo canjear el code de Mercado Libre: ${JSON.stringify(data)}`);
  }
  return data;
}

// Devuelve un access_token válido, renovándolo (y rotando el refresh_token
// guardado) si hace falta. Se llama una vez por corrida.
async function getAccessToken() {
  const clientId = process.env.ML_APP_ID;
  const clientSecret = process.env.ML_APP_SECRET;
  const refreshToken = readStoredRefreshToken();

  if (!clientId || !clientSecret) {
    throw new Error('Faltan ML_APP_ID / ML_APP_SECRET (secrets de GitHub, ver SETUP.md).');
  }
  if (!refreshToken) {
    throw new Error(
      `No hay refresh token de Mercado Libre guardado en ${TOKEN_FILE}. ` +
        'Corre "node scripts/ml-oauth-setup.js <code> <redirect_uri>" una vez (ver SETUP.md).',
    );
  }

  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`No se pudo renovar el token de Mercado Libre: ${JSON.stringify(data)}`);
  }
  if (data.refresh_token) {
    storeRefreshToken(data.refresh_token);
  }
  return data.access_token;
}

module.exports = { getAccessToken, exchangeCodeForTokens, storeRefreshToken, TOKEN_FILE };
