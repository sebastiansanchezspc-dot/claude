#!/usr/bin/env node
// Prueba varios endpoints de la API de Mercado Libre con el token OAuth guardado,
// para saber exactamente cuáles funcionan y cuáles no. Útil para armar un ticket
// de soporte específico en vez de "no me funciona la API".
// Uso: node scripts/ml-diagnose.js
'use strict';

require('dotenv').config();
const { getAccessToken } = require('../src/mlAuth');

const SITE = process.env.ML_SITE || 'MLC';

const CHECKS = [
  { name: 'Identidad (/users/me)', url: 'https://api.mercadolibre.com/users/me' },
  { name: `Sitio (/sites/${SITE})`, url: `https://api.mercadolibre.com/sites/${SITE}` },
  { name: `Categorías (/sites/${SITE}/categories)`, url: `https://api.mercadolibre.com/sites/${SITE}/categories` },
  {
    name: `Búsqueda (/sites/${SITE}/search?q=notebook)`,
    url: `https://api.mercadolibre.com/sites/${SITE}/search?q=notebook&limit=1`,
  },
  { name: `Tendencias (/trends/${SITE})`, url: `https://api.mercadolibre.com/trends/${SITE}` },
];

async function main() {
  const accessToken = await getAccessToken();
  console.log('Token obtenido OK. Probando endpoints...\n');

  for (const check of CHECKS) {
    try {
      const res = await fetch(check.url, { headers: { Authorization: `Bearer ${accessToken}` } });
      const body = await res.text();
      const preview = body.slice(0, 200).replace(/\s+/g, ' ');
      console.log(`${res.ok ? '✅' : '❌'} ${check.name} -> ${res.status}`);
      if (!res.ok) {
        console.log(`   ${preview}`);
      }
    } catch (e) {
      console.log(`❌ ${check.name} -> ERROR: ${e.message}`);
    }
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
