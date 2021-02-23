/*
*
*   TESTS PIZZA DELIVERY CRITICALS
*
*/


// Dependencies
const helpers = require('../lib/helpers');
const server = require('../lib/server');
const https = require('https');
const http = require('http');
const util = require('util');

const debug = true ? util.debuglog('tests') : function () {};
const display = console.log;

// Enable deep inspection of debuging
util.inspect.defaultOptions.depth = null;


// Execute func: function(data,callback), wait for callback and return its value
const returnCallback = async function (func, args) {    
    var result;
    const callback = function (err, data) {
        result = { err: err, data: data };
    }
    func(args, callback);

    const timeout = util.promisify(setTimeout);
    while (!result) {
        await timeout(50);
    }
    return result;
}


// execute rest request
// arguments:
//      description default method+' '+path
//      method default "GET"
//      path default '/'
//      headers default {}
//      payload default {}
//      query default {}
//      asserts default {
//           'statusCode==200' : function(_res)   {...}
//                  }
const restTest= async function( rest ){
        
    const rest_req = {
        method: rest.method ? rest.method:"GET",
        path: rest.path ? rest.path:"/",
        headers: rest.headers ? rest.headers:undefined,
        payload: rest.payload ? rest.payload:undefined,
        query: rest.query ? rest.query:undefined,
    }
    // delete undefined properties
    Object.keys(rest_req).forEach(function(reqPropName){
        if(rest_req[reqPropName]==undefined)
            delete rest_req[reqPropName];
    });

    const description = rest.description || rest_req.method+" "+rest_req.path;    

    // wait for request response
    const response = await returnCallback(_test.request, rest_req);

    // asserts

    var assertsDisplay = [];

    // merge default assert with parameter rest.assets
    const asserts = Object.assign(
        typeof (rest.assets) == 'object' ? rest.assets : {},
        {
            'statusCode==200': function (_res) {
                const ok = _res.data.status == '200';
                if (!ok) {
                    assertsDisplay.push(
                        "status "+_res.data.status+" "+JSON.stringify(_res.data.payload));
                }
                return ok;
            },
        }
    );


    var ok = true;
    
    Object.keys(asserts).forEach(function(assertName){
        const assertFunc = typeof (asserts[assertName]) == 'function' ? asserts[assertName] : false;
        if(assertFunc){
            try{
                // execute assert code
                const assertResult = assertFunc(response);
                ok = ok && assertResult;
                assertsDisplay.push('"'+assertName+'" '+(ok?'success':'fail'));                
            }catch(e){
                console.log(e.message);
            }
        }else{
            console.log('assert "'+assertName+'" not defined' );
        }
    });
    
    const displayColor = ok ? '\x1b[32m%s\x1b[0m '
                            : '\x1b[31m%s\x1b[0m ';
    display(displayColor, description+": ", ok ? "ok" : "Error");
    display("request:", rest_req);
  //  display("response:", response.data);
    assertsDisplay.forEach(function(text){        
        display(displayColor, text);
    });
    display(">");
    
    return response;
}

// Container for this test method(s)
const _test = {}
_test.serverOptions = {
    host: 'localhost',
    httpPort: 3010,
    httpsPort: 3011,
};

_test.apiBasePath = '/api';
_test.requestOptions = {
    'rejectUnauthorized': false,
    'protocol': 'https:',
    'host': 'localhost',
    'port': _test.serverOptions.httpsPort,
    'method': 'GET',
    'path': _test.apiBasePath,
    'headers': {
    }
};

_test.data ={
    user: {
        "name": "John Tester",
        "address": "2 W 21st St, New York, NY 10010, USA",
        "email": "johntester@gmail.com",
        "password": "password"
    },
    card: {
        cardnumber: '4242 4242 4242 4242',
        expirationdate: '12/23',
        securitycode: '111',
    },
}

// HTTP CLIENT REQUEST
// arguments:
//   method default GET
//   path default /
//   headers as json default {}
//   payload as json default undefined
_test.request = function (data, callback) {
    // defaut parameters initialization
    const method = typeof (data.method) == 'string' ? data.method : 'GET';
    const path = typeof (data.path) == 'string' ? data.path : '/';
    const headers = typeof (data.headers) == 'object' ? data.headers : {}
    const payload = typeof (data.payload) == 'object' && data.payload != null ? data.payload : undefined;
    const query = typeof (data.query) == 'object' && data.query != null ? data.query : undefined;

    const stringPayload = typeof (payload) == 'object' ? JSON.stringify(payload) : "";
    const stringQuery = typeof (query) == 'object' ? "?" + helpers.parseJsonToQueryString(query) : "";
    // configure the request details
    var requestDetails = Object.assign({},_test.requestOptions, {
        'method': method,
        'path': (_test.requestOptions.path ? _test.requestOptions.path : '') + path + stringQuery,
        'headers': Object.assign( Object.assign(
                _test.requestOptions.headers, {
                    'Content-type': 'application/json',
                    'Content-Length': Buffer.byteLength(stringPayload),
                }),headers),
    });

    debug('_test.' + arguments.callee.name + ' request', data);
    // 
    var responseBody = "";
    const protocolClient = (requestDetails.protocol === 'https:' ? https : http);
    var req = protocolClient.request(requestDetails, function (res) {
        // get response body
        res.on('data', function (chunk) {
            responseBody += chunk;
        });

        res.on('end', function () {
            const _res = {
                status: res.statusCode,
                header: res.headers,
                payload: helpers.parseJsonToObject(responseBody),
            };

            debug('_test.' + arguments.callee.name + ' response', _res);

            callback(false, _res);
        });
    });

    // Bind error event so it doesn't get thrown
    req.on('error', function (e) {
        callback(e);
    });

    req.write(stringPayload);

    // End the request
    req.end();
}


const runTest=async function(){
    // init pizaDelivery server
    await returnCallback(server.init,_test.serverOptions);
    display( "Server ON"); 


    var ret=null;

    // address geo location
    ret = await restTest({
        description: "Address geo location",
        
        method: 'GET',
        path: '/addresses',
        query: {
            address: _test.data.user.address
        }            
    });
    
    
    // address reverse geo location
    const firstResult = ret.data.payload.results instanceof Array ? ret.data.payload.results : [];
    const gpsLocation = typeof(firstResult[0]) == 'object' ?
          firstResult[0].location.lat + "," + firstResult[0].location.lng : "";
          
    ret = await restTest({
        description: "Address reverse geo location",

        method: 'GET',
        path: '/addresses',
        query: {
            location: gpsLocation
        }
    });
    

    // Create New User
    ret = await restTest({
        description: "Create new user",
  
        method: 'POST',
        path: '/users',
        payload: _test.data.user,
    
    });



    // Login User
    ret = await restTest({
        description: "Login user",
        asserts:{            
            'payload' : function(_res){

            }
        },
        method: 'POST',
        path: '/tokens',
        payload: {
            email: _test.data.user.email,
            password: _test.data.user.password,
        },
    });
    

    // ListMenu
    const token=ret.data.payload.id;
    ret = await restTest({
        description: "List pizza menu",
    
        method: 'GET',
        path: '/pizzas',
        headers: {
            'token': token,
        },
    });
  
    
    // delete shoppingCard
    ret = await restTest({
        description: "Delete shopping card",

        method: 'DELETE',
        path: '/shoppingcard',
        headers: {
            'token': token,
        },
    });

    
    // Add pizza to shopping card
    ret = await restTest({
        description: "Add pizza to shopping card",

        method: 'POST',
        path: '/shoppingcard',
        headers: {
            'token': token,
        },
        payload: {
            name: 'Pizza1'
        },
    });
    ret = await restTest({
        description: "Add pizza to shopping card",

        method: 'POST',
        path: '/shoppingcard',
        headers: {
            'token': token,
        },
        payload: {
            name: 'Pizza2'
        },
    });
    

    // List shopping card
    ret = await restTest({
        description: "List shopping card",

        method: 'GET',
        path: '/shoppingcard',
        query: {
            id: token,
        },
        headers: {
            'token': token,
        },
    });
    

    // User shopping car payment intent 
    ret = await restTest({
        description: "User shopping car payment intent",

        method: 'POST',
        path: '/shoppingcard/pay',
        headers: {
            'token': token,
        },
        payload: {
            address: _test.data.user.address
        }
    });
    

    // user shoppingcard payment intend confirmation
    const paymentIntentId = ret.data.payload.id
    ret = await restTest({
        description: "User shopping car payment intent confirmation",

        method: 'POST',
        path: '/shoppingcard/pay/confirm',
        headers: {
            'token': token,
        },
        payload: {
            id: paymentIntentId,
            card: _test.data.card, 
        }
    });


    // Logout user
    ret = await restTest({
        description: "User logout",

        method: 'DELETE',
        path: '/tokens',
        query: {
            id: token,
        },
        
    });

}
runTest().then(function(){
    process.exit();
},function(error){
    console.log(error);
    process.exit();
});