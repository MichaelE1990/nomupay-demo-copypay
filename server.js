require('dotenv').config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();

// Middleware for parsing request bodies
app.use(express.json());
app.use(express.text({ type: 'text/plain' }));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Configuration
const ENTITY_ID = process.env.ENTITY_ID;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const API_HOST = process.env.API_HOST || "eu-test.oppwa.com";
const BASE_URL = `https://${API_HOST}/`;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

// Validate required environment variables
if (!ENTITY_ID || !ACCESS_TOKEN) {
  console.error("ERROR: Missing required environment variables!");
  console.error("Required: ENTITY_ID, ACCESS_TOKEN");
  console.error("Current ENTITY_ID:", ENTITY_ID ? "Set" : "MISSING");
  console.error("Current ACCESS_TOKEN:", ACCESS_TOKEN ? "Set" : "MISSING");
}

if (!WEBHOOK_SECRET) {
  console.warn("WARNING: WEBHOOK_SECRET not set. Webhook endpoint will not work.");
}

// Store recent webhooks in memory (for viewing/debugging)
const recentWebhooks = [];

/**
 * Prepare a checkout session with the payment gateway
 */
async function prepareCheckout() {
const body = new URLSearchParams({
  entityId: ENTITY_ID,
  amount: "12.99",
  currency: "GBP",
  paymentType: "DB",         // ✅ WAS "PA" — Klarna inline needs DB
  integrity: "true",
  testMode: "EXTERNAL",
  "billing.street1": "Easter Road 10",
  "billing.city": "Edinburgh",
  "billing.state": "Scotland",
  "billing.postcode": "EH99",
  "billing.country": "GB",
  "customer.givenName": "John",
  "customer.surname": "Doe",
  "customer.email": "john@doe.com",
  "shipping.street1": "Easter Road 10",
  "shipping.city": "Edinburgh",
  "shipping.state": "Scotland",
  "shipping.postcode": "EH99",
  "shipping.country": "GB",
  "shipping.givenName": "John",
  "shipping.surname": "Doe",
  "shipping.customer.email": "john@doe.com",
  "cart.items[0].name": "Battery Power Pack",
  "cart.items[0].price": "12.99",
  "cart.items[0].quantity": "1",
  "cart.items[0].tax": "0",
  "cart.items[0].totalAmount": "12.99",
  "cart.items[0].totalTaxAmount": "0",
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
 * Decrypt webhook payload using AES-256-GCM
 */
function decryptWebhook(encryptedBody, iv, authTag, secret) {
  try {
    const key = Buffer.from(secret, "hex");
    const ivBuffer = Buffer.from(iv, "hex");
    const authTagBuffer = Buffer.from(authTag, "hex");
    const cipherText = Buffer.from(encryptedBody, "hex");

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, ivBuffer);
    decipher.setAuthTag(authTagBuffer);

    const decrypted = Buffer.concat([
      decipher.update(cipherText),
      decipher.final()
    ]);

    return decrypted.toString("utf8");
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error(`Failed to decrypt webhook: ${error.message}`);
  }
}

/**
 * Process webhook notification and determine actions
 */
function processWebhookNotification(notification) {
  const { type, action, payload } = notification;

  console.log("\n=== WEBHOOK NOTIFICATION RECEIVED ===");
  console.log("Type:", type);
  console.log("Action:", action || "N/A");
  console.log("Payload:", JSON.stringify(payload, null, 2));

  // What you should do based on notification type:
  switch (type) {
    case "PAYMENT":
      console.log("\n📌 PAYMENT NOTIFICATION - Recommended Actions:");
      console.log("  1. Update your database with payment status");
      console.log("  2. Send confirmation email to customer");
      console.log("  3. Update order status in your system");
      console.log("  4. Trigger fulfillment if payment successful");

      if (payload.result?.code?.startsWith('000.')) {
        console.log("  ✅ Payment SUCCESSFUL - Proceed with order fulfillment");
        console.log("     Transaction ID:", payload.id);
        console.log("     Amount:", payload.amount, payload.currency);
        console.log("     Payment Brand:", payload.paymentBrand);
      } else {
        console.log("  ❌ Payment FAILED - Do NOT fulfill order");
        console.log("     Reason:", payload.result?.description);
      }
      break;

    case "REGISTRATION":
      console.log("\n📌 REGISTRATION NOTIFICATION - Recommended Actions:");
      console.log("  1. Store/update card token in your database");
      console.log("  2. Associate token with customer account");
      console.log("  3. Update subscription status if applicable");

      if (action === "CREATED") {
        console.log("  ✅ New card registered");
        console.log("     Registration ID:", payload.id);
      } else if (action === "UPDATED") {
        console.log("  🔄 Card details updated");
      } else if (action === "DELETED") {
        console.log("  🗑️  Card removed - Clean up references");
      }
      break;

    case "RISK":
      console.log("\n📌 RISK NOTIFICATION - Recommended Actions:");
      console.log("  1. Review transaction for potential fraud");
      console.log("  2. Hold order until manual review");
      console.log("  3. Consider requesting additional verification");
      break;

    default:
      console.log("\n📌 UNKNOWN NOTIFICATION TYPE");
      console.log("  Review the payload manually");
  }

  console.log("=====================================\n");

  return {
    processed: true,
    type,
    action,
    transactionId: payload.id,
    status: payload.result?.code
  };
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

/**
 * Route: View received webhooks - Debug page to see webhook data
 */
app.get("/webhooks/view", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Webhook Monitor</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="styles.css">
      <style>
        .webhook-item {
          border: 2px solid #ddd;
          border-radius: 8px;
          padding: 15px;
          margin: 15px 0;
          background: #f9f9f9;
        }
        .webhook-success { border-color: #4CAF50; }
        .webhook-failed { border-color: #f44336; }
        .timestamp {
          color: #666;
          font-size: 14px;
          font-family: monospace;
        }
        .payload {
          background: #fff;
          padding: 10px;
          border-radius: 4px;
          margin-top: 10px;
          font-family: monospace;
          font-size: 12px;
          overflow-x: auto;
        }
        .empty {
          text-align: center;
          padding: 40px;
          color: #999;
        }
        .refresh-btn {
          background: #4CAF50;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin: 10px 0;
        }
      </style>
      <script>
        function autoRefresh() {
          setTimeout(() => window.location.reload(), 5000);
        }
      </script>
    </head>
    <body onload="autoRefresh()">
      <div class="container">
        <h1>Webhook Monitor</h1>
        <p>This page shows the last 50 webhooks received. Auto-refreshes every 5 seconds.</p>
        <button class="refresh-btn" onclick="window.location.reload()">Refresh Now</button>
        <p><strong>Total Received:</strong> ${recentWebhooks.length}</p>

        ${recentWebhooks.length === 0 ? `
          <div class="empty">
            <h2>No webhooks received yet</h2>
            <p>Make a test payment to see webhook data here</p>
            <p><a href="/payment">Go to Payment Page</a></p>
          </div>
        ` : recentWebhooks.map((webhook, index) => {
          const isSuccess = webhook.notification.payload?.result?.code?.startsWith('000.');
          return `
            <div class="webhook-item ${isSuccess ? 'webhook-success' : 'webhook-failed'}">
              <div class="timestamp">
                <strong>#${index + 1}</strong> - ${webhook.timestamp}
              </div>
              <p><strong>Type:</strong> ${webhook.notification.type}</p>
              ${webhook.notification.action ? `<p><strong>Action:</strong> ${webhook.notification.action}</p>` : ''}
              <p><strong>Status:</strong> <span style="color: ${isSuccess ? 'green' : 'red'}; font-weight: bold;">
                ${webhook.notification.payload?.result?.description || 'N/A'}
              </span></p>
              <p><strong>Transaction ID:</strong> ${webhook.notification.payload?.id || 'N/A'}</p>
              ${webhook.notification.payload?.amount ? `
                <p><strong>Amount:</strong> ${webhook.notification.payload.amount} ${webhook.notification.payload.currency}</p>
              ` : ''}
              ${webhook.notification.payload?.paymentBrand ? `
                <p><strong>Payment Brand:</strong> ${webhook.notification.payload.paymentBrand}</p>
              ` : ''}
              <details>
                <summary>View Full Payload</summary>
                <pre class="payload">${JSON.stringify(webhook.notification, null, 2)}</pre>
              </details>
            </div>
          `;
        }).join('')}

        <p><a href="/payment">Make Another Payment</a></p>
      </div>
    </body>
    </html>
  `);
});

/**
 * Route: Webhook endpoint - Receive and process encrypted webhook notifications
 */
app.post("/webhook", async (req, res) => {
  try {
    console.log("\n🔔 Webhook request received");
    console.log("Headers:", JSON.stringify(req.headers, null, 2));

    // Validate webhook secret is configured
    if (!WEBHOOK_SECRET) {
      console.error("❌ WEBHOOK_SECRET not configured");
      return res.status(500).send("Webhook secret not configured");
    }

    // Extract encryption headers
    const iv = req.headers['x-initialization-vector'];
    const authTag = req.headers['x-authentication-tag'];

    if (!iv || !authTag) {
      console.error("❌ Missing required headers");
      return res.status(400).send("Missing encryption headers");
    }

    // Get encrypted body (handle both JSON wrapper and raw hex)
    let encryptedBody;
    if (req.is('application/json')) {
      // JSON wrapper format: {"encryptedBody": "hex_string"}
      encryptedBody = req.body.encryptedBody;
      console.log("📦 JSON wrapper format detected");
    } else {
      // Raw hex string format
      encryptedBody = req.body;
      console.log("📦 Raw hex format detected");
    }

    if (!encryptedBody) {
      console.error("❌ No encrypted body found");
      return res.status(400).send("Missing encrypted body");
    }

    console.log("🔐 Decrypting webhook payload...");

    // Decrypt the webhook
    const decryptedData = decryptWebhook(encryptedBody, iv, authTag, WEBHOOK_SECRET);
    const notification = JSON.parse(decryptedData);

    // Process the notification
    const result = processWebhookNotification(notification);

    // Store webhook for viewing (keep last 50)
    recentWebhooks.unshift({
      timestamp: new Date().toISOString(),
      notification,
      result
    });
    if (recentWebhooks.length > 50) {
      recentWebhooks.pop();
    }

    // TODO: Add your business logic here
    // Examples:
    // - Save to database
    // - Send emails
    // - Update order status
    // - Trigger fulfillment
    // - Update subscription status

    // Respond with 200 OK to acknowledge receipt
    // (Must respond within 30 seconds or webhook will retry)
    res.status(200).json({
      received: true,
      processed: result.processed,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Webhook processing error:", error);

    // Still return 200 if it's a processing error (not decryption)
    // This prevents unnecessary retries for data we can't process
    if (error.message.includes("decrypt")) {
      res.status(400).send("Decryption failed");
    } else {
      res.status(200).json({
        received: true,
        processed: false,
        error: "Processing failed"
      });
    }
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
