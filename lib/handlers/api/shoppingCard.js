/*
* user_shoppingCard handler
*
*/

// Dependencies
const _data = require('../../data');
const util = require('util');
const debug = util.debuglog('handlers');
const isAuthenticated = require('./users').isAuthenticated;

// Define handler container
const controller = {};

// user_shoppingcard handler
controller.handler = function(data,callback){    
    if (['post', 'get', 'delete'].indexOf(data.method) > -1){
        controller._shoppingCard[data.method](data,callback);
    }else{
        callback(405);
    }
}

// Container for all the user_shoppingcard methods
controller._shoppingCard = {};


// user_shoppingcard - post 
// Create the shoppingCard_item for given name (of pizza) - Will Throw error when name (of pizza) does not exit
// Require header authentication token
// Required data : name
// Optional data: none
controller._shoppingCard.post = function(data,callback){
    // validate arguments
    var name = typeof(data.payload.name) == 'string' && data.payload.name.length > 0 ? data.payload.name : false;    
    
    debug("user_shoppingcard.post.arguments",{
        name: name,
    });
    const cb = function(err,data){
        debug("user_shoppingcard.post.outcome",{
            err:err,
            data:data,
        });
        callback(err,data);
    };

    // Lookup valid user from header token
    isAuthenticated(data,function(err,relData){
        if(err==200 && relData){            
            const user = relData.user;
            // Lookup for name (of pizza)
            _data.read("menuPizzas",name,function(err,pizzaData){
                if(!err && pizzaData){
                    // add pizza to shoppping card
                    user.shoppingCard.push(pizzaData);
       
                    // Store updated shopping card data
                    _data.update("users",user.email,user,function(err,data){
                        if(!err){
                            cb(200,pizzaData);
                        }else{
                            cb(500,{Error:'Could not update user shoppingCard with new pizza item'});
                        }
                    });
                }else{
                    cb(404,{Error:'Could not find specified menuPizza name'});
                }
            });
        }else{
            cb(err,relData);
        }
    });
        
    
}

// user_shoppingcard - get
// Require header authentication token
// Required data : none || idx
// Optional data: none
controller._shoppingCard.get = function(data,callback){
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

// user_shoppingcard - delete
// Require header authentication token
// Required data: none
// Optional data: idx
controller._shoppingCard.delete = function(data,callback){
    // Check that the user_shoppingcard idx is valid
    var idx = parseInt(data.queryStringObject.get("idx"));
    idx = typeof (idx) == 'number' && idx >= 0
        ? idx : undefined;

    debug("user_shoppingcard.delete.arguments",{
        idx:idx,            
    });
    const cb = function(err,data){
        debug("user_shoppingcard.delete.outcome",{
            err:err,
            data:data,
        });
        callback(err,data);
    };

        
    // Lookup check with request idx
    isAuthenticated(data,function(err,relData){    
        if(err==200 && relData){
            //console.log('ENTER:idx:', idx)
            //console.log("ENTER:relData.user.shoppingCard.length:", relData.user.shoppingCard.length);

            if (idx != undefined) {  
                // delete shoppingcard item
                relData.user.shoppingCard.splice(idx,1);
            }else{
                // delete all shoppingcard itens
                relData.user.shoppingCard=[];
            }

            // store updated data
            _data.update('users',relData.user.email,relData.user,function(err,data){
                if(!err){
                    //console.log("LEAVE:relData.user.shoppingCard.length:",relData.user.shoppingCard.length);
                    cb(200);
                }else{
                    cb(500,{Error:'Could not update specified user'});
                }
            });
        }else{
            cb(err,relData);
        }
    })
    
}


module.exports = {
    handler : controller.handler,
    
};