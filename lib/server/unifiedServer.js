/*
*  Server Main Request Responder
*
*/

const StringDecoder = require("string_decoder").StringDecoder;
const { handlers, router } = require("./router");
const helpers = require('../helpers');
const config = require('../config');
const cors = require('../cors');
const util = require('util');
const debug = util.debuglog('server');

const unifiedServer = function (req, res) {
    // get the URL and parse it
    var url = new URL(req.url, "http://" + req.headers.host);

    // get the path
    var path = url.pathname;

    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    var method = req.method.toLocaleLowerCase();
    var queryStringObject = url.searchParams;
    var headers = req.headers;

    // get payload if any
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data', function (data) {
        buffer += decoder.write(data);
    });
    req.on('error', function (err) {
        debug("Request error:", err);
    }).on('end', function () {
        res.on('error', (err) => {
            debug("response error", err);
        });


        buffer += decoder.end();

        // Chose response Handler based on URL path
        // trimmedPath based handler if exists
        // ifnot handler.notFound
        var chosenHandler = typeof (router[trimmedPath]) != 'undefined'
            ? router[trimmedPath] : handlers.notFound;

        // public static folder
        chosenHandler = trimmedPath.indexOf('public/') > -1
            ? handlers.public : chosenHandler;

        var data = {
            'path': path,
            trimmedPath: trimmedPath,
            queryStringObject: queryStringObject,
            'method': method,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)
        };
        debug("Request", data);

        // handle cors request preflight
        if (cors.set(req, res, config.cors).isRequestPreflight(req, res)) {
            return;
        }
        
        if (chosenHandler == handlers.notFound){
            console.log("request not handled",data.path);
        }

        try{
            chosenHandler(data, function (statusCode, payload, contentType) {
                processHandlerResponse(res,method,trimmedpath,statusCode,payload,contentType);
            });            
        }catch(e){
            debug(e);

            processHandlerResponse(res,method,trimmedpath,500,{Error:'An unknown error has occured'},'json');
            /* const debugColor = statusCode == 200
                ? '\x1b[32m%s\x1b[0m'
                : '\x1b[31m%s\x1b[0m';
            const allHeaders = JSON.parse(JSON.stringify(res.getHeaders()));
            debug(debugColor, "Response", {
                headers: allHeaders,
                statusCode: statusCode,
                payload: payloadString
            }); */
        }


    });

};

processHandlerResponse= function(res,method,trimmedpath, statusCode, payload, contentType) {
    //validate func arguments
    // contentType if not specified is 'json' by default
    contentType = typeof (contentType) == 'string' ? contentType : 'json';
    // statusCode if not specified is 200 by default
    statusCode = typeof (statusCode) == 'number' ? statusCode : 200;

    var payloadString = payload;
    // return the response-parts that are content-specific
    if (contentType == 'json') {
        payload = typeof (payload) === 'object' ? payload : {};
        payloadString = JSON.stringify(payload);
        res.setHeader('Content-type', 'application/json');
    } else if (contentType == 'javascript') {
        //  res.setHeader('Content-type', 'application/javascript');
    } else if (contentType == 'html') {
        res.setHeader('Content-type', 'text/html');
    } else if (contentType == 'favicon') {
        res.setHeader('Content-type', 'image/x-icon');
    } else if (contentType == 'css') {
        res.setHeader('Content-type', 'text/css');
    } else if (contentType == 'png') {
        res.setHeader('Content-type', 'image/png');
    } else if (contentType == 'jpg') {
        res.setHeader('Content-type', 'image/jpeg');
    } else if (contentType == 'svg' || contentType == 'svx') {
        res.setHeader('Content-type', 'image/svg+xml');
    } else if (contentType == 'plain') {
        res.setHeader('Content-type', 'text/plain');
    }
    res.writeHead(statusCode);
    res.end(payloadString);
    
}



module.exports = unifiedServer;