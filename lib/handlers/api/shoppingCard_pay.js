/*
* user_shoppingCard pay handler
*
*/

// Dependencies
const _data = require('../../data');
const stripe = require('../../stripe');
const util = require('util');
const debug = util.debuglog('handlers');
const isAuthenticated = require('./users').isAuthenticated;

// Define handler container
const controller = {};

// user_shoppingcard handler
controller.handler = function(data,callback){    
    if (['post','get'].indexOf(data.method) > -1){
        controller._user_shoppingCard_pay[data.method](data,callback);
    }else{
        callback(405);
    }
}

// Container for all the user_shoppingcard methods
controller._user_shoppingCard_pay = {};


// user_shoppingcard - post 
// Create the user shoppingCard payment intent
// Require header authentication token
// Required data : address
// Optional data: none
controller._user_shoppingCard_pay.post = function(data,callback){

    const deliveryAddess = typeof(data.payload.address) == "string" ? data.payload.address : undefined;

    debug("user_shoppingcard_pay.post.arguments",data);
    const cb = function(err,data){
        debug("user_shoppingcard_pay.post.outcome",{
            err:err,
            data:data,
        });
        callback(err,data);
    };

    // Lookup valid user from header token
    isAuthenticated(data,function(err,relData){
        if(err==200 && relData){            
            const userData = relData.user;
            var shoppingCard = typeof(userData.shoppingCard)=='object' && 
                                userData.shoppingCard instanceof Array &&
                                userData.shoppingCard.length>0 ? userData.shoppingCard : false;

            // Sum value of shoppingcard items        
            const amount = !shoppingCard?0:userData.shoppingCard.reduce(function (acum, value) {                
                return acum + value.price;
            },0);                                

            // Delivey Address 
            const deliveryAddr = {
                name: userData.name,
                address: {
                    line1: deliveryAddess || userData.address,
                },
            };
            // shopping has items and items amount greater than 0 
            if(shoppingCard && amount>0){
                const stripePaymentIntentData = {
                    amount: amount * 100,
                    currency: 'usd',
                    payment_method_types: ["card"],
                    description: "Pizza delivery payment - TEST",                    
                    shipping: deliveryAddr,
                    receipt_email: userData.email,         
                               
                };

                // Invoke stripe charge 
                stripe.paymentIntents.create(stripePaymentIntentData, function (httpCode, PaymentintentData) {
                    const debugColor = PaymentintentData.status == 200
                        ? '\x1b[32m%s\x1b[0m'
                        : '\x1b[31m%s\x1b[0m';

                    // When charges complete
                    if (PaymentintentData.status == 200) {
                        
                        PaymentintentData.shoppingCard = {
                            payment: stripePaymentIntentData,
                            user: {
                                name: userData.name,
                                email: userData.email,
                            },
                            items: userData.shoppingCard,
                        }
                        PaymentintentData.notification = {};
                        _data.create('paymentIntents', PaymentintentData.payload.id, PaymentintentData, function (err) {
                            if (!err) {

                                // PaymentIntent data to user data
                                userData.shoppingCard_currentPaymentIntent = {
                                    items: JSON.stringify(userData.shoppingCard),
                                    deliveryAddress: JSON.stringify(deliveryAddr),
                                    response: PaymentintentData.payload
                                };

                                // Store updated user data
                                _data.update('users', userData.email, userData, function (err, data) {
                                    if (!err) {
                                        // ALL OK
                                        cb(false, PaymentintentData.payload);
                                    } else {
                                        cb(500, { Error: "Could not update user with new payment intent" });
                                    }
                                });

                            } else {
                                cb(500, { Error: "Could not store new charge" });
                            }
                        });
                        ////

                        
                                                                
                    } else {
                        cb(500,{Error: "Could not create stripe payment Intent"});
                        console.log(httpCode,PaymentintentData);
                    }
                });
                
            }                
            else{
                cb(400,{Error:"Can not request payment intent of empty shoppingcard"});
            }
        }else{
            cb(err,relData);
        }
    });
        
    
}


// user_shoppingcard_pay - get
// Require header authentication token
// Required data : none || id
// Optional data: none
controller._user_shoppingCard_pay.get = function (data, callback) {
    // Check that the user_shoppingcard id is valid
    var id = data.queryStringObject.get("id");
    id = typeof (id) == 'string' && id.length > 0
        ? id : undefined;

    debug("user_shoppingcard_pay.get.arguments", {
        id: id,
    });
    const cb = function (err, data) {
        debug("user_shoppingcard_pay.get.outcome", {
            err: err,
            data: data,
        });
        callback(err, data);        
    };

    // Lookup valid user from header token
    isAuthenticated(data, function (err, relData) {
        if (err == 200 && relData) {
            if (id != undefined) {
                _data.read('paymentIntents', id, function (err,data) {
                    if (!err) {
                        cb(200, data);                        
                    } else {
                        cb(500, { Error: "Could not find specified paymentIntent" });
                    }
                });
        
            } else {
                cb(400, { Error: "Missing required parameters" });
            }
            
        } else {
            cb(err, relData);
        }
    });
}

module.exports = {
    handler : controller.handler,
};