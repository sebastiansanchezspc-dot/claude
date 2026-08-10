'use strict';

const { chromium } = require('playwright');

// Captura la página del producto (arriba del fold: galería, precio, rating).
async function screenshotProduct(url, outPath) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: outPath });
  } finally {
    await browser.close();
  }
}

module.exports = { screenshotProduct };
