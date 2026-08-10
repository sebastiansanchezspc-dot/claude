'use strict';

const { searchBestSelling, getItemDetails } = require('./mercadolibre');

// La API de "tendencias" de Mercado Libre también está bloqueada para tráfico no
// autenticado, así que en vez de tendencias en tiempo real usamos una lista fija
// de categorías/búsquedas amplias y populares. No es "lo más buscado hoy", es una
// muestra de categorías donde buscamos lo más vendido y mejor calificado. Ajusta
// esta lista cuando quieras.
const SEED_CATEGORIES = [
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

// Recorre las categorías, junta los productos más vendidos de cada una (el sitio ya
// los devuelve ordenados por ventas), visita cada ficha para leer rating/reseñas
// reales, y se queda con los que cumplen el mínimo configurado.
async function findTopProducts({
  site,
  keywordLimit = 15,
  perKeyword = 5,
  minRating = 4.5,
  minReviews = 10,
  topN = 5,
}) {
  const categories = SEED_CATEGORIES.slice(0, keywordLimit);

  const seen = new Set();
  const candidates = [];

  for (const category of categories) {
    let items;
    try {
      items = await searchBestSelling(site, category, perKeyword);
    } catch (e) {
      console.warn(`Búsqueda falló para "${category}": ${e.message}`);
      continue;
    }
    for (const item of items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      candidates.push({ ...item, sourceKeyword: category });
    }
  }

  const qualified = [];
  for (const item of candidates) {
    if (qualified.length >= topN * 3) break;
    const details = await getItemDetails(item.permalink);
    const rating = details.rating ?? 0;
    const totalReviews = details.totalReviews ?? 0;
    if (rating >= minRating && totalReviews >= minReviews) {
      qualified.push({ ...item, price: details.price ?? item.price, rating, totalReviews });
    }
  }

  qualified.sort((a, b) => b.rating - a.rating);

  return qualified.slice(0, topN);
}

module.exports = { findTopProducts };
