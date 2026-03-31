// amounts in minor units (pence)
var subTotalAmount = 10; // £0.10
var shippingAmount = 0;
var taxAmount = 0;
var currency = "GBP";
var applePayTotalLabel = "Nomupay";

function getAmount() {
  return ((subTotalAmount + shippingAmount + taxAmount) / 100).toFixed(2);
}

function getTotal() {
  return {
    label: applePayTotalLabel,
    amount: getAmount()
  };
}

function getLineItems() {
  return [
    { label: "Subtotal", amount: (subTotalAmount / 100).toFixed(2) },
    { label: "Shipping", amount: (shippingAmount / 100).toFixed(2) },
    { label: "Tax", amount: (taxAmount / 100).toFixed(2) }
  ];
}

function getLineItemsNoShipping() {
  return [
    { label: "Subtotal", amount: (subTotalAmount / 100).toFixed(2) },
    { label: "Tax", amount: (taxAmount / 100).toFixed(2) }
  ];
}

var wpwlOptions = {
  style: "plain",
  labels: {
    submit: "Process Payment"
  },
  inlineFlow: ["KLARNA_PAYMENTS_ONE"],

  onReady: function(){
    // ── Card brand reordering (existing) ──────────────────────────────────
    $(".wpwl-group-cardNumber").after($(".wpwl-group-brand").detach());
    $(".wpwl-group-cvv").after($(".wpwl-group-cardHolder").detach());
    var visa = $(".wpwl-brand:first").clone().removeAttr("class").attr("class", "wpwl-brand-card wpwl-brand-custom wpwl-brand-VISA");
    var master = $(visa).clone().removeClass("wpwl-brand-VISA").addClass("wpwl-brand-MASTER");
    $(".wpwl-brand:first").after($(master)).after($(visa));
    var imageUrl = "https://eu-test.oppwa.com/v1/static/" + wpwl.cacheVersion + "/img/brand.png";
    $(".wpwl-brand-custom").css("background-image", "url(" + imageUrl + ")");

    // ── Klarna UI enhancements ─────────────────────────────────────────────
    var $klarnaContainer = $(".wpwl-container-virtualAccountKLARNA_PAYMENTS_ONE");
    if ($klarnaContainer.length) {

      // 1. Divider above the Klarna card
      $klarnaContainer.before(
        '<div class="klarna-divider">or pay with Klarna</div>'
      );

      // 2. Header row inside the card: tagline + "0% interest" badge
      $klarnaContainer.prepend(
        '<div class="klarna-header">' +
          '<span class="klarna-tagline">Buy now, pay later</span>' +
          '<span class="klarna-badge">0% interest</span>' +
        '</div>'
      );

      // 3. Info footer below the button
      $klarnaContainer.append(
        '<div class="klarna-footer">' +
          '<svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<circle cx="6.5" cy="6.5" r="6" stroke="#d1d5db"/>' +
            '<path d="M6.5 6v3.5M6.5 3.5V5" stroke="#d1d5db" stroke-width="1.2" stroke-linecap="round"/>' +
          '</svg>' +
          'Split into 3 interest-free payments. No hidden fees. Managed by Klarna.' +
        '</div>'
      );
    }
  },

  googlePay: {
    merchantId: "BCR2DN4TTWM4FDYB",
    gatewayMerchantId: "8ac7a4c781a732090181aaf9f6fc15d4",
    gateway: "aciworldwide",
    allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
    merchantName: "Nomupay Demo",
    allowedCardNetworks: ["AMEX", "DISCOVER", "JCB", "MASTERCARD", "VISA"],
    buttonColor: "black",
    buttonType: "pay",
    shippingAddressParameters: {
      allowedCountryCodes: ["GB"],
      phoneNumberRequired: true
    },
    billingAddressRequired: true,
    billingAddressParameters: {
      format: "FULL",
      phoneNumberRequired: true
    },
    shippingOptionRequired: true,
    shippingOptionParameters: {
      defaultSelectedOptionId: "shipping-001",
      shippingOptions: [
        { id: "shipping-001", label: "Free: Standard shipping", description: "Free shipping delivered in 5 business days." },
        { id: "shipping-002", label: "£1.99: Standard shipping", description: "Standard shipping delivered in 3 business days." },
        { id: "shipping-003", label: "£10.00: Express shipping", description: "Express shipping delivered in 1 business day." }
      ]
    },
    displayItems: [
      { label: "Subtotal", type: "SUBTOTAL", price: (subTotalAmount / 100).toFixed(2) },
      { label: "Tax", type: "TAX", price: (taxAmount / 100).toFixed(2) }
    ],
    onPaymentDataChanged: function (intermediatePaymentData) {
      return new Promise(function(resolve) {
        var paymentDataRequestUpdate = {};
        if (intermediatePaymentData.callbackTrigger === 'SHIPPING_OPTION') {
          var shippingOptionData = intermediatePaymentData.shippingOptionData;
          var selectedShippingOptionId = shippingOptionData.id;
          var shippingCost = 0;
          if (selectedShippingOptionId === 'shipping-001') { shippingCost = 0; }
          else if (selectedShippingOptionId === 'shipping-002') { shippingCost = 199; }
          else if (selectedShippingOptionId === 'shipping-003') { shippingCost = 1000; }
          window.selectedShippingCost = shippingCost;
          var newTotal = subTotalAmount + shippingCost + taxAmount;
          paymentDataRequestUpdate = {
            newShippingOptionParameters: {
              defaultSelectedOptionId: selectedShippingOptionId,
              shippingOptions: [
                { id: "shipping-001", label: "Free: Standard shipping", description: "Free shipping delivered in 5 business days." },
                { id: "shipping-002", label: "£1.99: Standard shipping", description: "Standard shipping delivered in 3 business days." },
                { id: "shipping-003", label: "£10.00: Express shipping", description: "Express shipping delivered in 1 business day." }
              ]
            },
            newTransactionInfo: {
              currencyCode: currency,
              totalPriceStatus: 'FINAL',
              totalPrice: (newTotal / 100).toFixed(2),
              displayItems: [
                { label: "Subtotal", type: "SUBTOTAL", price: (subTotalAmount / 100).toFixed(2) },
                { label: "Shipping", type: "LINE_ITEM", price: (shippingCost / 100).toFixed(2) },
                { label: "Tax", type: "TAX", price: (taxAmount / 100).toFixed(2) }
              ]
            }
          };
        }
        resolve(paymentDataRequestUpdate);
      });
    },
    onBeforeSubmit: function() {
      var finalShippingCost = window.selectedShippingCost || 0;
      var finalTotal = subTotalAmount + finalShippingCost + taxAmount;
      console.log("Final Google Pay amount:", {
        subtotal: subTotalAmount,
        shipping: finalShippingCost,
        tax: taxAmount,
        total: finalTotal,
        totalInGBP: (finalTotal / 100).toFixed(2)
      });
      return true;
    },
    onPaymentAuthorized: function (paymentData) {
      console.log("onPaymentAuthorized - Full payment data:", paymentData);
      if (paymentData.transactionInfo) {
        console.log("Transaction amount authorized:", paymentData.transactionInfo.totalPrice);
      }
      return Promise.resolve({ transactionState: "SUCCESS" });
    }
  },

  applePay: {
    version: 3,
    checkAvailability: "applePayCapabilities",
    merchantIdentifier: "8ac7a4c781a732090181aaf9f6fc15d4",
    buttonSource: "js",
    buttonStyle: "white-outline",
    buttonType: "buy",
    displayName: "MyStore",
    domainName: "nomupay-demo-copypay.vercel.app",
    total: getTotal(),
    currencyCode: currency,
    countryCode: "GB",
    merchantCapabilities: ["supports3DS"],
    supportedNetworks: ["discover", "masterCard", "visa"],
    lineItems: getLineItemsNoShipping(),
    supportedCountries: ["GB"],
    requiredBillingContactFields: [],
    submitOnPaymentAuthorized: ["customer", "billing"],
    onCancel: function() { console.log("onCancel"); },
    onPaymentAuthorized: function(payment) {
      console.log("onPaymentAuthorized:", payment);
      return { transactionState: "SUCCESS" };
    }
  }
};
