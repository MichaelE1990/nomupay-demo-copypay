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
    shopperResultUrl: SHOPPER_RESULT_URL,
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
    const checkoutId = prep?.id || "";

    let html = fs.readFileSync(
      path.join(__dirname, "public", "payment.html"),
      "utf8"
    );
    html = html.replace(/{{checkoutId}}/g, checkoutId);

    res.send(html);
  } catch (_) {
    res.status(500).send("Could not initialize payment.");
  }
});

function getPaymentStatus(resourcePath) {
  const rp = String(resourcePath || "").replace(/^\/+/, "");
  const url = BASE + rp + `?entityId=${encodeURIComponent(ENTITY_ID)}`;

  return fetch(url, {
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
  }).then((r) => r.json());
}

app.get("/result", async (req, res) => {
  const resourcePath = req.query.resourcePath;
  if (!resourcePath) {
    return res.status(400).send("Missing resourcePath query parameter.");
  }

  try {
    const status = await getPaymentStatus(resourcePath);
    res.json(status);
  } catch (_) {
    res.status(500).send("Could not fetch payment status.");
  }
});

app.get("/", (req, res) => res.redirect("/payment"));

module.exports = app;
