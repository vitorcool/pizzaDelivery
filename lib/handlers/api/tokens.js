/*
* token handler
*
*/

// Dependencies
const _data = require('../../data');
const helpers = require('../../helpers');
const config = require('../../config');
const util = require('util');
const debug = util.debuglog('handlers');

// Define handler container
const controller = {};

// Tokens handler
controller.handler = function(data,callback){
    var acceptableMethods= ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
        controller._tokens[data.method](data,callback);
    }else{
        callback(405);
    }
}


// Container for all the tokens methods
controller._tokens = {};

// Tokens - post
// Required data : email, password
// Optional data: none
controller._tokens.post = function(data,callback){
    // check that all required fields are filled out
    var email = typeof(data.payload.email) === 'string' && data.payload.email.trim().length >= 9 ? data.payload.email.trim() : false;
    var password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    debug("tokens.post.arguments",{
        email:email,    
        password:"*".repeat(10),
    });
    const cb = function(err,data){
        debug("tokens.post.outcome",{
            err:err,
            data:data,
        });
        callback(err,data);
    }
    if(email && password){
        // make sure that user doesnt already exist
        _data.read('users',email,function(err,userData){
            if(!err && userData){
                var hashedPassword = helpers.hash(password);
                if(hashedPassword == userData.hashedPassword){
                    // if valid, create a new token with a random name e expiration data = one hour in future
                    var tokenId = helpers.createRandomString(20);
                    var expires = Date.now() + config.tokenTimeout;
                    var tokenObj = {
                        'email' : email,
                        'id': tokenId,
                        'expires' : expires
                    }

                    // Store token
                    _data.create('tokens',tokenId,tokenObj,function(err){
                        if(!err){
                            cb(200,tokenObj);                                    
                        }else{
                            cb(500,{Error:'Could not create new token'});
                        }
                    })

                } else {
                    cb(400,{'Error':'Password did not match the specified user\'s stored password'});
                }
            }else{
                // user already exists
                cb(400,{Error: 'Could not find specified user'})
            }
        })
    }else{
        cb(400,{'Error': 'Missing required fields'});
    }
}

// Tokens - delete
// Required data: id
// Optional data: none
controller._tokens.delete = function(data,callback){
    // Check that the token id is valid
    var id = data.queryStringObject.get("id");
    id = typeof(id) == 'string' && id.trim().length > 0
            ? id : false;
    
    debug("tokens.delete.arguments",{
        id:id,    
    });
    const cb = function(err,data){
        debug("tokens.delete.outcome",{
            err:err,
            data:data,
        });
        callback(err,data);
    };
    if(id){
        // Lookup token
        _data.read('tokens',id,function(err,data){
            if(!err && data){
                _data.delete('tokens',id,function(err){
                    if(!err){
                        cb(200);
                    }else{
                        cb(500,{Error:'Could not delete the specified token'})
                    }
                });
            }else{
                cb(404,{Error:'Could not find specified token'});
            }
        })
    }else{
        cb(400,{Error:'Missing required field'});
    }
}


// Tokens - get
// Required data : id
// Optional data: none
controller._tokens.get = function (data, callback) {
    // Check that the Token is valid
    var id = data.queryStringObject.get("id");
    id = typeof (id) == 'string' && id.trim().length > 0
        ? id : false;
    debug("tokens.get.arguments", {
        id: id,
    });
    const cb = function (err, data) {
        debug("tokens.get.outcome", {
            err: err,
            data: data,
        });
        callback(err, data);
    }
    if (id) {
        // Lookup Token
        _data.read('tokens', id, function (err, tokenData) {
            if (!err && tokenData) {
                cb(200, tokenData);
            } else {
                cb(404, { Error: 'Could not find specified token' });
            }
        })
    } else {
        cb(400, { Error: 'Missing required field' });
    }
}

// Tokens - put
// Required data : id, extend
// Optional data : none
controller._tokens.put = function (data, callback) {
    // Check that the Token is valid
    var id = data.payload.id;
    id = typeof (id) == 'string' && id.trim().length > 0
        ? id : false;
    var extend = typeof (data.payload.extend) == 'boolean' && data.payload.extend == true;
    debug("tokens.put.arguments", {
        id: id,
        extend: extend
    });
    const cb = function (err, data) {
        debug("tokens.put.outcome", {
            err: err,
            data: data,
        });
        callback(err, data);
    };
    if (id && extend) {
        // Lookup Token
        _data.read('tokens', id, function (err, tokenData) {
            if (!err && tokenData) {
                // check to make sure the token is not already expired
                if (tokenData.expires > Date.now()) {
                    // set new expiration date
                    tokenData.expires = Date.now() + config.tokenTimeout;

                    // Store Token\'s new expiration date
                    _data.update('tokens', id, tokenData, function (err) {
                        if (!err) {
                            cb(200);
                        } else {
                            debug(err);
                            cb(500, { Error: 'Could not update token\'s expiration' })
                        }
                    })
                } else {
                    cb(400, { 'Error': 'The token has already expired, and can not be extended' });
                }

            } else {
                cb(404, { Error: 'Could not find specified token' });
            }
        })
    } else {
        cb(400, { Error: 'Missing required fields or fields are invalid' });
    }
}


// Verify if a given token id is currently valid for a given user
controller.verifyToken = function(tokenId,userEmail,callback){
    // Lookup TokenId
    _data.read('tokens',tokenId,function(err,tokenData){
        if(!err && tokenId){
            // Assert found[TokenId].email == userEmail     // TokenId belongs to userEmail
            // Assert found[TokenId].expires > Date.now()   // Token still valid
            const checkResult=
                    tokenData.email == userEmail && 
                    tokenData.expires > Date.now();
            
            if(!checkResult) debug("Error",err);
            callback(checkResult);
        }else{
            callback(false);
        }
    });
}

module.exports = {
    handler : controller.handler,
    verifyToken: controller.verifyToken,
};