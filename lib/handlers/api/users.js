/*
* user handler
*
*/

// Dependencies
const _data = require('../../data');
const helpers = require('../../helpers');
const verifyToken = require('./tokens').verifyToken;
const util = require('util');
const debug = util.debuglog('handlers');

// Define handler container
const controller = {};

// Users handler
controller.handler = function(data,callback){
    var acceptableMethods= ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
        controller._users[data.method](data,callback);
    }else{
        callback(405);
    }
}

// Container for all the users methods
controller._users = {};

// Users - post
// Required data: name, email, address
// Optional data: none
controller._users.post = function(data,callback){
    // check that all required fields are filled out
    var email = typeof(data.payload.email) === 'string' && helpers.validateEmailFormat(data.payload.email) ? data.payload.email.trim() : false;
    var name = typeof(data.payload.name) === 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false;
    var address = typeof (data.payload.address) === 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
    var password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var shoppingCard = [];
    
    debug("users.post.arguments",{
        email:email,
        name:name,
        address: address,
        password: password ? "*".repeat(10): undefined,        
    });
    const cb = function(err,data){
        debug("users.post.outcome",{
            err:err,
            data:data,
        });
        callback(err,data);
    };
    if(email && name && address && password){
        // make sure that user doesnt already exist
        _data.read('users',email,function(err,data){
            if(err){
                // hash the password
                var hashedPassword = helpers.hash(password);

                if(hashedPassword){
                    // create user
                    var userObj = {
                        email: email,
                        name: name,
                        address:address,
                        hashedPassword: hashedPassword,                    
                        shoppingCard: shoppingCard,
                        created: new Date((Date.now())).toISOString(),
                    };

                    // validate email
                    helpers.validateEmail(userObj.email, function (err, validationData) {
                        if (!err && typeof (validationData) == 'object' && validationData.valid) {
                            // Store user
                            _data.create('users', email, userObj, function (err) {
                                if (!err) {
                                    cb(200, userObj);
                                } else {
                                    debug(err);
                                    cb(400, { Error: 'Count not create new user' })
                                }
                            });
                        } else {
                            cb(400, { 'Error': 'Could not validate email' });
                        }
                    });
                    
                }else{
                    cb(500,{'Error':'Could not hash user\'s password'});
                }   
            }else{
                // user already exists
                cb(400,{Error: 'A user with that email address already exists'})
            }
        })
    }else{
        cb(400,{'Error': 'Missing required fields'});
    }
};

// Users - get
// Required data: email
// Optional data: none
// Only let an authenticated user access their object. 
controller._users.get = function(data,callback){
    // Check that the email number is valid
    var email = data.queryStringObject.get("email");
    email = typeof(email) == 'string' && helpers.validateEmailFormat(email) ? email : false;
    
    debug("users.get.arguments",{
        email:email,    
    });
    const cb = function(err,data){
        debug("users.get.outcome",{
            err:err,
            data:data,
        });
        callback(err,data);
    };
    if(email){
        // Get the token from the headers
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;   
        verifyToken(token,email,function(tokenIsValid){
            if(tokenIsValid){
                // Lookup user
                _data.read('users',email,function(err,data){
                    if(!err && data){
                        // Remove the hashed password from the user data
                        delete data.hashedPassword;
                        cb(200,data);
                    }else{
                        cb(404,{Error:'Could not find specified user'});
                    }
                })
            }else{
                cb(403,{Error:'Missing required token in header, or token is invalid'})
            }
        })        

        
    }else{
        cb(400,{Error:'Missing required field'});
    }
};

// Users - put
// Required data: email
// Optional data: name, password
// Just let an authenticated user update their own object
controller._users.put = function(data,callback){
    // check required field
    var email = typeof(data.payload.email) === 'string' && helpers.validateEmailFormat(data.payload.email)? data.payload.email.trim() : false;
    var name = typeof(data.payload.name) === 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false;
    var address = typeof (data.payload.address) === 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
    var password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    debug("users.put.arguments",{
        email:email,
        name:name,
        address:address,
        password: password ? "*".repeat(10): undefined    
    });
    const cb = function(err,data){
        debug("users.put.outcome",{
            err:err,
            data:data,
        });
        callback(err,data);
    };
    if(email){
        if(name || password || address){
            
            // get token from header
            var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
            verifyToken(token,email,function(tokenIsValid){
                if(tokenIsValid){
                    _data.read('users',email,function(err,userData){
                        if(!err && userData){
                            // update the fields necessary                            
                            if(name) userData.name = name;
                            if(password) userData.hashedPassword = helpers.hash(password);
                            if (address) userData.address = address;
                            _data.update('users',email,userData,function(err){
                                if(!err){
                                    cb(200,userData);
                                }else{
                                    debug(err);
                                    cb(500,{Error:'Could not update user'})
                                }
                            })
                        }else{
                            cb(400,{'Error':'The specified user does not exist'});
                        }
                    });        
                }else{
                    cb(403,{Error:'Missing required token in header, or token is invalid'})
                }
            });
            
        }else {
            cb(400, { Error:'Missign at least on optional fields to update'})
        }                
    }else{
        cb(400,{'Error':'Missing required field'})
    }
};


// Users - delete
// Required field: email
// Only let an authenticated user delete their own obj. Dont let delete any one else
// @TODO Cleanup (delete) any other user data (files,etc)
controller._users.delete = function(data,callback){
    // Check that the email number is valid
    var email = data.queryStringObject.get("email");
    email = typeof(email) == 'string' && email.trim().length >= 9 ? email : false;

    debug("users.delete.arguments",{
        email:email,        
    });
    const cb = function(err,data){
        debug("users.delete.outcome",{
            err:err,
            data:data,
        });
        callback(err,data);
    };
    if(email){
        // get token from header
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        verifyToken(token,email,function(tokenIsValid){
            if(tokenIsValid){
                // Lookup user
                _data.read('users',email,function(err,userData){
                    if(!err && userData){                                              
                        // delete user
                        _data.delete('users',email,function(err){
                            if(!err){                                                   
                                cb(200);                                                    
                            }else{
                                cb(500,{Error:'Could not delete the specified user'})
                            }
                        });
                    }else{
                        cb(400,{Error:'Could not find specified user'});
                    }
                });             
            }else{
                cb(403,{Error:'Missing required token in header, or token is invalid'})
            }
        });   
        
    }else{
        cb(400,{Error:'Missing required field'});
    }
}; 

controller.isAuthenticated = function (data, callback) {
    // validate arguments
    var name = typeof (data.name) == 'string' && data.name.length > 0 ? data.name : false;

    debug("helper.authUser.arguments", {
    });
    const cb = function (err, data) {
        debug("helper.authUser.outcome", {
            err: err,
            data: data,
        });
        callback(err, data);
    };

    var token = typeof (data.headers) == 'object' && typeof (data.headers.token) == 'string' ? data.headers.token : false;
    if (token) {
        // Lookup token, user
        _data.read('tokens', token, function (err, tokenData) {
            if (!err && tokenData) {
                var userEmail = tokenData.email;

                // Lookup for user based on token.email
                _data.read('users', userEmail, function (err, userData) {
                    if (err) {
                        cb(500, { Error: 'Could not create find specified user' });
                    } else {
                        // Validate if user shoppingCard 
                        const userShoppingCard =
                            typeof (userData.shoppingCard) == 'object' &&
                                userData.shoppingCard instanceof Array
                                ? userData.shoppingCard
                                : [];

                        const data = {
                            token: tokenData,
                            user: userData,
                        }
                        cb(200, data);
                    }
                })
            } else {
                cb(403, { Error:'Token is invalid'});
            }
        });
    } else {
        cb(403, { Error:'Missing required token in header, or token is invalid'});
    }
}



// Export module
module.exports = {
    handler: controller.handler,
    isAuthenticated: controller.isAuthenticated,
}
