// PayPal Smart Buttons examples for /paypal-examples, taken from ACI's
// "PayPal Rest API integration sheet" (paymentknowledgebase.com, PS space, page 68883870).
// Each example sets the checkout currency and the wpwlOptions the widget gets.
// Every checkout is paymentType=DB, so every example sends paypal.intent = "capture"
// (sheet, Funding sources: "If paymentType=DB in the OPP request, add intent capture").

const SHEET = "https://paymentknowledgebase.com/spaces/PS/pages/68883870/PayPal+Rest+API+integration+sheet";

const PAYPAL_EXAMPLES = [
  // ---------- Styling (sheet: PayPal Smart Buttons > Customization) ----------
  {
    key: "default",
    group: "Button styling",
    title: "Default buttons (no styling)",
    sheet: `${SHEET}#PayPalRestAPIintegrationsheet-Customization`,
    sheetLabel: "Customization",
    currency: "USD",
    about: "No styling object, so PayPal uses its defaults: vertical layout, gold, rectangle, PayPal logo.",
    steps: [
      "PayPal decides which buttons to stack, based on buyer country, device and eligible funding sources (usually PayPal, Pay Later, Debit or Credit Card).",
      "Yellow PayPal button: popup opens, shopper logs in, picks a funding source (balance, card or bank) and approves.",
      "Black Debit or Credit Card button: PayPal's guest card form opens (card and billing details, no PayPal login).",
    ],
    options: {
      inlineFlow: ["PAYPAL"],
      paypal: { intent: "capture", onCancelRedirect: true },
    },
  },
  {
    key: "horizontal-blue-pill",
    group: "Button styling",
    title: "Horizontal, blue, pill, \"Pay with PayPal\" (sheet example)",
    sheet: `${SHEET}#PayPalRestAPIintegrationsheet-Customization`,
    sheetLabel: "Customization",
    currency: "USD",
    about: "The exact styling example from the sheet.",
    steps: [
      "layout horizontal: at most two buttons, side by side.",
      "color blue, shape pill (rounded ends), label pay: the button reads \"Pay with PayPal\".",
      "tagline false: no line of text under the buttons.",
    ],
    options: {
      inlineFlow: ["PAYPAL"],
      styling: { layout: "horizontal", color: "blue", shape: "pill", label: "pay", tagline: false },
      paypal: { intent: "capture", onCancelRedirect: true },
    },
  },
  {
    key: "horizontal-tagline",
    group: "Button styling",
    title: "Horizontal, gold, with tagline",
    sheet: `${SHEET}#PayPalRestAPIintegrationsheet-Customization`,
    sheetLabel: "Customization",
    currency: "USD",
    about: "Same as above but gold with the tagline switched on, so you can see what the tagline is.",
    steps: [
      "tagline true: PayPal adds a short line of text under the buttons.",
      "PayPal only shows the tagline in the horizontal layout.",
    ],
    options: {
      inlineFlow: ["PAYPAL"],
      styling: { layout: "horizontal", color: "gold", shape: "rect", label: "paypal", tagline: true },
      paypal: { intent: "capture", onCancelRedirect: true },
    },
  },
  {
    key: "checkout-black",
    group: "Button styling",
    title: "Black \"PayPal Checkout\" label",
    sheet: `${SHEET}#PayPalRestAPIintegrationsheet-Customization`,
    sheetLabel: "Customization",
    currency: "USD",
    about: "label checkout and color black (a second-choice colour in PayPal's guidance).",
    steps: ["The PayPal button reads \"PayPal Checkout\" instead of just the logo."],
    options: {
      inlineFlow: ["PAYPAL"],
      styling: { color: "black", label: "checkout" },
      paypal: { intent: "capture", onCancelRedirect: true },
    },
  },
  {
    key: "buynow-silver-tall",
    group: "Button styling",
    title: "Silver \"Buy Now\", tallest height (55)",
    sheet: `${SHEET}#PayPalRestAPIintegrationsheet-Customization`,
    sheetLabel: "Customization",
    currency: "USD",
    about: "label buynow, color silver, height 55 (allowed range 25 to 55).",
    steps: [
      "The PayPal button reads \"PayPal Buy Now\".",
      "Width follows the container; height is the only size you set in styling.",
    ],
    options: {
      inlineFlow: ["PAYPAL"],
      styling: { color: "silver", label: "buynow", height: 55 },
      paypal: { intent: "capture", onCancelRedirect: true },
    },
  },
  {
    key: "white-compact",
    group: "Button styling",
    title: "White, compact (height 25)",
    sheet: `${SHEET}#PayPalRestAPIintegrationsheet-Customization`,
    sheetLabel: "Customization",
    currency: "USD",
    about: "color white, height 25 (the smallest allowed).",
    steps: ["Smallest buttons PayPal allows, useful where space is tight."],
    options: {
      inlineFlow: ["PAYPAL"],
      styling: { color: "white", height: 25 },
      paypal: { intent: "capture", onCancelRedirect: true },
    },
  },

  // ---------- Funding sources (sheet: PayPal Smart Buttons > Funding sources) ----------
  {
    key: "paypal-only",
    group: "Funding sources",
    title: "PayPal button only (hide card and Pay Later)",
    sheet: `${SHEET}#PayPalRestAPIintegrationsheet-Fundingsources`,
    sheetLabel: "Funding sources",
    currency: "GBP",
    about: "fundingSources PAYPAL with card and Pay Later disabled. Likely fit for RVC if all card payments should stay on NomuPay.",
    steps: [
      "Only the yellow PayPal button shows.",
      "Shopper logs in to PayPal and chooses how to pay inside the popup (PayPal balance, linked card or bank).",
      "Approve: popup closes and the shopper lands on the result page.",
    ],
    options: {
      inlineFlow: ["PAYPAL"],
      fundingSources: ["PAYPAL"],
      paypal: {
        intent: "capture",
        onCancelRedirect: true,
        sdkParams: { components: "buttons", "disable-funding": "card,paylater,credit" },
      },
    },
  },
  {
    key: "card-only",
    group: "Funding sources",
    title: "PayPal guest card form only",
    sheet: `${SHEET}#PayPalRestAPIintegrationsheet-Fundingsources`,
    sheetLabel: "Funding sources",
    currency: "GBP",
    about: "fundingSources CARD: just PayPal's own card widget (the sheet mentions this as a single-source use case).",
    steps: [
      "Only the black Debit or Credit Card button shows.",
      "Clicking it opens PayPal's guest card form: card number plus billing details, no PayPal account needed.",
      "The payment is still a PayPal payment (brand PAYPAL), not a NomuPay card payment.",
    ],
    options: {
      inlineFlow: ["PAYPAL"],
      fundingSources: ["CARD"],
      paypal: {
        intent: "capture",
        onCancelRedirect: true,
        sdkParams: { components: "buttons", "enable-funding": "card" },
      },
    },
  },
  {
    key: "paylater-us",
    group: "Funding sources",
    title: "Pay Later, US buyer (sheet example)",
    sheet: `${SHEET}#PayPalRestAPIintegrationsheet-Fundingsources`,
    sheetLabel: "Funding sources",
    currency: "USD",
    about: "The exact funding-sources example from the sheet. buyer-country US is for the test environment only.",
    steps: [
      "Only the Pay Later button shows (PayPal's BNPL; \"Pay in 4\" in the US).",
      "Shopper logs in and is offered instalments in the popup.",
      "buyer-country makes sandbox treat the shopper as US-based. In live, PayPal decides eligibility from the real buyer.",
    ],
    options: {
      inlineFlow: ["PAYPAL"],
      fundingSources: ["PAYLATER"],
      paypal: {
        intent: "capture",
        onCancelRedirect: true,
        sdkParams: {
          components: "buttons",
          "buyer-country": "US",
          "enable-funding": "paylater,paypal,credit",
          "disable-funding": "card",
        },
      },
    },
  },
  {
    key: "paylater-gb",
    group: "Funding sources",
    title: "Pay in 3, UK buyer",
    sheet: `${SHEET}#PayPalRestAPIintegrationsheet-BuyNowPayLater`,
    sheetLabel: "Buy Now Pay Later",
    currency: "GBP",
    about: "Same idea for a UK shopper in GBP (the sheet notes BNPL has different names by region: Pay in 3, Pay in 4, Pay Later).",
    steps: [
      "Only the Pay Later button shows; in the UK the offer is \"Pay in 3\".",
      "buyer-country GB is for the test environment only.",
    ],
    options: {
      inlineFlow: ["PAYPAL"],
      fundingSources: ["PAYLATER"],
      paypal: {
        intent: "capture",
        onCancelRedirect: true,
        sdkParams: {
          components: "buttons,messages",
          "buyer-country": "GB",
          "enable-funding": "paylater",
          "disable-funding": "card",
        },
      },
    },
  },
  {
    key: "venmo-us",
    group: "Funding sources",
    title: "Venmo (US only, mobile)",
    sheet: `${SHEET}#PayPalRestAPIintegrationsheet-Venmo(USonly)`,
    sheetLabel: "Venmo (US only)",
    currency: "USD",
    about: "From the sheet's Venmo sample. Venmo is a mobile experience: open this on iOS Safari or Android Chrome.",
    steps: [
      "On a phone, a Venmo button shows; it switches to the Venmo app.",
      "On a desktop browser no button shows, and the event log reports: \"Although wpwlOptions.fundingSources is provided, no button could be rendered\". That's expected: the buyer isn't eligible on desktop.",
    ],
    options: {
      inlineFlow: ["PAYPAL"],
      fundingSources: ["VENMO"],
      paypal: {
        intent: "capture",
        onCancelRedirect: true,
        sdkParams: {
          components: "buttons,messages",
          "enable-funding": "venmo",
          "disable-funding": "card,paylater",
          "buyer-country": "US",
        },
      },
    },
  },
  {
    key: "ideal-nl",
    group: "Funding sources",
    title: "iDEAL (Netherlands, EUR) - sheet sample fails",
    sheet: `${SHEET}#PayPalRestAPIintegrationsheet-iDEAL(NLonly)`,
    sheetLabel: "iDEAL (NL only)",
    currency: "EUR",
    about: "The sheet's iDEAL sample, in EUR (buyer-country NL added for sandbox). Tested 9 Nov 2026: the widget rejects it.",
    steps: [
      "Per the sheet, an iDEAL button should show instead of the PayPal button.",
      "What actually happens: no button, and the event log shows \"Element 'IDEAL' in wpwlOptions.fundingSources is not valid\". The widget no longer accepts IDEAL as a funding source, so this part of the sheet looks out of date. Worth checking with ACI before offering iDEAL through PayPal.",
    ],
    options: {
      inlineFlow: ["PAYPAL"],
      fundingSources: ["IDEAL"],
      paypal: {
        intent: "capture",
        onCancelRedirect: true,
        sdkParams: {
          components: "buttons,messages,funding-eligibility",
          "enable-funding": "ideal",
          "disable-funding": "card,paylater,sofort",
          "buyer-country": "NL",
        },
      },
    },
  },

  // ---------- Popup events ----------
  {
    key: "close-notification",
    group: "When the shopper closes the popup",
    title: "Get notified (onError, event \"closed\")",
    sheet: `${SHEET}#PayPalRestAPIintegrationsheet-Notificationtomerchantwhenshopperclosesthepopup`,
    sheetLabel: "Notification to merchant when shopper closes the popup",
    currency: "USD",
    about: "No onCancelRedirect, so closing the popup leaves the shopper on the page and the widget calls onError.",
    steps: [
      "Click PayPal, then close the popup without logging in.",
      "The event log below shows a WidgetError with brand PAYPAL, event \"closed\" and PayPal's data, including the order ID.",
      "The payment stays pending (000.200.000) and times out on its own.",
    ],
    options: {
      inlineFlow: ["PAYPAL"],
      paypal: { intent: "capture" },
    },
  },
  {
    key: "cancel-redirect",
    group: "When the shopper closes the popup",
    title: "Mark as cancelled (onCancelRedirect)",
    sheet: `${SHEET}#PayPalRestAPIintegrationsheet-SmartButtonsintegrationspecifics`,
    sheetLabel: "Smart Buttons integration specifics (onCancelRedirect)",
    currency: "USD",
    about: "paypal.onCancelRedirect true: closing the popup cancels the payment instead of leaving it pending.",
    steps: [
      "Click PayPal, then close the popup.",
      "The payment is marked cancelled by the shopper (100.396.101) and the shopper goes to the result page.",
    ],
    options: {
      inlineFlow: ["PAYPAL"],
      paypal: { intent: "capture", onCancelRedirect: true },
    },
  },
];

function getPayPalExample(key) {
  return PAYPAL_EXAMPLES.find((example) => example.key === key) || PAYPAL_EXAMPLES[0];
}

module.exports = { PAYPAL_EXAMPLES, getPayPalExample };
