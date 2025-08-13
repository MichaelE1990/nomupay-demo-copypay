// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch'); // If you're on Node < 18
const { ENTITY_ID, ACCESS_TOKEN, API_HOST } = require('./config');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

// API base
const BASE = `https://${String(API_HOST).replace(/\/?$/, '/')}`;

// Step 1 – Prepare checkout
function prepareCheckout() {
  const body = new URLSearchParams({
    entityId: ENTITY_ID,
    amount: '10.00',
    currency: 'GBP',
    paymentType: 'DB',
    integrity: 'true'
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

// Step 2 – Serve payment page with checkoutId injected
app.get('/checkout', async (req, res) => {
  try {
    const prep = await prepareCheckout();
    const checkoutId = prep?.id || '';

    let html = fs.readFileSync(path.join(__dirname, 'public', 'payment.html'), 'utf8');
    html = html.replace(/{{checkoutId}}/g, checkoutId);

    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Could not initialize payment.');
  }
});

// Step 3 – Handle shopperResultUrl (payment result)
app.get('/paymentresult', async (req, res) => {
  const resourcePath = req.query.resourcePath;
  if (!resourcePath) return res.status(400).send('Missing resourcePath');

  try {
    const rp = String(resourcePath).replace(/^\/+/, '');
    const url = BASE + rp + `?entityId=${encodeURIComponent(ENTITY_ID)}`;

    const status = await fetch(url, {
      headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
    }).then(r => r.json());

    // For now, just dump JSON payload in browser
    res.send(`<pre>${JSON.stringify(status, null, 2)}</pre>`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching payment status');
  }
});

app.get('/', (req, res) => res.redirect('/checkout'));

module.exports = app;