require('dotenv').config();
const express = require('express');
const webhookRouter = require('./routes/webhook');

const app = express();
app.use(express.json());

app.get('/', (_req, res) => res.send('Bot activo'));
app.use('/webhook', webhookRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor escuchando en el puerto ${port}`));
