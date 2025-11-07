// server
const express = require("express");
const fs = require("fs");
const path = require("path");
const { ENTITY_ID, ACCESS_TOKEN, API_HOST, SHOPPER_RESULT_URL } = require("./config");
const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Utilities
const BASE = "https://" + String(API_HOST).replace(/\/?$/, "/");

function prepareCheckout() {
  const body = new URLSearchParams({
    entityId: ENTITY_ID,
    amount: "0.10",
    currency: "GBP",
    paymentType: "DB",
    integrity: "true",
  }).toString();

  return fetch(BASE + "v1/checkouts", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    body,
  }).then((r) => r.json());
}

app.get("/payment", async (req, res) => {
  try {
    const prep = await prepareCheckout();
    console.log("Checkout preparation response:", JSON.stringify(prep, null, 2));

    const checkoutId = prep?.id || "";

    if (!checkoutId) {
      console.error("No checkout ID received from API");
      return res.status(500).send("Could not initialize payment - no checkout ID received.");
    }

    let html = fs.readFileSync(
      path.join(__dirname, "public", "payment.html"),
      "utf8"
    );
    html = html.replace(/{{checkoutId}}/g, checkoutId);

    res.send(html);
  } catch (err) {
    console.error("Payment initialization error:", err);
    res.status(500).send("Could not initialize payment.");
  }
});

function getPaymentStatus(resourcePath) {
  const rp = String(resourcePath || "").replace(/^\/+/, "");
  const url = BASE + rp;

  console.log("Fetching payment status from URL:", url);
  console.log("Using entityId:", ENTITY_ID);

  return fetch(url, {
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
  }).then((r) => r.json());
}

app.get("/result", async (req, res) => {
  const resourcePath = req.query.resourcePath;
  console.log("Result endpoint called with resourcePath:", resourcePath);

  if (!resourcePath) {
    return res.status(400).send("Missing resourcePath query parameter.");
  }

  try {
    const status = await getPaymentStatus(resourcePath);
    console.log("Payment status response:", JSON.stringify(status, null, 2));
    res.json(status);
  } catch (err) {
    console.error("Could not fetch payment status:", err);
    res.status(500).send("Could not fetch payment status.");
  }
});

app.get("/", (req, res) => res.redirect("/payment"));

module.exports = app;
