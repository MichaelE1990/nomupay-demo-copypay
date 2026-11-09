// PayPal Smart Buttons, DB (PayPal Rest API integration sheet, "Minimal OPP request (DB)", step 2)
var wpwlOptions = {
  // onError goes in the global wpwlOptions (sheet: "Error handling in CnP widget")
  onError: function (error) {
    console.log("PayPal widget onError:", JSON.stringify(error));
  },
  inlineFlow: ["PAYPAL"],
  paypal: {
    intent: "capture",
    // Marks the payment as cancelled by the shopper (100.396.101) when they close the popup
    onCancelRedirect: true
  }
};
