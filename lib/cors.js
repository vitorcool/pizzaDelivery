/*
*
*   Handle CORS
*/

// Dependencies


// cors container
const cors = {};

cors.options = {};

cors.req = null;
cors.res = null;
cors.allowedArgs = {
    allow_origin: 'Access-Control-Allow-Origin',
    allow_headers: 'Access-Control-Allow-Headers',
    allow_credentials: 'Access-Control-Allow-Credentials',
    allow_methods: 'Access-Control-Allow-Methods',
    nax_age: 'Access-Control-Max-Age',
    exposo_headers: 'Access-Control-Expose-Headers',
};


//public container
cors.public = {};

 /*
     set(request,response,{
        allow_origin: ['*'],
        allow_credentials: true,                
        allow_headers: ['Origin', 'Accept', 'Content-Type'],
        allow_methods: ['POST', 'GET', 'DELETE', 'PUT'],
        max_age: 3600,
        exposo_headers: undefined, 
    });

 */
// Cors Headers
cors.public.set = function ( req, res, args) {
    
    cors.req=req;
    cors.res=res;
    // for each corOption
    
    cors.options = {};
    Object.keys(args || {}).forEach(function (argName) {
        const argValue = args[argName];
        cors.options[argName] = argValue;

        const valid = 
                    typeof (cors.allowedArgs[argName]) == 'string' &&
                    argValue == undefined || argValue == null;

        if (valid) {
            cors.options[argName] = argValue;            
        } else {
            // ignore unknown and/ou invalid args
        }
    });

    
    return cors.public;
}

cors.isOriginAllowed = function(origin, allowedOrigin) {
    if (Array.isArray(allowedOrigin)) {
        for (var i = 0; i < allowedOrigin.length; ++i) {
            if (cors.isOriginAllowed(origin, allowedOrigin[i])) {
                return true;
            }
        }
        return false;
    } else if (typeof(allowedOrigin)=='string' || allowedOrigin instanceof String) {
        return origin === allowedOrigin;
    } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
    } else {
        return !!allowedOrigin;
    }
}

cors.public.isRequestPreflight=function(){
    const method = cors.req.method.toLocaleLowerCase();
    const headers = cors.req.headers;

    if (headers.origin) {                
        cors.setHeaders();        
        if (method == 'options'){
            cors.res.writeHead(200);
            cors.res.end();
            return true;        
        }
    }
    return false;
}

cors.setHeaders=function(){    
    const headers = cors.public.getheaders();
    Object.keys(headers).forEach(function(headerKey){
        cors.res.setHeader(headerKey,headers[headerKey]);
    });
}

cors.public.getheaders=function(){
    var ret={};
    Object.keys(cors.options || {}).forEach(function (argName) {
        const argValue = cors.options[argName];
    

        const headerKeyValue = typeof (cors.allowedArgs[argName]) == 'string' ? cors.allowedArgs[argName] : undefined;
        const headerStringValue =
             typeof (argValue) == 'object' && argValue instanceof Array ? argValue.join(",")
            : typeof (argValue) == 'string' ? argValue
            : typeof (argValue.toString) == 'function' ? argValue.toString()
            : undefined;

        if (headerKeyValue && headerStringValue) {
            ret[headerKeyValue] = headerStringValue;
        } else {
            // ignore unknown and/ou invalid args
        }
    });

    // set origin
    const origin = cors.req.headers.origin;
    if (cors.isOriginAllowed(origin, cors.options.allow_origin||[])) {
        ret[cors.allowedArgs["allow_origin"]] = origin;
    } else {
        ret[cors.allowedArgs["allow_origin"]] = '';
    }    
    return ret;
}

cors.public.options = function () {
    return cors.options;
}


cors

module.exports = cors.public;
