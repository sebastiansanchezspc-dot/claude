// Lee título/precio/rating desde la ficha real de un producto de Mercado Libre
// (no un listado de búsqueda). Visitar un link específico de producto es lo que
// hace normalmente cualquier afiliado, así que tiene mucha menos chance de
// toparse con el muro anti-bot que sí bloqueó los listados de búsqueda.
'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const DEBUG_DIR = path.join(__dirname, '..', 'debug');

async function saveDebug(page, kind) {
  try {
    fs.mkdirSync(DEBUG_DIR, { recursive: true });
    await page.screenshot({ path: path.join(DEBUG_DIR, `${kind}.png`), fullPage: true });
    fs.writeFileSync(path.join(DEBUG_DIR, `${kind}.html`), await page.content());
    console.log(`[debug] guardado debug/${kind}.png y .html`);
  } catch (e) {
    console.warn(`[debug] no se pudo guardar "${kind}": ${e.message}`);
  }
}

function extractItemId(url) {
  const match = url.match(/(MLC-?\d+)/i);
  return match ? match[1].toUpperCase().replace('-', '') : null;
}

async function scrapeProductPage(url) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ userAgent: USER_AGENT, locale: 'es-CL' });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);

    const data = await page.evaluate(() => {
      const titleEl = document.querySelector('.ui-pdp-title, h1');
      const priceEl = document.querySelector(
        '.ui-pdp-price__second-line .andes-money-amount__fraction, .andes-money-amount__fraction',
      );
      const ratingEl = document.querySelector('.ui-pdp-review__rating, .ui-review-capability__rating__average');
      const amountEl = document.querySelector('.ui-pdp-review__amount, .ui-review-capability__rating__label');

      const title = titleEl ? titleEl.textContent.trim() : null;
      const price = priceEl ? Number(priceEl.textContent.replace(/\./g, '').replace(/[^\d]/g, '')) : null;
      const rating = ratingEl ? parseFloat(ratingEl.textContent.replace(',', '.')) : null;
      const reviewsText = amountEl ? amountEl.textContent : '';
      const totalReviews = reviewsText ? parseInt(reviewsText.replace(/[^\d]/g, ''), 10) || 0 : 0;

      return { title, price, rating, totalReviews };
    });

    if (!data.title || data.rating === null) {
      await saveDebug(page, `manual-${extractItemId(url) || Date.now()}`);
    }

    return data;
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeProductPage, extractItemId };
