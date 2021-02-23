/*
*
*  CLI responders
*
*/

// Dependencies
const _data = require('../data');
const _display = require('./_display');
// Deps for start
const os = require("os");
const v8 = require("v8");


// Responders object
responders = {};


// Help responder
responders.help = function () {
debugger
    const _cli=this;
    var commandHelpObj = {};
    Object.keys(_cli.commands).forEach(function (commandName) {
        const commandObj = _cli.commands[commandName] || {};
        const nameWithSwitches = commandName + " " + (commandObj.switches || []).join(" ");
        commandHelpObj[nameWithSwitches] = commandObj.description || 'command without description';
    });

    _display.horizontalLine();
    _display.centered("CLI MANUAL");
    _display.horizontalLine();
    _display.verticalSpace(2);
    // show each command fallowed by its explanation, in white and yellow respectively
    Object.keys(commandHelpObj).forEach(function (command) {
        const explanation = commandHelpObj[command];
        var line = '\x1b[34m' + command + '\x1b[0m';
        const padding = 60 - line.length;
        for (i = 0; i < padding; i++) {
            line += ' ';
        }
        line += explanation;
        console.log(line);
        _display.verticalSpace();
    });
    _display.verticalSpace(1);
    // end with another horizontal line
    _display.horizontalLine();
}

// Stats
responders.stats = function () {
    // Compile and object of stats
    var stats = {
        'Load Average': os.loadavg().join(' '),
        'CPU Count': os.cpus().length,
        'Free Memory': os.freemem(),
        'Current Malloced Memory': v8.getHeapStatistics().malloced_memory,
        'Peak Malloced Memory': v8.getHeapStatistics().peak_malloced_memory,
        'Allocated Heap Used (%)': Math.round(v8.getHeapStatistics().used_heap_size / v8.getHeapStatistics().total_heap_size * 100),
        'Available Heap Allocated (%)': Math.round(v8.getHeapStatistics().total_heap_size / v8.getHeapStatistics().heap_size_limit * 100),
        'Uptime': os.uptime() + ' Seconds',
    };
    _display.horizontalLine();
    _display.centered("SYSTEM STATISTICS");
    _display.horizontalLine();
    _display.verticalSpace(2);
    // show each command fallowed by its explanation, in white and yellow respectively
    Object.keys(stats).forEach(function (key) {
        const value = stats[key];
        var line = '\x1b[34m' + key + '\x1b[0m';
        const padding = 60 - line.length;
        for (i = 0; i < padding; i++) {
            line += ' ';
        }
        line += value;
        console.log(line);
        _display.verticalSpace();
    });
    _display.verticalSpace(1);
    // end with another horizontal line
    _display.horizontalLine();
}
// List users
responders.listUsers = function (str) {
    var arr = str.split("--");
    const flag24h = typeof (arr[1]) == 'string' && arr[1].trim().length > 0 && arr[1] == '24h' ? arr[1].trim() : false;
    _data.list("users", function (err, usersIds) {
        if (!err && usersIds instanceof Array) {
            _display.verticalSpace();
            usersIds.forEach(function (userId) {
                _data.read("users", userId, function (err, userData) {
                    if (!err && userData) {

                        //filter --24h - last 24h created users
                        if (flag24h && userData.created > (Date.now() - 1000*60*60*24) || str.indexOf("--24h")==-1){
                            var line = _display.objectLine({
                                Name: userData.name,
                                Email: userData.email,
                                Created: (new Date(userData.created)).toISOString(),
                                Orders: ((userData.paymentIntentConfirm || []).length ? (userData.paymentIntentConfirm || []).length : 0),
                            });
                            console.log(line);
                            _display.verticalSpace();
                        }
                    }
                });
            });
        }
    });
}
// more use info
responders.moreUserInfo = function (str) {
    var arr = str.split("--");
    const userId = typeof (arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
    if (userId) {
        // Lookup the user
        _data.read("users", userId, function (err, userData) {
            if (!err && userData) {
                // Remove the hashed password
                delete userData.hashedPassword;

                // Print the JSON with text highlighing
                _display.verticalSpace();
                console.dir(userData, { colors: true });
                _display.verticalSpace();
            }else{
                console.log("Could not find specifyed user: "+userId);
            }
        });
    } else {
        console.log("missing userId to show more user info");
    }

}
// list menu
responders.listMenu = function (str) {

    _data.list("menuPizzas", function (err, menuNames) {
        if (!err && menuNames instanceof Array && menuNames.length > 0) {
            _display.verticalSpace();
            menuNames.forEach(function (name) {
                _data.read("menuPizzas", name, function (err, menuItem) {
                    if (!err && menuItem) {

                        var line = _display.objectLine({
                            Name:  menuItem.name ,
                            Price: menuItem.price + " " + menuItem.currency,
                        });
                        console.log(line);
                        _display.verticalSpace();

                    }
                });
            });
        }
    });
}
// mode order  info
responders.moreOrderInfo = function (str) {
    var arr = str.split("--");
    const OrderId = typeof (arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
    if (OrderId) {
        // Lookup the payment intents
        _data.read("paymentIntents", OrderId, function (err, orderData) {
            if (!err && orderData) {
                // Print the JSON with text highlighing
                _display.verticalSpace();
                console.dir(orderData, { colors: true });
                _display.verticalSpace();
            }
        });
    } else {
        console.log("missing checkId to show more check info");
    }
}
// list orders --24h
responders.listOrders = function(str) {
    var arr = str.split("--");
    const flag24h = typeof (arr[1]) == 'string' && arr[1].trim().length > 0 && arr[1] == '24h' ? arr[1].trim() : false;
    _data.list("paymentIntents", function (err, orders) {
        if (!err && orders instanceof Array && orders.length > 0) {
            _display.verticalSpace();
            orders.forEach(function (name) {
                _data.read("paymentIntents", name, function (err, paymentIntentData) {
                    if (!err && paymentIntentData) {

                        // Order is a completed payment intent
                        // Lets check if this payment intent is complete                        
                        const validOrder = typeof(paymentIntentData.status) == 'number' && paymentIntentData.status == 200 &&
                                typeof(paymentIntentData.payload) == 'object' &&
                                paymentIntentData.payload.object === 'payment_intent' &&                                
                                typeof(paymentIntentData.payload.id) == 'string' && 
                                typeof(paymentIntentData.payload.created) == 'number' &&

                                typeof (paymentIntentData.confirmation) == 'object' &&
                                typeof(paymentIntentData.confirmation.payload) == 'object' &&
                                paymentIntentData.confirmation.status === paymentIntentData.status &&
                                paymentIntentData.confirmation.payload.id === paymentIntentData.payload.id
                                ? paymentIntentData
                                :false;

                        //filter --24h - last 24h created users
                        const visible = (flag24h && paymentIntentData.payload.created*1000 > (Date.now() - 1000 * 60 * 60 * 24) || str.indexOf("--24h") == -1);
                        
                        if (validOrder && visible){
                            var line = _display.objectLine({
                                ID: paymentIntentData.payload.id,
                                Amount: paymentIntentData.payload.amount / 100 + " " + paymentIntentData.payload.currency,
                                Created: (new Date(paymentIntentData.payload.created*1000)).toISOString(),
                            });
                                
                            console.log(line);
                            _display.verticalSpace();
                        }

                    }
                });
            });
        }
    });
}

// export
module.exports = responders;
