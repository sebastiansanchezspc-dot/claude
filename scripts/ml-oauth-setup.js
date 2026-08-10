#!/usr/bin/env node
// Setup único: canjea el "code" que te da Mercado Libre al autorizar la app por
// un refresh_token, y lo deja guardado para que el resto del sistema lo use y
// renueve solo. Ver SETUP.md, sección "API oficial de Mercado Libre (OAuth)".
//
// Uso: node scripts/ml-oauth-setup.js <code> <redirect_uri>
'use strict';

require('dotenv').config();
const { exchangeCodeForTokens, storeRefreshToken, TOKEN_FILE } = require('../src/mlAuth');

async function main() {
  const [code, redirectUri] = process.argv.slice(2);
  const clientId = process.env.ML_APP_ID;
  const clientSecret = process.env.ML_APP_SECRET;

  if (!code || !redirectUri) {
    console.error('Uso: node scripts/ml-oauth-setup.js <code> <redirect_uri>');
    process.exit(1);
  }
  if (!clientId || !clientSecret) {
    console.error('Define ML_APP_ID y ML_APP_SECRET en tu .env antes de correr esto.');
    process.exit(1);
  }

  const tokens = await exchangeCodeForTokens({ clientId, clientSecret, code, redirectUri });
  if (!tokens.refresh_token) {
    console.error(
      'Mercado Libre no devolvió un refresh_token. Lo más probable: en la configuración de tu ' +
        'app (developers.mercadolibre.com/devcenter → tu app → Configuración y scopes → ' +
        '"Flujos OAuth"), la casilla "Refresh Token" está sin marcar. Márcala, guarda, saca un ' +
        'code nuevo (se invalida el anterior) y corre este script de nuevo.',
    );
    process.exit(1);
  }
  storeRefreshToken(tokens.refresh_token);
  console.log(`Listo. Refresh token guardado en ${TOKEN_FILE}`);
  console.log('Ya puedes correr "npm run research" o el workflow normalmente.');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
