'use strict';

const { getTrendingKeywords, searchBestSelling, getItemReviews } = require('./mercadolibre');

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
  const keywords = await getTrendingKeywords(site, keywordLimit);
  if (keywords.length === 0) {
    console.warn('No se obtuvieron palabras en tendencia; revisa el token/credenciales de Mercado Libre.');
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

module.exports = { findTopProducts };
