'use strict';

// Voz de la cuenta "El Dato Sapo": el sapo que sapea el dato bueno antes que nadie,
// pasándote la oferta con tono cercano y picado de Chile. Ver IDENTITY.md.
const INTROS = [
  '🐸 SAPEO DEL DÍA, cachen esto',
  '🐸 Les paso el dato antes que se acabe',
  '👀 Dato sapo: esta oferta no se las pueden perder',
  '🐸 Andábamos sapeando y encontramos esta joyita',
  '🔥 Dato filtrado directo pa\' ustedes',
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
    'Link para comprar 👇 (afiliado, dato transparente)',
    affiliateLink,
    '',
    '#eldatosapo #datochile #ofertaschile #mercadolibrechile #datosapo',
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
            'Escribe un caption de Instagram en español chileno para la cuenta "El Dato Sapo": ' +
            'la personalidad es la del "sapo" (en chileno: el que sapea/pasa el dato) que se entera ' +
            'primero de la oferta buena en Mercado Libre y se la pasa a su gente antes que nadie. ' +
            'Tono cercano, picado, cómplice ("te paso el dato", "sapeamos esto pa\' ti"), humor chileno, ' +
            'nunca burlón ni agresivo. Puedes usar el guiño de sapo (🐸) con moderación, sin abusar. ' +
            'Usa 2-4 emojis en total, incluye el precio, y termina con 3-5 hashtags en español chileno ' +
            'sobre ofertas (incluye #eldatosapo). ' +
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
