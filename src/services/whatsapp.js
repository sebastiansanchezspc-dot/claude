const axios = require('axios');

const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION || 'v21.0';

function client() {
  return axios.create({
    baseURL: `https://graph.facebook.com/${GRAPH_API_VERSION}`,
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
}

async function sendText(to, text) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  await client().post(`/${phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text },
  });
}

module.exports = { sendText };
