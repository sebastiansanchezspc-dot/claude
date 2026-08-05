const axios = require('axios');

const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION || 'v21.0';

function client() {
  return axios.create({
    baseURL: `https://graph.facebook.com/${GRAPH_API_VERSION}`,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function sendText(recipientId, text) {
  const pageId = process.env.INSTAGRAM_PAGE_ID;
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  await client().post(`/${pageId}/messages?access_token=${accessToken}`, {
    recipient: { id: recipientId },
    message: { text },
  });
}

module.exports = { sendText };
