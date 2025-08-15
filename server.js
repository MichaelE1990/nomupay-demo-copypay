// server
const express = require("express");
const fs = require("fs");
const path = require("path");
const { ENTITY_ID, ACCESS_TOKEN, API_HOST } = require("./config");
const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Utilities
const BASE = "https://" + String(API_HOST).replace(/\/?$/, "/");

function prepareCheckout() {
  const body = new URLSearchParams({
    entityId: ENTITY_ID,
    amount: "10.00",
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

app.post('/update-checkout', async (req, res) => {
  try {
    const { checkoutId, amount, currency } = req.body || {};
    if (!checkoutId || !amount || !currency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const body = new URLSearchParams({
      entityId: ENTITY_ID,
      amount: String(amount),
      currency: String(currency)
    }).toString();

    const resp = await fetch(BASE + 'v1/checkouts/' + encodeURIComponent(checkoutId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body,
    });

    const data = await resp.json();
    if (!resp.ok) {
      return res.status(resp.status).json({ error: 'Gateway update failed', details: data });
    }

    res.json({ ok: true, gateway: data });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
