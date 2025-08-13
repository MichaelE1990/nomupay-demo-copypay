// server
const express = require('express');
const fs      = require('fs');
const path    = require('path');
const { ENTITY_ID, ACCESS_TOKEN, API_HOST } = require('./config');

const app  = express();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Utilities
const BASE = 'https://' + String(API_HOST).replace(/\/?$/, '/');

function prepareCheckout() {
  const body = new URLSearchParams({
    entityId:    ENTITY_ID,
    amount:      '10.00',
    currency:    'GBP',
    paymentType: 'DB',
    integrity:   'true'
  }).toString();

  return fetch(BASE + 'v1/checkouts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${ACCESS_TOKEN}`
    },
    body
  }).then(r => r.json());
}

app.get('/checkout', async (req, res) => {
  try {
    const prep = await prepareCheckout();
    const checkoutId = prep?.id || '';

    let html = fs.readFileSync(path.join(__dirname, 'public', 'payment.html'), 'utf8');
    html = html.replace(/{{checkoutId}}/g, checkoutId);

    res.send(html);
  } catch (_) {
    res.status(500).send('Could not initialize payment.');
  }
});

function getPaymentStatus(resourcePath) {
  const rp  = String(resourcePath || '').replace(/^\/+/, '');
  const url = BASE + rp + `?entityId=${encodeURIComponent(ENTITY_ID)}`;

  return fetch(url, {
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
  }).then(r => r.json());
}

// Serve the confirmation page (client JS will call /status)
app.get('/result', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'paymentresult.html'));
});

// API for the confirmation page to fetch status (Step 3)
app.get('/status', async (req, res) => {
  const resourcePath = req.query.resourcePath;
  if (!resourcePath) return res.status(400).json({ error: 'Missing resourcePath' });

  try {
    const status = await getPaymentStatus(resourcePath);
    res.json(status);
  } catch (_) {
    res.status(500).json({ error: 'Could not fetch payment status' });
  }
});

app.get('/', (req, res) => res.redirect('/checkout'));

module.exports = app;