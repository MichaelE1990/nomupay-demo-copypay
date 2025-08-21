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
  style: "plain",
  labels: {
    submit: "Process Payment"
  },
  onReady: function () {
    var form = document.querySelector('form.wpwl-form-card');
    if (!form || form.querySelector('input[name="customer.email"]')) return;

    var label = document.createElement('div');
    label.className = 'wpwl-label wpwl-label-custom';
    label.textContent = 'Email';

    var wrap = document.createElement('div');
    wrap.className = 'wpwl-wrapper wpwl-wrapper-custom';

    var input = document.createElement('input');
    input.type = 'email';
    input.name = 'customer.email';
    input.className = 'wpwl-control';
    input.placeholder = 'Enter your email';
    input.required = true;
    input.autocomplete = 'email';

    wrap.appendChild(input);

    var submitBtn = form.querySelector('.wpwl-button');
    if (submitBtn && submitBtn.parentNode) {
      submitBtn.parentNode.insertBefore(label, submitBtn);
      submitBtn.parentNode.insertBefore(wrap, submitBtn);
    } else {
      form.appendChild(label);
      form.appendChild(wrap);
    }
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
