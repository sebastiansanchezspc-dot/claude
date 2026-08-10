'use strict';

// Voz de la cuenta "Somos Ratas": orgullosamente ahorrativos, cero clickbait,
// se dirige a la audiencia como ratones/ratitas. Ver IDENTITY.md.
const INTROS = [
  '🐭 Ratas reportándose, encontramos la posta',
  '🧀 Ratita, esto no te lo puedes perder',
  '🐭 Las ratas cazamos, no pagamos de más',
  '👀 Ojo ratones, esta hay que cazarla',
  '🐭 Reporte rata del día, aguanten',
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
    'Link para comprar 👇 (afiliado, ratón honesto)',
    affiliateLink,
    '',
    '#somosratas #ratachile #ofertaschile #mercadolibrechile #ratasunidas',
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
            'Escribe un caption de Instagram en español chileno para la cuenta "Somos Ratas": ' +
            'la personalidad es la de un ratón orgullosamente ahorrativo que caza la mejor oferta ' +
            'de Mercado Libre para no pagar de más, y se la comparte a sus "ratones/ratitas" ' +
            '(la audiencia). Tono cercano, picante y con humor chileno, nunca burlón con la gente ' +
            'de pocos recursos — la marca celebra ser ahorrativo, no se ríe de la pobreza. ' +
            'Puedes usar guiños de roedor (🐭🧀) con moderación, sin abusar. ' +
            'Usa 2-4 emojis en total, incluye el precio, y termina con 3-5 hashtags en español chileno ' +
            'sobre ofertas (incluye #somosratas). ' +
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
