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
    // Your entity ID provided by us
    gatewayMerchantId: "8ac7a4c781a732090181aaf9f6fc15d4",

    // Google merchant identifier
    merchantId: "BCR2DN4TTWM4FDYB",

    // Possible values: PAN_ONLY, CRYPTOGRAM_3DS
    allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],

    // Possible values: AMEX, DISCOVER, JCB, MASTERCARD, VISA
    allowedCardNetworks: ["AMEX", "DISCOVER", "JCB", "MASTERCARD", "VISA"],

    // Possible values: default, black, white
    buttonColor: "white",

    // Possible values: book, buy (default), checkout, donate, order, pay, plain, subscribe
    buttonType: "pay",

    // Possible values: static (default), fill
    buttonSizeMode: "fill",

    // The name shown in the payment sheet
    merchantName: "Nomupay",

    // The shipping address parameters
    shippingAddressParameters: {
        allowedCountryCodes: ["GB"],
        phoneNumberRequired: true
    },

    // If shoppers billing address is required
    billingAddressRequired: true,

    // The desired format for the billing address
    billingAddressParameters: { "format": "FULL", phoneNumberRequired: true },

    // The shipping option
    shippingOptionRequired: true,

    // The shipping option parameters configuration
    shippingOptionParameters: {
        defaultSelectedOptionId: "shipping-001",
        shippingOptions: [{
            id: "shipping-001",
            label: "Free: Standard shipping",
            description: "Free Shipping delivered in 5 business days."
        }, {
            id: "shipping-002",
            label: "£1.99: Standard shipping",
            description: "Standard shipping delivered in 3 business days."
        }, {
            id: "shipping-003",
            label: "£10.00: Express shipping",
            description: "Express shipping delivered in 1 business day."
        }]
    },

    displayItems: [{
        label: "Subtotal",
        type: "SUBTOTAL",
        price: "0.10"
    }, {
        label: "Tax",
        type: "TAX",
        price: "0.00"
    }],

    // Callback when payment data is changed
    onPaymentDataChanged: function (intermediatePaymentData) {
        return new Promise(function(resolve, reject) {
            resolve({});
        });
    },

    // Callback when a payment is authorized
    onPaymentAuthorized: function (paymentData) {
        return new Promise(function(resolve, reject) {
            resolve({ transactionState: "SUCCESS" });
        });
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
    onCancel: function() {
      console.log("onCancel");
    },
    onPaymentAuthorized: function(payment) {
      console.log("onPaymentAuthorized:", payment);
      return { transactionState: "SUCCESS" };
    }
  }
};
