// server.js
const express = require('express');
const fs      = require('fs');
const path    = require('path');
const { ENTITY_ID, ACCESS_TOKEN, API_HOST } = require('./config');

const app = express();

// Serve static files from /public (keep this unless Vercel serves them for you)
app.use(express.static(path.join(__dirname, 'public')));

// Create checkout (POST /v1/checkouts) and render payment page
function prepareCheckout(amount, currency) {
  const body = new URLSearchParams({
    entityId: ENTITY_ID,
    amount,
    currency,
    paymentType: 'DB',
    integrity: 'true'
  }).toString();

  return fetch(`https://${API_HOST}/v1/checkouts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${ACCESS_TOKEN}`
    },
    body
  }).then(r => r.json());
}

// Get payment status using baseUrl + resourcePath
function getPaymentStatus(resourcePath) {
  const url = `https://${API_HOST}${resourcePath}?entityId=${encodeURIComponent(ENTITY_ID)}`;
  return fetch(url, {
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
  }).then(r => r.json());
}

app.get('/checkout', async (req, res) => {
  const amount   = req.query.amount   || '10.00';
  const currency = req.query.currency || 'GBP';

  try {
    const prep = await prepareCheckout(amount, currency);
    const checkoutId = prep?.id || '';

    let html = fs.readFileSync(path.join(__dirname, 'public', 'payment.html'), 'utf8');
    html = html.replace(/{{checkoutId}}/g, checkoutId);

    res.send(html);
  } catch (err) {
    res.status(500).send('Could not initialize payment.');
  }
});

app.get('/result', async (req, res) => {
  const resourcePath = req.query.resourcePath;
  if (!resourcePath) {
    return res.status(400).send('Missing resourcePath query parameter.');
  }

  try {
    const statusResponse = await getPaymentStatus(resourcePath);

    let html = fs.readFileSync(path.join(__dirname, 'public', 'paymentresult.html'), 'utf8');
    html = html
      .replace(/{{statusCode}}/g, statusResponse?.result?.code || '')
      .replace(/{{statusDescription}}/g, statusResponse?.result?.description || '')
      .replace(/{{paymentBrand}}/g, statusResponse?.paymentBrand || '')
      .replace(/{{amount}}/g, statusResponse?.amount || '')
      .replace(/{{currency}}/g, statusResponse?.currency || '');

    res.send(html);
  } catch (err) {
    res.status(500).send('Could not fetch payment status.');
  }
});

app.get('/', (req, res) => {
  res.redirect('/checkout');
});

module.exports = app;