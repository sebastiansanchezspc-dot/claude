// Cliente sobre el sitio público de Mercado Libre (no la API).
// La API (api.mercadolibre.com) devuelve 403 para tráfico no autenticado sin
// importar el origen (IP datacenter, IP residencial, con o sin navegador real:
// confirmado con pruebas reales). Por eso acá navegamos directamente las páginas
// que ve cualquier comprador (listado de búsqueda y ficha de producto) con un
// navegador real (Playwright) y leemos los datos desde el DOM.
//
// Esto es más frágil que la API: si Mercado Libre cambia el HTML de estas
// páginas, los selectores de abajo hay que actualizarlos.
'use strict';

const { chromium } = require('playwright');

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

let browserPromise = null;
function getBrowser() {
  if (!browserPromise) {
    browserPromise = chromium.launch();
  }
  return browserPromise;
}

let contextPromise = null;
async function getContext() {
  if (!contextPromise) {
    contextPromise = (async () => {
      const browser = await getBrowser();
      const context = await browser.newContext({
        userAgent: USER_AGENT,
        locale: 'es-CL',
        viewport: { width: 1280, height: 900 },
      });
      // Visita la portada primero para dejar cookies/sesión antes de ir a búsquedas,
      // igual que haría una persona navegando de verdad.
      const warmup = await context.newPage();
      try {
        await warmup.goto('https://www.mercadolibre.cl/', { waitUntil: 'domcontentloaded', timeout: 20000 });
        await warmup.waitForTimeout(1000);
      } catch (e) {
        console.warn(`No se pudo calentar la sesión: ${e.message}`);
      }
      await warmup.close();
      return context;
    })();
  }
  return contextPromise;
}

// Cierra el navegador compartido. Llamar al terminar toda la investigación del día.
async function closeBrowser() {
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close();
    browserPromise = null;
    contextPromise = null;
  }
}

function extractItemId(url) {
  const match = url.match(/(MLC-?\d+)/i);
  if (!match) return null;
  return match[1].toUpperCase().replace('-', '');
}

// Busca en el sitio (listado.mercadolibre.cl) ordenado por más vendidos.
async function searchBestSelling(site, query, limit = 5) {
  const context = await getContext();
  const page = await context.newPage();
  try {
    const slug = query.trim().toLowerCase().replace(/\s+/g, '-');
    const url = `https://listado.mercadolibre.cl/${encodeURIComponent(slug)}_OrderId_SOLD_QUANTITY_DESC`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(1500);

    const items = await page.$$eval(
      'li.ui-search-layout__item, div.ui-search-result__wrapper',
      (nodes) =>
        nodes.map((node) => {
          const link = node.querySelector(
            'a.ui-search-link, a.ui-search-item__group__element, a.ui-search-result__content',
          );
          const titleEl = node.querySelector('.ui-search-item__title, h2');
          const priceEl = node.querySelector('.andes-money-amount__fraction');
          const permalink = link ? link.href : '';
          return {
            title: titleEl ? titleEl.textContent.trim() : link ? link.getAttribute('title') || '' : '',
            price: priceEl ? Number(priceEl.textContent.replace(/\./g, '').replace(/[^\d]/g, '')) : null,
            permalink,
          };
        }),
    );

    return items
      .filter((i) => i.permalink && i.title)
      .map((i) => ({ ...i, id: extractItemId(i.permalink) }))
      .filter((i) => i.id)
      .slice(0, limit);
  } finally {
    await page.close();
  }
}

// Visita la ficha del producto y lee rating/reseñas/precio reales desde el DOM
// (la API de reviews también está bloqueada).
async function getItemDetails(permalink) {
  const context = await getContext();
  const page = await context.newPage();
  try {
    await page.goto(permalink, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(1000);
    return await page.evaluate(() => {
      const ratingEl = document.querySelector(
        '.ui-pdp-review__rating, .ui-review-capability__rating__average',
      );
      const amountEl = document.querySelector(
        '.ui-pdp-review__amount, .ui-review-capability__rating__label',
      );
      const priceEl = document.querySelector(
        '.ui-pdp-price__second-line .andes-money-amount__fraction, .andes-money-amount__fraction',
      );
      const rating = ratingEl ? parseFloat(ratingEl.textContent.replace(',', '.')) : null;
      const reviewsText = amountEl ? amountEl.textContent : '';
      const totalReviews = reviewsText ? parseInt(reviewsText.replace(/[^\d]/g, ''), 10) || 0 : 0;
      const price = priceEl ? Number(priceEl.textContent.replace(/\./g, '').replace(/[^\d]/g, '')) : null;
      return { rating, totalReviews, price };
    });
  } catch (e) {
    return { rating: null, totalReviews: 0, price: null };
  } finally {
    await page.close();
  }
}

module.exports = { searchBestSelling, getItemDetails, closeBrowser };
