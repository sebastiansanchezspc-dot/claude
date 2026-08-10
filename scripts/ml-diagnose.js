#!/usr/bin/env node
// Prueba varios endpoints de la API de Mercado Libre con el token OAuth guardado,
// para saber exactamente cuáles funcionan y cuáles no. Útil para armar un ticket
// de soporte específico a Mercado Libre, y para validar la alternativa a /search
// (el endpoint de "highlights", productos destacados por categoría).
// Uso: node scripts/ml-diagnose.js
'use strict';

require('dotenv').config();
const { getAccessToken } = require('../src/mlAuth');

const SITE = process.env.ML_SITE || 'MLC';

async function check(name, url, accessToken) {
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch (e) {
      // no era JSON, se deja null
    }
    const preview = text.slice(0, 250).replace(/\s+/g, ' ');
    console.log(`${res.ok ? '✅' : '❌'} ${name} -> ${res.status}`);
    if (!res.ok) console.log(`   ${preview}`);
    return { ok: res.ok, json };
  } catch (e) {
    console.log(`❌ ${name} -> ERROR: ${e.message}`);
    return { ok: false, json: null };
  }
}

async function main() {
  const accessToken = await getAccessToken();
  console.log('Token obtenido OK. Probando endpoints...\n');

  await check('Identidad (/users/me)', 'https://api.mercadolibre.com/users/me', accessToken);
  await check(`Sitio (/sites/${SITE})`, `https://api.mercadolibre.com/sites/${SITE}`, accessToken);
  const categoriesResult = await check(
    `Categorías (/sites/${SITE}/categories)`,
    `https://api.mercadolibre.com/sites/${SITE}/categories`,
    accessToken,
  );
  await check(
    `Búsqueda (/sites/${SITE}/search?q=notebook)`,
    `https://api.mercadolibre.com/sites/${SITE}/search?q=notebook&limit=1`,
    accessToken,
  );
  await check(`Tendencias (/trends/${SITE})`, `https://api.mercadolibre.com/trends/${SITE}`, accessToken);

  if (categoriesResult.ok && Array.isArray(categoriesResult.json) && categoriesResult.json.length > 0) {
    const firstCategory = categoriesResult.json[0];
    console.log(`\nUsando categoría de prueba: ${firstCategory.id} (${firstCategory.name})\n`);

    const highlightsResult = await check(
      `Highlights (/highlights/${SITE}/category/${firstCategory.id})`,
      `https://api.mercadolibre.com/highlights/${SITE}/category/${firstCategory.id}`,
      accessToken,
    );
    if (highlightsResult.ok) {
      console.log('   Respuesta completa de highlights:');
      console.log(JSON.stringify(highlightsResult.json, null, 2));
    }

    const firstItemId = highlightsResult.json?.content?.[0]?.id || highlightsResult.json?.highlights?.[0];
    if (firstItemId) {
      console.log(`\nUsando item de prueba: ${firstItemId}\n`);
      await check(`Item (/items/${firstItemId})`, `https://api.mercadolibre.com/items/${firstItemId}`, accessToken);
      await check(
        `Reviews (/reviews/item/${firstItemId})`,
        `https://api.mercadolibre.com/reviews/item/${firstItemId}`,
        accessToken,
      );
    }
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
