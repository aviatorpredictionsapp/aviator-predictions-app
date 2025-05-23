var axios = require("axios");
var crypto = require("crypto");

function generateUUID() {
  // Alternative UUID v4 generator that avoids bitwise operators
  function randomHexDigit() {
    return crypto.randomBytes(1).toString("hex")[0];
  }

  function variantHexDigit() {
    var digit = parseInt(crypto.randomBytes(1).toString("hex")[0], 16);
    return ((digit % 4) + 8).toString(16); // Ensures 8, 9, A, or B
  }

  return (
    randomHexDigit() + randomHexDigit() + randomHexDigit() + randomHexDigit() +
    randomHexDigit() + randomHexDigit() + "-" +
    randomHexDigit() + randomHexDigit() + "-" +
    "4" + randomHexDigit() + randomHexDigit() + "-" +
    variantHexDigit() + randomHexDigit() + randomHexDigit() + "-" +
    randomHexDigit() + randomHexDigit() + randomHexDigit() + randomHexDigit() +
    randomHexDigit() + randomHexDigit()
  );
}

function PaymentService() {}

PaymentService.prototype.initiatePayment = function(paymentData) {
  var email = paymentData.email;
  var amount = paymentData.amount || 99.0;
  var currency = paymentData.currency || "KES";

  var consumerKey = Backendless.ServerCode.getEnv('PESAPAL_CONSUMER_KEY');
  var consumerSecret = Backendless.ServerCode.getEnv('PESAPAL_CONSUMER_SECRET');

  var auth = new Buffer(consumerKey + ":" + consumerSecret).toString("base64");

  return axios.post(
    "https://pay.pesapal.com/v3/api/Auth/RequestToken",
    {},
    {
      headers: {
        Authorization: "Basic " + auth,
        "Content-Type": "application/json"
      }
    }
  ).then(function(tokenResponse) {
    var token = tokenResponse.data.token;

    var order = {
      id: generateUUID(),
      currency: currency,
      amount: amount,
      description: "Aviator Prediction Access",
      callback_url:
        "https://A96DEF93-54F5-4E85-BB46-E62D863FB561.backendless.app/api/services/PaymentService/verifyPayment",
      cancellation_url: "https://google.com",
      billing_address: {
        email: email,
        phone_number: "",
        country_code: "",
        first_name: "",
        middle_name: "",
        last_name: "",
        line_1: "",
        city: "",
        state: "",
        postal_code: "",
        zip_code: ""
      }
    };

    return axios.post(
      "https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest",
      order,
      {
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json"
        }
      }
    );
  }).then(function(orderResponse) {
    return {
      redirect_url: orderResponse.data.redirect_url,
      order_tracking_id: orderResponse.data.order_tracking_id
    };
  }).catch(function(error) {
    Backendless.Logging.log("Payment error: " + (error.response ? JSON.stringify(error.response.data) : error.message));
    throw new Error("Failed to initiate payment.");
  });
};

PaymentService.prototype.verifyPayment = function(query) {
  var order_tracking_id = query.order_tracking_id;

  var consumerKey = Backendless.ServerCode.getEnv('PESAPAL_CONSUMER_KEY');
  var consumerSecret = Backendless.ServerCode.getEnv('PESAPAL_CONSUMER_SECRET');

  var auth = new Buffer(consumerKey + ":" + consumerSecret).toString("base64");

  return axios.post(
    "https://pay.pesapal.com/v3/api/Auth/RequestToken",
    {},
    {
      headers: {
        Authorization: "Basic " + auth,
        "Content-Type": "application/json"
      }
    }
  ).then(function(tokenResponse) {
    var token = tokenResponse.data.token;

    return axios.get(
      "https://pay.pesapal.com/v3/api/Transactions/GetTransactionStatus?orderTrackingId=" + order_tracking_id,
      {
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json"
        }
      }
    );
  }).then(function(statusResponse) {
    var status = statusResponse.data.payment_status;

    if (status === "COMPLETED") {
      return { success: true, message: "Payment successful." };
    } else {
      return { success: false, message: "Payment not completed." };
    }
  }).catch(function(error) {
    Backendless.Logging.log("Verification error: " + (error.response ? JSON.stringify(error.response.data) : error.message));
    throw new Error("Payment verification failed.");
  });
};

module.exports = PaymentService;