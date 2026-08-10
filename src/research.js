'use strict';

const { getTrendingKeywords, searchBestSelling, getItemReviews } = require('./mercadolibre');
const { scrapeProductPage, extractItemId } = require('./productPage');

// Plan B si el endpoint de tendencias no está disponible para esta app (algunas apps de
// Mercado Libre no tienen habilitado /trends por defecto). Categorías amplias y populares.
const FALLBACK_CATEGORIES = [
  'notebook',
  'celular',
  'smart tv',
  'audifonos bluetooth',
  'zapatillas',
  'aspiradora robot',
  'freidora de aire',
  'smartwatch',
  'parlante bluetooth',
  'cafetera',
];

// Recorre las búsquedas en tendencia, junta los productos más vendidos de cada una,
// y se queda con los que cumplen el mínimo de rating y de reseñas.
async function findTopProducts({
  site,
  keywordLimit = 15,
  perKeyword = 5,
  minRating = 4.5,
  minReviews = 10,
  topN = 5,
}) {
  let keywords = [];
  try {
    keywords = await getTrendingKeywords(site, keywordLimit);
  } catch (e) {
    console.warn(`No se pudo obtener tendencias (${e.message}), uso categorías fijas de respaldo.`);
  }
  if (keywords.length === 0) {
    keywords = FALLBACK_CATEGORIES.slice(0, keywordLimit);
  }

  const seen = new Set();
  const candidates = [];

  for (const keyword of keywords) {
    let items;
    try {
      items = await searchBestSelling(site, keyword, perKeyword);
    } catch (e) {
      console.warn(`Búsqueda falló para "${keyword}": ${e.message}`);
      continue;
    }
    for (const item of items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      candidates.push({ ...item, sourceKeyword: keyword });
    }
  }

  const qualified = [];
  for (const item of candidates) {
    const reviews = await getItemReviews(item.id);
    const rating = reviews?.rating_average ?? 0;
    const totalReviews = reviews?.total_reviews ?? reviews?.total ?? 0;
    if (rating >= minRating && totalReviews >= minReviews) {
      qualified.push({ ...item, rating, totalReviews });
    }
  }

  qualified.sort((a, b) => (b.sold_quantity ?? 0) - (a.sold_quantity ?? 0) || b.rating - a.rating);

  return qualified.slice(0, topN);
}

// Procesa una lista de links de producto puestos a mano (manual-products.txt) en vez
// de descubrirlos por API/búsqueda.
async function findManualProducts(urls) {
  const products = [];
  for (const url of urls) {
    try {
      const data = await scrapeProductPage(url);
      products.push({
        id: extractItemId(url) || url,
        title: data.title || 'Producto de Mercado Libre',
        price: data.price,
        rating: data.rating ?? 0,
        totalReviews: data.totalReviews ?? 0,
        permalink: url,
        sourceKeyword: 'manual',
      });
    } catch (e) {
      console.warn(`No se pudo leer datos de ${url}: ${e.message}`);
    }
  }
  return products;
}

module.exports = { findTopProducts, findManualProducts };
