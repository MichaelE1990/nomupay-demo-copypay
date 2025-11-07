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
      gatewayMerchantId: "8ac7a4c781a732090181aaf9f6fc15d4",
      merchantId: "BCR2DN4TTWM4FDYB",
      allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
      submitOnPaymentAuthorized: ["customer", "billing"],
      merchantName: "Nomupay Demo",
	  buttonColor: "white",
	  buttonType: "pay",
	  buttonSizeMode: "fill",
	  
	  
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
