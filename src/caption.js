'use strict';

const INTROS = [
  '¡Ojo con esta ofertaza, chiquillos! 🔥',
  '¡Encontramos la posta del día, cabros! 😱🛒',
  '¡Aguanten que esto está regalado! 💸',
  '¡Se las dejamos calentitas! 🙌',
  '¡Esta se las tenía que compartir sí o sí! 👀',
];

function formatCLP(price) {
  if (!price && price !== 0) return '';
  return `$${Number(price).toLocaleString('es-CL')}`;
}

// Caption por plantilla, funciona sin depender de ninguna API externa.
function buildCaption(product, affiliateLink) {
  const intro = INTROS[Math.floor(Math.random() * INTROS.length)];
  const price = formatCLP(product.price);
  const rating = product.rating ? `⭐ ${product.rating.toFixed(1)} (${product.totalReviews} reseñas)` : '';

  return [
    intro,
    '',
    product.title,
    price,
    rating,
    '',
    'Link para comprar 👇 (afiliado)',
    affiliateLink,
    '',
    '#ofertas #mercadolibrechile #ofertaschile #descuentos #compraschile',
  ].join('\n');
}

// Versión con Claude para más variedad de tono; cae a la plantilla si no hay API key
// o si la llamada falla.
async function buildCaptionWithClaude(product, affiliateLink) {
  if (!process.env.ANTHROPIC_API_KEY) return buildCaption(product, affiliateLink);

  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic();
    const response = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content:
            'Escribe un caption de Instagram en español chileno, tono amigable, cercano y entusiasta ' +
            '(como un amigo que encuentra ofertas, no como vendedor genérico), para este producto de Mercado Libre. ' +
            'Usa 2-4 emojis, incluye el precio, y termina con 3-5 hashtags relevantes en español chileno sobre ofertas. ' +
            'No inventes datos que no te doy (rating, precio, título). No incluyas el link, yo lo agrego después.\n\n' +
            `Producto: ${product.title}\n` +
            `Precio: ${formatCLP(product.price)}\n` +
            `Rating: ${product.rating ? product.rating.toFixed(1) : 'sin rating'} (${product.totalReviews || 0} reseñas)`,
        },
      ],
    });
    const text = response.content?.find((b) => b.type === 'text')?.text?.trim();
    if (!text) return buildCaption(product, affiliateLink);
    return `${text}\n\nLink para comprar 👇 (afiliado)\n${affiliateLink}`;
  } catch (e) {
    console.warn(`Caption con Claude falló, uso plantilla: ${e.message}`);
    return buildCaption(product, affiliateLink);
  }
}

module.exports = { buildCaption, buildCaptionWithClaude };
