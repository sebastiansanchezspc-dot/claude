'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { findTopProducts, findManualProducts } = require('./research');
const { readManualProductUrls, clearManualProductUrls } = require('./manualProducts');
const { buildAffiliateLink } = require('./affiliateLink');
const { buildCaptionWithClaude } = require('./caption');
const { screenshotProduct } = require('./screenshot');

async function main() {
  const site = process.env.ML_SITE || 'MLC';
  const topN = Number(process.env.POSTS_PER_DAY || 5);
  const minRating = Number(process.env.MIN_RATING || 4.5);
  const minReviews = Number(process.env.MIN_REVIEWS || 10);

  const manualUrls = readManualProductUrls();
  let products;
  if (manualUrls.length > 0) {
    console.log(`Usando ${manualUrls.length} link(s) de manual-products.txt...`);
    products = (await findManualProducts(manualUrls)).slice(0, topN);
    if (products.length > 0) {
      // Solo se limpia si se pudo leer algo; si todo falló, se deja la lista para
      // reintentar en la próxima corrida en vez de perder los links.
      clearManualProductUrls();
    }
  } else {
    console.log(`Buscando los ${topN} productos más vendidos y mejor calificados en ${site}...`);
    products = await findTopProducts({ site, keywordLimit: 15, perKeyword: 5, minRating, minReviews, topN });
  }

  if (products.length === 0) {
    console.log('No hay productos para generar posts hoy (ni manuales ni automáticos).');
    return;
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const outDir = path.join(__dirname, '..', 'posts', dateStr);
  fs.mkdirSync(outDir, { recursive: true });

  const results = [];
  for (const product of products) {
    const affiliateLink = buildAffiliateLink(product.permalink);
    const caption = await buildCaptionWithClaude(product, affiliateLink);

    const imageRelPath = `${dateStr}/${product.id}.png`;
    const imageAbsPath = path.join(outDir, `${product.id}.png`);
    try {
      await screenshotProduct(product.permalink, imageAbsPath);
    } catch (e) {
      console.warn(`No se pudo capturar screenshot de ${product.id}: ${e.message}`);
    }

    const post = {
      id: product.id,
      title: product.title,
      price: product.price,
      rating: product.rating,
      totalReviews: product.totalReviews,
      sourceKeyword: product.sourceKeyword,
      permalink: product.permalink,
      affiliateLink,
      caption,
      image: imageRelPath,
      published: false,
      generatedAt: new Date().toISOString(),
    };
    results.push(post);
    fs.writeFileSync(path.join(outDir, `${product.id}.json`), JSON.stringify(post, null, 2));
  }

  fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(results, null, 2));
  console.log(`Listo: ${results.length} posts generados en posts/${dateStr}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
