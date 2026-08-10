// Cliente sobre la API pública de Mercado Libre (https://api.mercadolibre.com).
// Usa un navegador real (Playwright) en vez de fetch() plano: Mercado Libre bloquea con
// 403 las peticiones sin huella de navegador real, sin importar si la IP es de datacenter
// o residencial (confirmado). Un Chromium real con headers normales sí pasa.
'use strict';

const { chromium } = require('playwright');

const BASE = 'https://api.mercadolibre.com';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

let browserPromise = null;
function getBrowser() {
  if (!browserPromise) {
    browserPromise = chromium.launch();
  }
  return browserPromise;
}

// Cierra el navegador compartido. Llamar al terminar toda la investigación del día.
async function closeBrowser() {
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close();
    browserPromise = null;
  }
}

async function getJson(url) {
  const browser = await getBrowser();
  const page = await browser.newPage({ userAgent: USER_AGENT, locale: 'es-CL' });
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    if (!response) {
      throw new Error(`GET ${url} -> sin respuesta`);
    }
    if (!response.ok()) {
      throw new Error(`GET ${url} -> ${response.status()} ${response.statusText()}`);
    }
    const text = await page.evaluate(() => document.body.innerText);
    return JSON.parse(text);
  } finally {
    await page.close();
  }
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

module.exports = { getTrendingKeywords, searchBestSelling, getItemReviews, closeBrowser };
