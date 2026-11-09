// PayPal Smart Buttons, PA (PayPal Rest API integration sheet, "Minimal OPP request (PA)", step 2)
// No intent here: for paymentType=PA the widget sets intent=authorize
var wpwlOptions = {
  onError: function (error) {
    console.log("PayPal widget onError:", JSON.stringify(error));
  },
  inlineFlow: ["PAYPAL"],
  paypal: {
    onCancelRedirect: true
  }
};
