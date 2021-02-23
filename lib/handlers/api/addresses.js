/*
* Address handler
*
*/

// Dependencies
const helpers = require('../../helpers');
const config = require('../../config');

const https = require('https');
const querystring = require("querystring");
const util = require('util');
const debug = util.debuglog('handlers');

// Define handler container
const controller = {};

// Users handler
controller.handler = function(data,callback){
    var acceptableMethods= ['get'];
    if(acceptableMethods.indexOf(data.method) > -1){
        controller._addresses[data.method](data,callback);
    }else{
        callback(405);
    }
}

// Addresses handler container
controller._addresses = {};

// Addresses - get
// Require header authentication token
// Required data: searchObj {address || location} 
// Optional data: address || location
controller._addresses.get = function(data,callback){
    // Check that the phone number is valid
    var address = data.queryStringObject.get("address");
    address = typeof (address) == 'string' && address.trim().length >= 1 ? address : false;
    var location = data.queryStringObject.get("location");
    location = typeof (location) == 'string' && location.split(",").length==2 ? location : false;
    
    debug("name.get.arguments",{
        address: address,    
        location: location
    });
    const cb = function(err,data){
        debug("name.get.outcome",{
            err:err,
            data:data,
        });
        callback(err,data);
    };
    
    
    // @TODO secure this endpoint from being accessed from unwanted requests. 
    if (address || location) {                            
        const qsPayload = {};
        var api_path = "";
        if(address){
            api_path="Geocode";
            qsPayload.address = address;
        }
        if (location) {
            api_path = "ReverseGeocode";
            qsPayload.location = location;
        }
        const qsString = querystring.stringify(qsPayload);

        // configure the request details
        var requestDetails = {
            'protocol': 'https:',
            'hostname': 'trueway-geocoding.p.rapidapi.com',
            'method': 'GET',
            'path': '/'+api_path+'/?'+qsString,
            'headers': {
                'Content-type': 'application/x-www-form-urlencoded',
                //'Content-Length': Buffer.byteLength(stringPayload),
                "x-rapidapi-key": config.truWayGeocoding.api_key,
                "x-rapidapi-host": config.truWayGeocoding.api_host,
            }
        }
        var responseBody = "";
        var req = https.request(requestDetails, function (res) {
            // return 
            res.on('data', function (chunk) {
                responseBody += chunk;
            });

            res.on('end', function () {
                const _res = {
                    status: res.statusCode,
                    header: res.headers,
                    payload: helpers.parseJsonToObject(responseBody),
                };
                
                cb(_res.statusCode,_res.payload);
            });

            // grab the status of the sent response        
        });

        // Bind error event so it doesn't get thrown
        req.on('error', function (e) {
            callback(e);
        });

        req.write("");

        // End the request
        req.end();                
    }else{
        cb(400, { Error: 'Missing required fields or fields are invalid' });
    }
};

module.exports = {
    handler: controller.handler,
}