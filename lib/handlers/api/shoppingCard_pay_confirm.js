/*
* user_shoppingCard pay_confirm handler
*
*/

// Dependencies
const _data = require('../../data');
const helpers = require('../../helpers');
const config = require('../../config');
const stripe = require('../../stripe');
const util = require('util');
const debug = util.debuglog('handlers');
const isAuthenticated = require('./users').isAuthenticated;

// Define handler container
const controller = {};

// user_shoppingcard handler
controller.handler = function(data,callback){    
    if (['post'].indexOf(data.method) > -1){
        controller._user_shoppingCard_pay_confirm[data.method](data,callback);
    }else{
        callback(405);
    }
}

// Container for all the user_shoppingcard methods
controller._user_shoppingCard_pay_confirm = {};


// user_shoppingcard - post 
// Create the user shoppingCard payment intent confirmation
// Require header authentication token
// Required data : id(payment intent), card, notify
// Optional data: none
controller._user_shoppingCard_pay_confirm.post = function(data,callback){
    const id = data.payload.id;
    const notify = typeof (data.payload.notify) == 'boolean' &&  data.payload.notify===false ? false : true;

    debug("user_shoppingcard_pay_confirm.post.arguments",data.payload);
    const cb = function(err,data){
        debug("user_shoppingcard_pay_confirm.post.outcome",{
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

            // shopping has items and items amount greater than 0 
            if(shoppingCard && amount>0){
                

                // generate single time use token from stripe
                //validate card object
                const card = typeof (data.card) == 'object' ? data.card : false;

                //stripe card data
                const stripeCardObj = {
                    number:     data.payload.card.cardnumber.replace(/ /g, ''),
                    exp_month:  parseInt(data.payload.card.expirationdate.substr(0, 2)),
                    exp_year:   parseInt(data.payload.card.expirationdate.substr(3, 2)),
                    cvc:        data.payload.card.securitycode
                }

                // get stored payment Intent
                _data.read('paymentIntents',id,function(err, paymentIntentData){
                    if(!err){
                        // generate stripe cardToken in order to confirm payment intent
                        stripe.paymentMethods.createCard(stripeCardObj, function (statusCode, cardData) {
                            if (statusCode == 200) {
                                const cardToken = data.payload.id;
                                const paymentIntentConfirmArgs = {
                                    id: id,
                                    payment_method: cardData.payload.id,
                                };
                                // Invoke stripe charge 
                                stripe.paymentIntents.confirm(paymentIntentConfirmArgs, function (httpCode, paymentintentConfirmResponse) {
                                    // When paymentIntentConfirm complete
                                    if (paymentintentConfirmResponse.status == 200) {

                                        paymentIntentData.confirmation = paymentintentConfirmResponse;
                                        paymentIntentData.notification = {};
                                        // Update Store stripe payment Intent data
                                        _data.update('paymentIntents', id, paymentIntentData, function (err) {
                                            if (!err) {
                                                // clear/empty shopping card
                                                userData.shoppingCard = [];
                                                userData.shoppingCard_currentPaymentIntent = {};
                                                //  add new  stripe.charge.id to user.paymentIntentConfirm[]
                                                userData.paymentIntentConfirm = typeof (userData.paymentIntentConfirm) == 'object' && userData.paymentIntentConfirm instanceof Array
                                                    ? userData.paymentIntentConfirm
                                                    : [];
                                                userData.paymentIntentConfirm.push(paymentintentConfirmResponse.payload.id);
                                                // Store updated user data
                                                _data.update('users', userData.email, userData, function (err, data) {
                                                    if (!err) {
                                                        const orderData = {
                                                            id: paymentIntentData.payload.id,
                                                            amount: paymentIntentData.payload.amount,
                                                            currency: paymentIntentData.payload.currency,
                                                            item: paymentIntentData.shoppingCard.items,
                                                            deliveryAddress: paymentIntentData.shoppingCard.payment.shipping.address,
                                                            emailSent: false
                                                        };

                                                        if (notify) {
                                                            //  trigger notification to email defined stripe.change.receipt_email
                                                            controller.notifyUserCharge({ id: paymentintentConfirmResponse.payload.id }, function (err, data) {
                                                                if (err != 200) {
                                                                    console.log("Error: Sending notification to charged user");
                                                                    cb(false, orderData);
                                                                } else {
                                                                    orderData, emailSent = true;
                                                                    cb(false, orderData);
                                                                }
                                                            });
                                                        } else {
                                                            cb(false, orderData);
                                                        }


                                                    } else {
                                                        cb(500, { Error: "Could not update user with new charge" });
                                                    }
                                                });
                                            } else {
                                                cb(500, { Error: "Could not store new charge" });
                                            }
                                        });


                                    } else {
                                        cb(500, { Error: "Could not create stripe payment Intent confirmation" });
                                        console.log(httpCode, paymentintentConfirmResponse)
                                    }

                                });


                            } else {
                                cb(500, { Error: "Could not create stripe card token in order to create payment Intent confirmation" });
                            }
                        });

                    }else{
                        cb(500, { Error: "Can not find payment intent" });
                    }
                })
                
            }else{
                cb(400,{Error:"Can not request payment intent of empty shoppingcard"});
            }
        }else{
            cb(err,relData);
        }
    });
        
}


// Forward charge Notification
// data: id, force

controller.notifyUserCharge = function (data, callback) {
    // get last charge idx
    const id = typeof (data.id) == 'string' && data.id.substr(0, 3) == "pi_" ? data.id : false;
    // when force true, notification will be sent even if it already have been sent
    const force = typeof (data.force) == 'boolean' ? data.force : false;

    if (id) {
        // read last stored charge
        _data.read('paymentIntents', id, function (err, paymentIntentData) {
            if (!err && paymentIntentData) {
                // check if notification was already send
                const alreadySent = typeof (paymentIntentData.notification) == 'object' &&
                    paymentIntentData.notification != null &&
                    typeof (paymentIntentData.notification.status) == 'number' &&
                    paymentIntentData.notification.status == 200;

                if (!alreadySent || force) {
                    // send mail gun
                    const description = paymentIntentData.payload.description;
                    const receipt_url = paymentIntentData.payload.receipt_url;
                    const emailData = {
                        to: paymentIntentData.payload.receipt_email,
                        subject: 'You have just been charged by PizzaDelivery',                       
                        html: "<html><body>" + (description ? '<p>' + description + '</p>' : '') +'<br>'+
                                paymentIntentData.payload.id+'<br>'+
                                '<a href="http://127.0.0.1/3000/shoppingCardPaymentConfirmation/?id=' +paymentIntentData.payload.id+'"' + '></body></html>',
                    };
                    helpers.sendMailGun(emailData, function (res) {
                        res.content = emailData;
                        paymentIntentData.notification = res;
                        // Store updated chargeData
                        _data.update('paymentIntents', paymentIntentData.payload.id, paymentIntentData, function (err) {
                            if (err) {
                                console.log("Could not update charge with notification data");
                            }
                        });

                        callback(res.status, res);
                    });
                } else {
                    callback("Error: Charge notification was already sent");
                }
            } else {
                callback("Error: Could not send email");
            }
        });
    } else {
        callback("Error: Missing required parameters");
    }
}


module.exports = {
    handler : controller.handler,
    notifyUserCharge: controller.notifyUserCharge
};