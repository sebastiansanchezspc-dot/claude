'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { publishToInstagram } = require('./instagram');

function joinUrl(base, rel) {
  return `${base.replace(/\/+$/, '')}/${rel.replace(/^\/+/, '')}`;
}

async function main() {
  const dateStr = process.argv[2] || new Date().toISOString().slice(0, 10);
  const pagesBaseUrl = process.env.PAGES_BASE_URL;
  const igUserId = process.env.IG_BUSINESS_ACCOUNT_ID;
  const accessToken = process.env.IG_ACCESS_TOKEN;

  const dir = path.join(__dirname, '..', 'posts', dateStr);
  const indexPath = path.join(dir, 'index.json');
  if (!fs.existsSync(indexPath)) {
    console.log(`No hay posts generados para ${dateStr} (${indexPath} no existe).`);
    return;
  }
  const posts = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));

  if (!igUserId || !accessToken) {
    console.log(
      'Faltan IG_BUSINESS_ACCOUNT_ID / IG_ACCESS_TOKEN: dejo los posts como borrador, no publico (ver SETUP.md).',
    );
    return;
  }
  if (!pagesBaseUrl) {
    console.log('Falta PAGES_BASE_URL (URL pública donde quedaron las imágenes): no publico.');
    return;
  }

  let changed = false;
  for (const post of posts) {
    if (post.published) continue;
    const imageUrl = joinUrl(pagesBaseUrl, post.image);
    try {
      const result = await publishToInstagram({ igUserId, accessToken, imageUrl, caption: post.caption });
      post.published = true;
      post.igMediaId = result.id;
      post.publishedAt = new Date().toISOString();
      changed = true;
      console.log(`Publicado: "${post.title}" -> media ${result.id}`);
    } catch (e) {
      console.error(`Error publicando "${post.title}": ${e.message}`);
    }
  }

  if (changed) {
    fs.writeFileSync(indexPath, JSON.stringify(posts, null, 2));
    for (const post of posts) {
      fs.writeFileSync(path.join(dir, `${post.id}.json`), JSON.stringify(post, null, 2));
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
