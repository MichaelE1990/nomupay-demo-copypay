// amounts in minor units (pence)
var subTotalAmount = 10;  // £0.10
var shippingAmount = 0;
var taxAmount = 0;
var currency = "GBP";
var applePayTotalLabel = "Nomupay";

function getAmount() {
  return ((subTotalAmount + shippingAmount + taxAmount) / 100).toFixed(2);
}
function getTotal() {
  return { label: applePayTotalLabel, amount: getAmount() };
}
function getLineItems() {
  return [
    { label: "Subtotal", amount: (subTotalAmount / 100).toFixed(2) },
    { label: "Shipping", amount: (shippingAmount / 100).toFixed(2) },
    { label: "Tax", amount: (taxAmount / 100).toFixed(2) }
  ];
}
var wpwlOptions = {
  style: "card",
  labels: {
    submit: "Process Payment"
  },
onReady: function () {
      var emailFieldHtml =
        '<div class="wpwl-label wpwl-label-custom">Email</div>' +
        '<div class="wpwl-wrapper wpwl-wrapper-custom">' +
          '<input type="email" name="customer.email" class="wpwl-control" ' +
          'placeholder="Enter your email" required autocomplete="email" />' +
        '</div>';

      // Insert into the card form before the submit button
      $('form.wpwl-form-card').find('.wpwl-button').before(emailFieldHtml);
    },
googlePay: {
  merchantId: "xxx", // production Google Merchant ID here
  gatewayMerchantId: "xxx", // production channel entity ID here
  gateway: "aciworldwide",
  allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
  merchantName: "Store Name here",
  allowedCardNetworks: ["AMEX", "DISCOVER", "JCB", "MASTERCARD", "VISA"],
  buttonColor: "black",
  buttonType: "pay",

  // UK-only shipping
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
    defaultSelectedOptionId: "shipping-002",
    shippingOptions: [
      {
        id: "shipping-001",
        label: "Free: Standard shipping",
        description: "Free shipping delivered in 5 business days."
      },
      {
        id: "shipping-002",
        label: "£1.99: Standard shipping",
        description: "Standard shipping delivered in 3 business days."
      },
      {
        id: "shipping-003",
        label: "£10.00: Express shipping",
        description: "Express shipping delivered in 1 business day."
      }
    ]
  },

  displayItems: [
    { label: "Subtotal", type: "SUBTOTAL", price: "11.00" },
    { label: "Tax", type: "TAX", price: "1.00" },
    { label: "VAT", type: "TAX", price: "1.00" } // swapped GST → VAT for UK
  ],

  onPaymentDataChanged: function (intermediatePaymentData) {
    return Promise.resolve({});
  },

  // No card brand restriction, always succeed for now
  onPaymentAuthorized: function (paymentData) {
    console.log("onPaymentAuthorized:", paymentData);
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
    supportedNetworks: ["amex", "discover", "masterCard", "visa"],
    lineItems: getLineItems(),
    shippingMethods: [
      {
        label: "Free Shipping",
        amount: "0.00",
        identifier: "free",
        detail: "Delivers in five business days"
      },
      {
        label: "Express Shipping",
        amount: "5.00",
        identifier: "express",
        detail: "Delivers in two business days"
      }
    ],
    shippingType: "shipping",
    supportedCountries: ["GB"],
    requiredShippingContactFields: ["postalAddress", "email"],
    requiredBillingContactFields: ["postalAddress"],
    submitOnPaymentAuthorized: ["customer", "billing"],
    onCancel: function() {
      console.log("onCancel");
    },
    onShippingMethodSelected: function(shippingMethod) {
      console.log("onShippingMethodSelected:", shippingMethod);
      shippingAmount = (shippingMethod.identifier === "free") ? 0 : 500;
      return {
        newTotal: getTotal(),
        newLineItems: getLineItems()
      };
    },
    onPaymentAuthorized: function(payment) {
      console.log("onPaymentAuthorized:", payment);
      return { transactionState: "SUCCESS" };
    }
  }
};
