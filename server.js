require('dotenv').config();
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Configuration
const ENTITY_ID = process.env.ENTITY_ID;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const API_HOST = process.env.API_HOST || "eu-test.oppwa.com";
const BASE_URL = `https://${API_HOST}/`;

// Validate required environment variables
if (!ENTITY_ID || !ACCESS_TOKEN) {
  console.error("ERROR: Missing required environment variables!");
  console.error("Required: ENTITY_ID, ACCESS_TOKEN");
  console.error("Current ENTITY_ID:", ENTITY_ID ? "Set" : "MISSING");
  console.error("Current ACCESS_TOKEN:", ACCESS_TOKEN ? "Set" : "MISSING");
}

/**
 * Prepare a checkout session with the payment gateway
 */
async function prepareCheckout() {
  const body = new URLSearchParams({
    entityId: ENTITY_ID,
    amount: "0.10",
    currency: "GBP",
    paymentType: "DB",
  }).toString();

  console.log("Preparing checkout with entityId:", ENTITY_ID);

  const response = await fetch(`${BASE_URL}v1/checkouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Bearer ${ACCESS_TOKEN}`,
    },
    body,
  });

  const data = await response.json();
  console.log("Checkout response:", {
    id: data.id,
    resultCode: data.result?.code,
    resultDescription: data.result?.description,
  });

  return data;
}

/**
 * Get payment status using the resourcePath
 */
async function getPaymentStatus(resourcePath) {
  // The resourcePath comes URL-encoded from the widget, decode it first
  const decodedPath = decodeURIComponent(resourcePath);
  // Remove leading slashes
  const cleanPath = decodedPath.replace(/^\/+/, "");

  // Build the full URL with entityId as query parameter (required by API)
  const url = `${BASE_URL}${cleanPath}?entityId=${encodeURIComponent(ENTITY_ID)}`;

  console.log("Fetching payment status:");
  console.log("  Original resourcePath:", resourcePath);
  console.log("  Decoded path:", decodedPath);
  console.log("  Clean path:", cleanPath);
  console.log("  EntityId:", ENTITY_ID);
  console.log("  Final URL:", url);
  console.log("  Using Authorization:", ACCESS_TOKEN ? `Bearer ${ACCESS_TOKEN.substring(0, 20)}...` : 'MISSING');

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${ACCESS_TOKEN}`,
    },
  });

  const data = await response.json();
  console.log("Payment status response:", JSON.stringify(data, null, 2));

  return data;
}

/**
 * Route: Home - Redirect to payment page
 */
app.get("/", (req, res) => {
  res.redirect("/payment");
});

/**
 * Route: Debug - Check environment variables (remove in production)
 */
app.get("/debug/env", (req, res) => {
  res.json({
    entityIdSet: !!ENTITY_ID,
    entityIdValue: ENTITY_ID ? `${ENTITY_ID.substring(0, 8)}...` : 'MISSING',
    accessTokenSet: !!ACCESS_TOKEN,
    apiHost: API_HOST,
    baseUrl: BASE_URL,
    nodeEnv: process.env.NODE_ENV,
  });
});

/**
 * Route: Payment page - Initialize checkout and display payment form
 */
app.get("/payment", async (req, res) => {
  try {
    // Prepare checkout with the payment gateway
    const checkout = await prepareCheckout();

    if (!checkout.id) {
      console.error("No checkout ID received:", checkout);
      return res.status(500).send(
        `Could not initialize payment. ${checkout.result?.description || 'Unknown error'}`
      );
    }

    // Read the payment template
    let html = fs.readFileSync(
      path.join(__dirname, "public", "payment.html"),
      "utf8"
    );

    // Replace the checkout ID placeholder
    html = html.replace(/{{checkoutId}}/g, checkout.id);

    res.send(html);
  } catch (error) {
    console.error("Payment initialization error:", error);
    res.status(500).send("Could not initialize payment. Please try again.");
  }
});

/**
 * Route: Payment Result - Server-side rendering of payment status
 */
app.get("/paymentresult", async (req, res) => {
  const resourcePath = req.query.resourcePath;
  const checkoutId = req.query.id;

  console.log("Payment result page accessed:");
  console.log("  Checkout ID:", checkoutId);
  console.log("  Resource Path:", resourcePath);

  if (!resourcePath) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Result</title>
        <link rel="stylesheet" href="styles.css">
      </head>
      <body>
        <div class="container">
          <h1>Payment Result</h1>
          <p style="color: red;">Error: Missing payment information</p>
          <p><a href="/payment">Try again</a></p>
        </div>
      </body>
      </html>
    `);
  }

  try {
    const status = await getPaymentStatus(resourcePath);

    console.log("Rendering payment result:", {
      code: status.result?.code,
      description: status.result?.description
    });

    const isSuccess = status.result?.code?.startsWith('000.');
    const statusColor = isSuccess ? 'green' : 'red';

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Result</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="styles.css">
        <style>
          .success { color: green; }
          .error { color: red; }
          .result-box {
            padding: 20px;
            border: 2px solid #ddd;
            border-radius: 8px;
            margin: 20px 0;
          }
          .debug {
            margin-top: 30px;
            padding: 15px;
            background: #f5f5f5;
            border: 1px solid #ddd;
            font-family: monospace;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Payment Result</h1>

          <div class="result-box">
            <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${status.result?.description || 'Unknown'}</span></p>
            <p><strong>Code:</strong> ${status.result?.code || 'N/A'}</p>
            ${status.paymentBrand ? `<p><strong>Payment Method:</strong> ${status.paymentBrand}</p>` : ''}
            ${status.amount ? `<p><strong>Amount:</strong> ${status.amount} ${status.currency || ''}</p>` : ''}
            ${status.id ? `<p><strong>Transaction ID:</strong> ${status.id}</p>` : ''}
          </div>

          <p><a href="/payment">Make another payment</a></p>

          <details class="debug">
            <summary>Debug Information (click to expand)</summary>
            <pre>${JSON.stringify({
              checkoutId,
              resourcePath,
              entityId: ENTITY_ID,
              fullResponse: status
            }, null, 2)}</pre>
          </details>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Error fetching payment status:", error);
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Result</title>
        <link rel="stylesheet" href="styles.css">
      </head>
      <body>
        <div class="container">
          <h1>Payment Result</h1>
          <p style="color: red;">Error: Could not fetch payment status</p>
          <p>${error.message}</p>
          <p><a href="/payment">Try again</a></p>
        </div>
      </body>
      </html>
    `);
  }
});

// Start server if run directly (not imported as module)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Payment URL: http://localhost:${PORT}/payment`);
  });
}

module.exports = app;
