/*
* pizza handler
*
*/

// Dependencies
const helpers = require('../../helpers');
const _data = require('../../data');
const config = require('../../config');
const isAuthenticated = require('./users').isAuthenticated;

const util = require('util');

const debug = util.debuglog('handlers');

// Define handler container
const controller = {};

// Users handler
controller.handler = function(data,callback){
    var acceptableMethods= ['get'];
    if(acceptableMethods.indexOf(data.method) > -1){
        controller._pizzas[data.method](data,callback);
    }else{
        callback(405);
    }
}

controller.createStore = function(callback){
    // Available pizzas for this work
    const hardcodedPizzas = [
        {
            name: 'Pizza1',
            price: 9,
            image: config.templateGlobals.baseUrl+"/public/img/Pizza1.png",
            currency: 'usd',
            description: "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.",
        },
        {
            name: 'Pizza2',
            price: 10,
            image: config.templateGlobals.baseUrl + "/public/img/Pizza2.png",
            currency: 'usd',
            description: "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.",
        },
        {
            name: 'Pizza3',
            price: 11,
            image: config.templateGlobals.baseUrl + "/public/img/Pizza3.png",
            currency: 'usd',
            description: "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.",
        },

    ];


    var pizzaCreatedOk=0;    
    // Create menuPizzas persistent store
    hardcodedPizzas.forEach(function (pizza) {
        _data.create('menuPizzas', pizza.name, pizza,function(err,data){
            if(!err){
                pizzaCreatedOk++;
            }
        });
    });
    callback(pizzaCreatedOk==hardcodedPizzas.length);
}

controller._pizzas = {};



// Pizzas - get
// Require header authentication token
// Required data: 
// Optional data: name none
//  Results in one pizza when specified name field
//  Results in array with all pizza names
controller._pizzas.get = function(data,callback){
    // Check that the phone number is valid
    var name = data.queryStringObject.get("name");
    name = typeof(name) == 'string' && name.trim().length >= 1 ? name : false;
    
    debug("name.get.arguments",{
        name:name,    
    });
    const cb = function(err,data){
        debug("name.get.outcome",{
            err:err,
            data:data,
        });
        callback(err,data);
    };
    
    
    // Lookup valid user from header token
    isAuthenticated(data, function (err, relData) {
        if (err == 200 && relData) {
            if (name) {
                // send pizzaData of name
                _data.read('menuPizzas', name, function (err, pizza) {
                    if (!err && pizza) {
                        cb(200, pizza);
                    } else {
                        cb(404, { Error: 'Could not find pizza name' });
                    }
                });

            } else {
                // send all pizza name
                // send pizzaData of name
                _data.list('menuPizzas', function (err, pizzaNames) {                    
                    if (!err && pizzaNames) {
                        const pizzas = [];
                        var ctCallback=0;
                        pizzaNames.forEach(function(name,index){
                            _data.read('menuPizzas', name, function (err, pizza) {                               
                                ctCallback++;
                                if (!err && pizza) {
                                    pizzas.push(pizza);
                                }else{
                                    console.error(err);
                                } 
                                // callback only on when last item is read
                                if (ctCallback==pizzaNames.length){
                                    cb(200, pizzas);
                                }
                            });
                        });                           
                    } else {
                        cb(500, { Error: 'Error listing pizzas' });
                    }
                });
            }
        } else {
            cb(err, relData);
        }
    });

};

module.exports = {
    handler: controller.handler,
    createStore: controller.createStore,
}