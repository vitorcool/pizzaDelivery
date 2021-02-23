/*
* template <issue> handler
*
*/

// Dependencies
const helpers = require('../../helpers');
const data = require('../../data');
const util = require('util');
const _data = require('../../data');
const debug = util.debuglog('handlers');

// Define <issue> handler container
const shoppingCardPaymentConfirmation = {};

// http handler for <issue>
shoppingCardPaymentConfirmation.handler = function (data, callback) {
    // Reject all request that isn't a GET
    if (data.method == 'get') {
        // prepare data for interpolation

        _data.read('paymentIntents', (data.queryStringObject || {}).get("id") ,function(err,data){
            if(err){
                callback(500,undefined,'html');
                return;
            }

            var templateData = {
                head: {
                    title: 'Pizza Payment Confirmation',
                    description: 'Add your credit or debit card to complete the pizza flow',
                },
                user: {                
                    name: data.shoppingCard.user.name,                                        
                    email: data.shoppingCard.user.email,
                }
            };

            // Read in a template as a string
            helpers.getLaidOutTemplate('pay/shoppingcard', templateData, function (err, strHtml) {
                if (!err && strHtml) {
                    if (!err && strHtml) {
                        callback(200, strHtml, 'html');
                    } else {                    
                        callback(500, undefined, 'html');
                    }                
                } else {                
                    callback(500, undefined, 'html');
                }
            },'pay/_layout');
        });
    } else {
        callback(405, undefined, 'html');
    }
}



module.exports.handler = shoppingCardPaymentConfirmation.handler;