var wpwlOptions = {
  style: "plain",
  labels: {
    submit: "Process Payment"
  },
    googlePay: {
    gatewayMerchantId: "ChannelEntityID",
    gateway: "aciworldwide",
    merchantId: "GoogleMerchantAccountID",
    allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
    allowedCardNetworks: ["AMEX", "DISCOVER", "JCB", "MASTERCARD", "VISA"],
    buttonColor: "white",
    buttonType: "pay",
    buttonSizeMode: "fill",
    merchantName: "Example Merchant",
    shippingAddressParameters: {
      allowedCountryCodes: ["US", "IN"],
      phoneNumberRequired: true,
    },
    billingAddressRequired: true,
    billingAddressParameters: { format: "FULL", phoneNumberRequired: true },
    shippingOptionRequired: true,
    shippingOptionParameters: {
      defaultSelectedOptionId: "shipping-002",
      shippingOptions: [
        {
          id: "shipping-001",
          label: "Free: Standard shipping",
          description: "Free Shipping delivered in 5 business days.",
        },
        {
          id: "shipping-002",
          label: "$1.99: Standard shipping",
          description: "Standard shipping delivered in 3 business days.",
        },
        {
          id: "shipping-003",
          label: "$10.00: Express shipping",
          description: "Express shipping delivered in 1 business day.",
        },
      ],
    },
    displayItems: [
      {
        label: "Subtotal",
        type: "SUBTOTAL",
        price: "11.00",
      },
      {
        label: "Tax",
        type: "TAX",
        price: "1.00",
      },
      {
        label: "GST",
        type: "TAX",
        price: "1.00",
      },
    ],
    onPaymentDataChanged: function (intermediatePaymentData) {
      return new Promise(function (resolve, reject) {
        resolve({});
      });
    },
    onPaymentAuthorized: function (paymentData) {
      return new Promise(function (resolve, reject) {
        resolve({ transactionState: "SUCCESS" });
      });
    },
  },
  applePay: {
    version: 3,
    checkAvailability: "applePayCapabilities",
    merchantIdentifier: "nomupay-demo-copy-and-pay.vercel.app",
    buttonSource: "js",
    buttonStyle: "white-outline",
    buttonType: "buy",
    displayName: "MyStore",
    currencyCode: "EUR",
    countryCode: "US",
    merchantCapabilities: ["supports3DS"],
    supportedNetworks: ["amex", "discover", "masterCard", "visa"],
  }
};
