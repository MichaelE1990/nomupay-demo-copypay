const express     = require('express');
const https       = require('https');
const querystring = require('querystring');
const fs          = require('fs');
const path        = require('path');
const {
  ENTITY_ID,
  ACCESS_TOKEN,
  API_HOST,
  SHOPPER_RESULT_URL
} = require('./config');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

function prepareCheckout(amount = '0.00', currency = 'GBP') {
  const postData = querystring.stringify({
    entityId: ENTITY_ID,
    amount,
    currency,
    paymentType: 'DB',
    integrity: 'true'
  });

  const options = {
    hostname: API_HOST,
    port: 443,
    path: '/v1/checkouts',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData),
      'Authorization': `Bearer ${ACCESS_TOKEN}`
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Step 3: retrieve payment status
function getPaymentStatus(resourcePath) {
  return new Promise((resolve, reject) => {
    const pathWithQuery = `${resourcePath}?entityId=${ENTITY_ID}`;
    const options = {
      hostname: API_HOST,
      port: 443,
      path: pathWithQuery,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

app.get('/checkout', async (req, res) => {
  const amount   = req.query.amount   || '10.00';
  const currency = req.query.currency || 'GBP';

  try {
    const prep = await prepareCheckout(amount, currency);
    console.log('prepareCheckout response:', JSON.stringify(prep, null, 2));
    const { id: checkoutId, integrity } = prep;
    const fullResultUrl = `${req.protocol}://${req.get('host')}${SHOPPER_RESULT_URL}`;
    let html = fs.readFileSync(path.join(__dirname, 'public', 'payment.html'), 'utf8');
    html = html
      .replace(/{{checkoutId}}/g, checkoutId)
      .replace(/{{integrity}}/g, integrity)
      .replace(/{{shopperResultUrl}}/g, fullResultUrl);
    res.send(html);
  } catch (err) {
    console.error('Error preparing checkout:', err);
    res.status(500).send('Could not initialize payment.');
  }
});

// Handle redirect and fetch payment status
app.get('/result', async (req, res) => {
  const resourcePath = req.query.resourcePath;
  if (!resourcePath) {
    return res.status(400).send('Missing resourcePath query parameter.');
  }
  try {
    const statusResponse = await getPaymentStatus(resourcePath);
    let html = fs.readFileSync(path.join(__dirname, 'public', 'paymentresult.html'), 'utf8');
    html = html
      .replace(/{{statusCode}}/g, statusResponse.result.code || '')
      .replace(/{{statusDescription}}/g, statusResponse.result.description || '')
      .replace(/{{paymentBrand}}/g, statusResponse.paymentBrand || '')
      .replace(/{{amount}}/g, statusResponse.amount || '')
      .replace(/{{currency}}/g, statusResponse.currency || '');
    res.send(html);
  } catch (err) {
    console.error('Error fetching payment status:', err);
    res.status(500).send('Could not fetch payment status.');
  }
});

// Redirect root to the checkout page with default values
app.get('/', (req, res) => {
  res.redirect('/checkout?amount=10.00&currency=GBP');
});

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});