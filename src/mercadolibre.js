// Cliente delgado sobre la API pública de Mercado Libre (https://api.mercadolibre.com).
// No requiere autenticación para búsqueda/tendencias/reseñas.
'use strict';

const BASE = 'https://api.mercadolibre.com';

async function getJson(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ofertas-bot/1.0)' },
  });
  if (!res.ok) {
    throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// Búsquedas actualmente en tendencia en el sitio (proxy de "lo que se está comprando ahora").
async function getTrendingKeywords(site, limit = 15) {
  const data = await getJson(`${BASE}/trends/${site}`);
  return (Array.isArray(data) ? data : []).slice(0, limit).map((t) => t.keyword).filter(Boolean);
}

// Resultados de búsqueda ordenados por cantidad vendida.
async function searchBestSelling(site, query, limit = 5) {
  const url = `${BASE}/sites/${site}/search?q=${encodeURIComponent(query)}&sort=sold_quantity_desc&limit=${limit}`;
  const data = await getJson(url);
  return data.results || [];
}

// Rating promedio y cantidad de reseñas de un producto.
async function getItemReviews(itemId) {
  try {
    return await getJson(`${BASE}/reviews/item/${itemId}`);
  } catch (e) {
    return null;
  }
}

module.exports = { getTrendingKeywords, searchBestSelling, getItemReviews };
