'use strict';

// Arma el link de afiliado a partir del permalink del producto.
// Mercado Libre Afiliados taggea los links con parámetros de query (matt_tool / matt_word)
// que obtienes desde tu panel de afiliados al generar un link de prueba.
// Ver SETUP.md para el paso a paso de cómo sacar estos valores.
function buildAffiliateLink(permalink) {
  const tool = process.env.ML_AFFILIATE_MATT_TOOL;
  const word = process.env.ML_AFFILIATE_MATT_WORD;
  if (!tool && !word) return permalink;

  const url = new URL(permalink);
  if (tool) url.searchParams.set('matt_tool', tool);
  if (word) url.searchParams.set('matt_word', word);
  return url.toString();
}

module.exports = { buildAffiliateLink };
