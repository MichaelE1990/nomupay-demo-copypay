var subTotalAmount = 7731;   // in minor currency units (e.g. cents)
var shippingAmount = 0;
var taxAmount = 1469;
var currency = "EUR";
var applePayTotalLabel = "COMPANY, INC.";

function getAmount() {
  return ((subTotalAmount + shippingAmount + taxAmount) / 100).toFixed(2);
}

function getTotal() {
  return {
    // Business name, appears on the payment sheet and card statement
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

var wpwlOptions = {
  style: "plain",
  labels: {
    submit: "Process Payment"
  },
  googlePay: {
    merchantId: "BCR2DN4TTWM4FDYB",
    allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
    allowedCardNetworks: ["AMEX", "DISCOVER", "JCB", "MASTERCARD", "VISA"],
    buttonColor: "white",
    buttonType: "pay",
    buttonSizeMode: "fill"
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
    countryCode: "US",
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
    supportedCountries: ["US"],
    requiredShippingContactFields: ["postalAddress", "email"],
    requiredBillingContactFields: ["postalAddress"],
    onCancel: function() {
      console.log("onCancel");
    },
    onPaymentMethodSelected: function(paymentMethod) {
      console.log("onPaymentMethodSelected:", paymentMethod.type);
      subTotalAmount = (["debit", "credit"].includes(paymentMethod.type)) ? 7731 : 7431;
      return {
        newTotal: getTotal(),
        newLineItems: getLineItems()
      };
    },
    onShippingContactSelected: function(shippingContact) {
      console.log("onShippingContactSelected:", shippingContact);
      taxAmount = (shippingContact.administrativeArea === "FL") ? 1269 : 1469;
      var update = {
        newTotal: getTotal(),
        newLineItems: getLineItems()
      };
      if (shippingContact.postalCode === "95014") {
        update.errors = [{
          code: "shippingContactInvalid",
          contactField: "postalCode",
          message: "ZIP Code is invalid"
        }];
      }
      return update;
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
      // Return SUCCESS or FAILURE
      return { transactionState: "SUCCESS" };
    }
  }
};
