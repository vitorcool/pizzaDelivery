/*
*
* Handle Stripe API
*/


// Dependencies
const https = require('https');
const querystring = require('querystring');
const helpers = require('./helpers');
const config = require('./config');
const util = require('util');
const debug = util.debuglog('stripe');

// Stripe main container
const stripe = {};
stripe._DEFS = {
    protocol: 'https:',
    path: '/v1/',    
    hostname: 'api.stripe.com',    
    headers:{
        'Authorization': 'Bearer ' + config.stripe_api_key,
    }
}


stripe.post = function( relPath, data, callback){
    relPath = typeof(string) ? relPath : false;
    data = typeof(data) == 'object' ? data : false;
    callback = typeof(callback) == 'function' ? callback : false;


    if(!relPath || !data || !callback){
        throw new Error("Missing required parameters");
    }


    // encode payload acording to Content-Type: application/x-www-form-urlencoded
    var stringPayload = helpers.parseJsonToQueryString(data);
    debug("stringPayLoad", stringPayload);
    var requestDetails = {
        'protocol': stripe._DEFS.protocol,
        'hostname': stripe._DEFS.hostname,
        'path': stripe._DEFS.path + relPath,
        'method': 'POST',
        'headers': Object.assign(stripe._DEFS.headers, {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(stringPayload),
        })
    }

    var body = "";
    var req = https.request(requestDetails, function (res) {
        // return 
        res.on('data', function (chunk) {
            body += chunk;
        });
        res.on('end', function () {
            const _req = {
                'api.stripe.create': data,
            };
            const _res = {
                status: res.statusCode,
                header: res.headers,
                payload: helpers.parseJsonToObject(body),
            };
            if(_res.status!=200 && _res.payload.error){
                console.log("Error",_res.payload.error);
            }
            debug('request', _req);
            debug('response', _res);
            callback(res.statusCode, _res);
        });

        // grab the status of the sent response        
    });

    // Bind error event so it doesn't get thrown
    req.on('error', function (e) {
        callback(e);
    });

    req.write(stringPayload);
    // End the request
    req.end();
}


// Scripe Charges handlers
stripe._charges = {};

// Charge post (CREATE)
// method: POST
// path: /v1/charges
// Required data: any
//
stripe._charges.create=function(data,callback){
    stripe.post("charges", data, callback);
}

// Scripe payment Intents handlers
stripe._paymentIntents = {};

// Create PaymentIntent post (CREATE)
// method: POST
// path: /v1/payment_intents
// Required data: any
//
stripe._paymentIntents.create = function (data, callback) {
    stripe.post("payment_intents",data,callback);
}


// Confirm PaymentIntent post (CREATE)
// method: POST
// path: /v1/payment_intents{id}/confirm
// Required data: clientSecret, card(name,cardnumber,expirationdate,securitycode)
//
/*
curl https://api.stripe.com/v1/payment_intents/pi_1IFmSsCNn1q1Zb71qxo3yV56/confirm \
  -u sk_test_51IFmF7CNn1q1Zb719gcEjjPFe49n8fvl90N7otdaUtxVrWPhqpVVEkotnLwSqGjB2PekQhUcq0MfhBXdVGCyaUQt002JHyHLLQ: \
  -d payment_method=pm_card_visa
*/
stripe._paymentIntents.confirm = function (data, callback) {
            
    // confirm payment intent with card (sure)
    stripe.post("payment_intents/" + data.id + "/confirm", {
        payment_method: data.payment_method
    }, callback);

}


// Scripe payment method handlers
stripe._paymentMethods = {};

// Create card PaymentMethod post (CREATE)
// method: POST
// path: /v1/payment_methods
// Required data: any
/*


curl https://api.stripe.com/v1/payment_methods \
  -u sk_test_51IFmF7CNn1q1Zb719gcEjjPFe49n8fvl90N7otdaUtxVrWPhqpVVEkotnLwSqGjB2PekQhUcq0MfhBXdVGCyaUQt002JHyHLLQ: \
  -d type=card \
  -d "card[number]"=4242424242424242 \
  -d "card[exp_month]"=2 \
  -d "card[exp_year]"=2022 \
  -d "card[cvc]"=314
*/
stripe._paymentMethods.createCard = function(data, callback){    
    data.number = typeof(data.number) == 'string' && data.number.length>0 ? data.number : false;
    data.exp_month = typeof (data.exp_month) == 'number' && data.exp_month >=1 && data.exp_month<=12? data.exp_month : false;
    data.exp_year = typeof (data.exp_year) == 'number' && data.exp_year >= 0 && data.exp_year <=99 ? data.exp_year : false;
    data.cvc = typeof (string) && data.cvc.length >= 3 ? data.cvc : false;
    data={
        number: data.number,
        exp_month: data.exp_month,
        exp_year: data.exp_year,
        cvc: data.cvc,
    };
    

    stripe.post("payment_methods",{type:'card',card:data},callback)
}

// Export
module.exports = {
    charges: stripe._charges,
    paymentIntents: stripe._paymentIntents,    
    paymentMethods: stripe._paymentMethods,
}