const express = require('express');
const { handleWhatsAppEvent, handleInstagramEvent } = require('../handlers/messageHandler');

const router = express.Router();

// Meta llama a esto UNA vez cuando configuras el callback URL en el dashboard.
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Meta envía aquí cada evento entrante (mensajes, estados, etc.)
router.post('/', async (req, res) => {
  // Responder rápido: Meta reintenta si no recibe 200 en pocos segundos.
  res.sendStatus(200);

  const body = req.body;
  try {
    if (body.object === 'whatsapp_business_account') {
      await handleWhatsAppEvent(body);
    } else if (body.object === 'instagram') {
      await handleInstagramEvent(body);
    }
  } catch (err) {
    console.error('Error procesando evento de webhook:', err.response?.data || err.message);
  }
});

module.exports = router;
