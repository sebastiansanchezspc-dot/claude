// Lista manual de productos: mientras la API de Mercado Libre esté bloqueada para
// descubrimiento automático, el usuario pega acá los links que quiere publicar.
'use strict';

const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '..', 'manual-products.txt');

const TEMPLATE = `# Un link de producto de Mercado Libre por línea (el link normal del producto,
# no de búsqueda). Líneas que empiecen con # se ignoran.
#
# Ejemplo:
# https://articulo.mercadolibre.cl/MLC-123456789-producto-ejemplo-_JM
#
# El sistema procesa los links de acá cada vez que corre, arma los posts, y
# borra los links ya procesados de esta lista (para no repetir el mismo post).
`;

function readManualProductUrls() {
  if (!fs.existsSync(FILE_PATH)) return [];
  const content = fs.readFileSync(FILE_PATH, 'utf-8');
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

// Deja el archivo con solo el encabezado (los links ya se procesaron).
function clearManualProductUrls() {
  fs.writeFileSync(FILE_PATH, TEMPLATE, 'utf-8');
}

module.exports = { readManualProductUrls, clearManualProductUrls, FILE_PATH };
