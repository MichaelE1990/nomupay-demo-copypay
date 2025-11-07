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
	onReady: function(){ 
		$(".wpwl-group-cardNumber").after($(".wpwl-group-brand").detach());
		$(".wpwl-group-cvv").after( $(".wpwl-group-cardHolder").detach());
		var visa = $(".wpwl-brand:first").clone().removeAttr("class").attr("class", "wpwl-brand-card wpwl-brand-custom wpwl-brand-VISA")
		var master = $(visa).clone().removeClass("wpwl-brand-VISA").addClass("wpwl-brand-MASTER");
		$(".wpwl-brand:first").after( $(master)).after( $(visa));
		var imageUrl = "https://eu-test.oppwa.com/v1/static/" + wpwl.cacheVersion + "/img/brand.png";
		$(".wpwl-brand-custom").css("background-image", "url(" + imageUrl + ")");
	},
googlePay: {
  merchantId: "BCR2DN4TTWM4FDYB", // production Google Merchant ID here
  gatewayMerchantId: "8ac7a4c781a732090181aaf9f6fc15d4",
  gateway: "aciworldwide",
  allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
  merchantName: "Nomupay Demo",
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
    defaultSelectedOptionId: "shipping-001",
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
    { label: "Subtotal", type: "SUBTOTAL", price: (subTotalAmount / 100).toFixed(2) },
    { label: "Tax", type: "TAX", price: (taxAmount / 100).toFixed(2) }
  ],

  onPaymentDataChanged: function (intermediatePaymentData) {
    return new Promise(function(resolve) {
      var paymentDataUpdate = {};

      // Handle shipping option changes
      if (intermediatePaymentData.callbackTrigger === 'SHIPPING_OPTION') {
        var selectedShippingOptionId = intermediatePaymentData.shippingOptionData.id;
        var shippingCost = 0;

        // Determine shipping cost based on selected option
        if (selectedShippingOptionId === 'shipping-001') {
          shippingCost = 0; // Free shipping
        } else if (selectedShippingOptionId === 'shipping-002') {
          shippingCost = 199; // £1.99 in pence
        } else if (selectedShippingOptionId === 'shipping-003') {
          shippingCost = 1000; // £10.00 in pence
        }

        // Calculate new total
        var newTotal = subTotalAmount + shippingCost + taxAmount;

        // Update transaction info with new total
        paymentDataUpdate.newTransactionInfo = {
          currencyCode: currency,
          totalPriceStatus: 'FINAL',
          totalPrice: (newTotal / 100).toFixed(2),
          displayItems: [
            { label: "Subtotal", type: "SUBTOTAL", price: (subTotalAmount / 100).toFixed(2) },
            { label: "Shipping", type: "LINE_ITEM", price: (shippingCost / 100).toFixed(2) },
            { label: "Tax", type: "TAX", price: (taxAmount / 100).toFixed(2) }
          ]
        };
      }

      resolve(paymentDataUpdate);
    });
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
