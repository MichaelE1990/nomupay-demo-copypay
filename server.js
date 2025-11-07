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

  // Build the full URL with entityId as query parameter
  const url = `${BASE_URL}${cleanPath}?entityId=${ENTITY_ID}`;

  console.log("Fetching payment status:");
  console.log("  Original resourcePath:", resourcePath);
  console.log("  Decoded path:", decodedPath);
  console.log("  Final URL:", url);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${ACCESS_TOKEN}`,
    },
  });

  const data = await response.json();
  console.log("Payment status response:", {
    resultCode: data.result?.code,
    resultDescription: data.result?.description,
    paymentBrand: data.paymentBrand,
    amount: data.amount,
    currency: data.currency,
  });

  return data;
}

/**
 * Route: Home - Redirect to payment page
 */
app.get("/", (req, res) => {
  res.redirect("/payment");
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
 * Route: Result API - Fetch payment status from gateway
 */
app.get("/result", async (req, res) => {
  const resourcePath = req.query.resourcePath;

  console.log("Result API called with resourcePath:", resourcePath);

  if (!resourcePath) {
    console.error("Missing resourcePath parameter");
    return res.status(400).json({
      error: "Missing resourcePath query parameter"
    });
  }

  try {
    const status = await getPaymentStatus(resourcePath);
    res.json(status);
  } catch (error) {
    console.error("Could not fetch payment status:", error);
    res.status(500).json({
      error: "Could not fetch payment status"
    });
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
