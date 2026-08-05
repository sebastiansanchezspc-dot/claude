const whatsapp = require('../services/whatsapp');
const instagram = require('../services/instagram');

// Punto único de "cerebro" del bot: dado un texto entrante, decide la respuesta.
// Sustituye esta función por tu lógica real (reglas, IA, integración con un CRM, etc.)
function buildReply(incomingText) {
  return `Recibí tu mensaje: "${incomingText}"`;
}

async function handleWhatsAppEvent(body) {
  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const messages = change.value?.messages || [];
      for (const message of messages) {
        if (message.type !== 'text') continue;
        const reply = buildReply(message.text.body);
        await whatsapp.sendText(message.from, reply);
      }
    }
  }
}

async function handleInstagramEvent(body) {
  for (const entry of body.entry || []) {
    for (const event of entry.messaging || []) {
      if (!event.message?.text || event.message.is_echo) continue;
      const reply = buildReply(event.message.text);
      await instagram.sendText(event.sender.id, reply);
    }
  }
}

module.exports = { handleWhatsAppEvent, handleInstagramEvent };
