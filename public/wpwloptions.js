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
  gatewayMerchantId: "8ac7a4c781a732090181aaf9f6fc15d4"
},
  applePay: {
    version: 3,
    checkAvailability: "applePayCapabilities",
    merchantIdentifier: "8ac9a4cd9662a1bc0196687d626128ad",
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
