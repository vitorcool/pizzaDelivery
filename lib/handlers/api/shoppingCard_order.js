/*
* user_shoppingCard handler
*
*/

// Dependencies
const _data = require('../../data');
const helpers = require('../../helpers');
const stripe = require('../../stripe');
const util = require('util');
const debug = util.debuglog('handlers');
const isAuthenticated = require('./users').isAuthenticated;

// Define handler container
const controller = {};

// user_shoppingcard handler
controller.handler = function(data,callback){    
    if (['post', 'get'].indexOf(data.method) > -1){
        controller._user_shoppingCard_order[data.method](data,callback);
    }else{
        callback(405);
    }
}

// Container for all the user_shoppingcard methods
controller._user_shoppingCard_order = {};


// user_shoppingcard - post 
// Create the user shoppingCard payment 
// Require header authentication token
// Required data : none
// Optional data: notify
controller._user_shoppingCard_order.post = function(data,callback){
    // Only notify user (email) if data.notify=true
    const notify = typeof(data.payload.notify) == 'boolean' ? data.payload.notify : false;

    debug("user_shoppingcard_order.post.arguments",{
        notify:notify
    });
    const cb = function(err,data){
        debug("user_shoppingcard_order.post.outcome",{
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
                if (acum.price)
                    acum = acum.price;
                return acum + value.price;
            });                                

            // shopping has items and items amount greater than 0 
            if(shoppingCard && amount>0){
                // create stripe.charge for shoppingcard total value                    
                // Arguments to stripe.charge
                const deliveryAddress = {
                    name: userData.name,
                    address: {
                        line1: userData.street,
                    },
                };
                const stripeChargeData = {
                    amount: amount * 100,
                    currency: 'usd',
                    description: "Pizza delivery payment - TEST",                    
                    source: "tok_visa", // "tok_mastercard"
                    shipping: deliveryAddress,
                    receipt_email: userData.email,
                    metadata: {
                        items: JSON.stringify(userData.shoppingCard),
                        deliveryAddress: JSON.stringify(deliveryAddress),
                    },
                };

                // Invoke stripe charge 
                stripe.charges.create(stripeChargeData, function (httpCode, chargeData) {
                    const debugColor = chargeData.status == 200
                        ? '\x1b[32m%s\x1b[0m'
                        : '\x1b[31m%s\x1b[0m';

                    // When charges complete
                    if (chargeData.status == 200) {
                        // Store stripe charge response
                        chargeData.notification={};
                        _data.create('charges', chargeData.payload.id, chargeData, function (err) {
                            if (!err) {
                                // clear shopping car
                                userData.shoppingCard = [];
                                //  add new  stripe.charge.id to user.charges[]
                                userData.charges = typeof(userData.charges) == 'object' && userData.charges instanceof Array
                                            ? userData.charges
                                            : [];
                                userData.charges.push(chargeData.payload.id);
                                // Store updated user data
                                _data.update('users',userData.email,userData,function(err,data){
                                    if(!err){
                                        const orderData = {
                                            id: chargeData.payload.id,
                                            amount: chargeData.payload.amount,
                                            currency: chargeData.payload.currency,
                                            item: helpers.parseJsonToObject(chargeData.payload.metadata.items),
                                            deliveryAddress: helpers.parseJsonToObject(chargeData.payload.metadata.deliveryAddress),
                                            emailSent: false
                                        };

                                        if( notify ){
                                            //  trigger notification to email defined stripe.change.receipt_email
                                            controller.notifyUserCharge({chargeId: chargeData.payload.id},function(err,data){
                                                if(err!=200){
                                                    console.log("Error: Sending notification to charged user");
                                                    cb(false,orderData);
                                                }else{
                                                    orderData,emailSent = true;
                                                    cb(false,orderData);
                                                }
                                            });
                                        } else{
                                            cb(false,orderData);
                                        }
                                        
                                        
                                    }else{
                                        cb(500,{Error:"Could not update user with new charge"});
                                    }
                                });                
                            } else {
                                cb(500,{Error: "Could not store new charge"});
                            }
                        });
                    } else {
                        cb(500,{Error: "Could not create charge"});
                    }
                });
                
            }                
            else{
                cb(400,{Error:"Can not request payment of empty shoppingcard"});
            }
        }else{
            cb(err,relData);
        }
    });
        
    
}

// user_shoppingcard - get
// Require header authentication token
// Required data : none || id
// Optional data: none
controller._user_shoppingCard_order.get = function(data,callback){
    // Check that the user_shoppingcard idx is valid
    var idx = parseInt(data.queryStringObject.get("idx"));
    idx = typeof(idx) == 'number' && idx>=0
        ? idx : undefined;
    
    debug("user_shoppingcard.get.arguments",{
        idx:idx,            
    });
    const cb = function(err,data){
        debug("user_shoppingcard.get.outcome",{
            err:err,
            data:data,
        });
        callback(err,data);
    };
        
    // Lookup valid user from header token
    isAuthenticated(data,function(err,relData){
        if(err==200 && relData){
            if(idx!=undefined){
                const item = typeof(relData.user.shoppingCard[idx]) == "object"
                    ? relData.user.shoppingCard[idx]
                    : false;

                if(item){
                    cb(200,item);
                }else{
                    cb(500,{Error:"Could not find specified shoppingcard item index"});
                }
            }else{
                const items = typeof(relData.user.shoppingCard) == "object" &&
                        relData.user.shoppingCard instanceof Array
                    ? relData.user.shoppingCard
                    : false;

                if (items) {
                    cb(200, items);
                } else {
                    cb(500, { Error:"Could not find user shoppingcard items"});
                }    
            }
        }else{
            cb(err,relData);
        }
    });
}

// Forward charge Notification
// data: chargeId, force

controller.notifyUserCharge = function (data, callback) {
    // get last charge idx
    const chargeId = typeof (data.chargeId) == 'string' && data.chargeId.substr(0, 3) == "ch_" ? data.chargeId : false;
    // when force true, notification will be sent even if it already have been sent
    const force = typeof(data.force) == 'boolean' ? data.force : false;

    if (chargeId) {
        // read last stored charge
        _data.read('charges', chargeId, function (err, chargeData) {
            if (!err && chargeData) {
                // check if notification was already send
                const alreadySent = typeof(chargeData.notification)=='object' &&
                                    chargeData.notification != null &&
                                    typeof(chargeData.notification.status) == 'number' &&
                                    chargeData.notification.status==200;

                if(!alreadySent || force){
                    // send mail gun
                    const description = chargeData.payload.description;
                    const receipt_url = chargeData.payload.receipt_url;
                    const emailData = {
                        to: chargeData.payload.receipt_email,
                        subject: 'You have just been chaged by PizzaDelivery receipt',
                        text: description,
                        html: `<html><body>${description ? '<p>' + description + '</p>' : ''}<a href="${receipt_url}"></body></html>`,
                    };                 
                    helpers.sendMailGun(emailData, function (res) {
                        res.content = emailData;
                        chargeData.notification = res;
                        // Store updated chargeData
                        _data.update('charges',chargeData.payload.id,chargeData,function(err){
                            if(err){
                                console.log("Could not update charge with notification data");
                            }
                        });
                        
                        callback(res.status, res);                        
                    });
                }else{
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