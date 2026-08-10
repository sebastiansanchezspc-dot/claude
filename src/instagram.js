'use strict';

// Publicación en Instagram vía Meta Graph API (cuenta Business/Creator).
// Requiere que la imagen esté en una URL pública (Graph API no acepta archivos locales).
// Ver SETUP.md para cómo conseguir IG_BUSINESS_ACCOUNT_ID e IG_ACCESS_TOKEN.
const GRAPH_VERSION = 'v21.0';
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;

async function publishToInstagram({ igUserId, accessToken, imageUrl, caption }) {
  const createRes = await fetch(`${GRAPH}/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: accessToken }),
  });
  const createData = await createRes.json();
  if (!createRes.ok) {
    throw new Error(`IG media create falló: ${JSON.stringify(createData)}`);
  }

  const publishRes = await fetch(`${GRAPH}/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: createData.id, access_token: accessToken }),
  });
  const publishData = await publishRes.json();
  if (!publishRes.ok) {
    throw new Error(`IG publish falló: ${JSON.stringify(publishData)}`);
  }

  return publishData;
}

module.exports = { publishToInstagram };
