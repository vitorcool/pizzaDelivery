/*
* Helpers for various tasks
*
*/

// Dependencies
const crypto = require('crypto');
const config = require('./config');
const https = require('https');
const path = require('path');
const fs = require('fs');
const qs = require('querystring');
const debug = function(){};

// Container for all the helpers
const helpers = {};

// Create a SHA256 hash
helpers.hash = function(str){
    if(typeof(str)== 'string' && str.length>0){
        var hash = crypto.createHmac('sha256',config.hashingSecret).update(str).digest('hex');
        return hash;
    }else{
        return false;
    }
}

// Parse a JSON string to an object in all cases 
// without throwing any error
helpers.parseJsonToObject = function(str){
    try{
        var obj = JSON.parse(str);
        return obj;
    }catch(e){
        return {}
    }
    
}

// Parse a JSON (deep)object to a QueryString
// Found@https://gist.github.com/dgs700/4677933
helpers.parseJsonToQueryString = function (a) {
    const buildParams=function(prefix, obj, add) {
        var name, i, l, rbracket;
        rbracket = /\[\]$/;
        if (obj instanceof Array) {
            for (i = 0, l = obj.length; i < l; i++) {
                if (rbracket.test(prefix)) {
                    add(prefix, obj[i]);
                } else {
                    buildParams(prefix + "[" + (typeof obj[i] === "object" ? i : "") + "]", obj[i], add);
                }
            }
        } else if (typeof obj == "object") {
            // Serialize object item.
            for (name in obj) {
                buildParams(prefix + "[" + name + "]", obj[name], add);
            }
        } else {
            // Serialize scalar item.
            add(prefix, obj);
        }
    }

    var prefix, s, add, name, r20, output;
    s = [];
    r20 = /%20/g;
    add = function (key, value) {
        // If value is a function, invoke it and return its value
        value = (typeof value == 'function') ? value() : (value == null ? "" : value);
        s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
    };
    if (a instanceof Array) {
        for (name in a) {
            add(name, a[name]);
        }
    } else {
        for (prefix in a) {
            buildParams(prefix, a[prefix], add);
        }
    }
    output = s.join("&").replace(r20, "+");
    return output;
};

// Create a string of ramdom alfa numeric chars with <len> caracters length
helpers.createRandomString = function(strLength){
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength: false;
    if(strLength){
        var possibleChars = 'abcdefghijlmnoprtuvxz1234567890';

        var str='';
        for(i=1;i <= strLength; i++){
            // get random char
            var randomCharacter = possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
            // append char to building string;
            str+=randomCharacter;
        }
    }else{
        return false;
    }
    return str;
}

// Send and Email via MailGun
/*
curl -s --user 'api:YOUR_API_KEY' \
    https://api.mailgun.net/v3/YOUR_DOMAIN_NAME/messages \
    -F from='Excited User <mailgun@YOUR_DOMAIN_NAME>' \
    -F to=YOU@YOUR_DOMAIN_NAME \
    -F to=bar@example.com \
    -F subject='Hello' \
    -F text='Testing some Mailgun awesomeness!'
*/
// Required parameters: to
// Optional: subject, body, html
/* Simple Example
    helders.sendMailGun({
        to: 'go@from.hear',
        subject: 'Test sending email to mailgun',
        text: 'body of the message',
        html: '<html>HTML email</html>',
    },function(err,data){
        if(!err && data){
            callback(); // without Errors
        }else{
            callback(err,data);
        }
    })
*/
helpers.sendMailGun = function(args, callback){
    // validate parameters
    to = helpers.validateEmailFormat(args.to) ?args.to: false;
    subject = typeof (args.subject) == 'string' ? args.subject: false;
    text = typeof (args.text) == 'string' ? args.text : false;
    html = typeof (args.html) == 'string' ? args.html : false;
    
    if(to && (subject || text || url)){
        // Configure the request payload
        var payload = {
            'from': config.mailgun.email,
            'to': to,
            'subject': subject,                       
        };
        if(text){
            payload.text = text;
        }
        if(html) {
            payload.html = html;
        }    

        // Payload Content-type: application/x-www-form-urlencoded
        var stringPayload = helpers.parseJsonToQueryString(payload);

        // configure the request details
        var requestDetails = { 
            'protocol' : 'https:',
            'hostname' : 'api.mailgun.net',
            'method'   : 'POST',
            'path'     : '/v3/'+config.mailgun.domain+'/messages',
            'auth'     : 'api:'+config.mailgun.api_key,
            'headers' : {
                'Content-type' : 'application/x-www-form-urlencoded',
                'Content-Length' : Buffer.byteLength(stringPayload),
            }
        }

        // 
        var responseBody = "";
        var req = https.request(requestDetails, function (res) {
            // return 
            res.on('data', function (chunk) {
                responseBody += chunk;
            });

            res.on('end', function () {
                const _req = {
                    'api.mailgun.send': Object.assign(requestDetails,{
                        payload: payload
                    }),
                };
                const _res = {
                    status: res.statusCode,
                    header: res.headers,
                    payload: helpers.parseJsonToObject(responseBody),
                };
                debug('helper.sendMailGun request', _req);
                debug('helper.sendMailGun response', _res);

                callback(_res);
            });

            // grab the status of the sent response        
        });

        // Bind error event so it doesn't get thrown
        req.on('error',function(e){
            callback(e);
        });

        req.write(stringPayload);

        // End the request
        req.end();

    }else{
        callback('Given parameters ware missing or invalid');
    }

}


// Validate email format with regex
helpers.validateEmailFormat=function(email, callback) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

        
helpers.validateEmail = function (email, callback) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (re.test(email)) {
        const options = {
            "method": "POST",
            "hostname": "community-neutrino-email-validate.p.rapidapi.com",
            "port": null,
            "path": "/email-validate",
            "headers": {
                "content-type": "application/x-www-form-urlencoded",
                'x-rapidapi-key': config.neutrinoEmailValidate.api_key,
                'x-rapidapi-host': config.neutrinoEmailValidate.api_host,
                "useQueryString": true
            }
        };

        const req = https.request(options, function (res) {
            const chunks = [];

            res.on("data", function (chunk) {
                chunks.push(chunk);
            });

            res.on("end", function () {
                const body = Buffer.concat(chunks);
                callback(false, helpers.parseJsonToObject(body.toString()));
            });
        });

        req.write(qs.stringify({ email: email }));
        req.end();
    }else{
        callback("Invalid email format. Should be like user@some.domain");
    }
}


// Get the string content of a template
helpers.getTemplate = function (templateName, data, callback) {
    // Validate templateName. should be string end not empty
    templateName = typeof (templateName) == 'string' && templateName.length > 0 ? templateName : false;
    data = typeof (data) == 'object' && data != null ? data : {};

    if (templateName) {
        const templateDir = path.join(__dirname, '/../templates/');
        fs.readFile(templateDir + templateName + '.html', 'utf8', function (err, str) {
            if (!err && str && str.length > 0) {
                // do interpolation on the string
                const finalString = helpers.interpolateTemplateData(str, data);
                callback(false, finalString);
            } else {
                console.log("Error reading template file: " + templateName);
                callback("Error reading template file: "+templateName);
            }
        });
    } else {
        callback("Given template name is invalid");
    }
}

helpers.getLaidOutTemplate = function (templateName, data, callback, layout) {
    // validate parameters
    // if layout == undefined => default _layout
    // if layout == true => default _layout
    layout = layout===undefined || layout===true ? '_layout' 
            :layout===false ? false
            :layout;

    // Read in a template as a string
    helpers.getTemplate(templateName, data, function (err, strHtml) {
        if (!err && strHtml) {
            // if layout specificaly equal false than ignore layouting
            if(layout===false){
                // callback template without layout
                callback(false,strHtml);
            }else{
                // layout data
                const layoutData = Object.assign({ '@content': strHtml },data);
                // add specified layout 
                helpers.getTemplate(layout, layoutData, function (err, strHtml) {
                    if (!err && strHtml) {
                        callback(false, strHtml);
                    } else {
                        callback(err, strHtml);
                    }
                });
            }
        } else {
            callback(err, strHtml);
        }
    });
}

// Take in a string and a data object and find/replace all the keys in it
helpers.interpolateTemplateData = function (str, data) {
    str = typeof (str) == 'string' && str.length > 0 ? str : '';
    data = typeof (data) == 'object' && data != null ? data : {};

    const finalData = Object.assign(
        helpers.flatten(data),
        helpers.flatten(config.templateGlobals, ['global'])
    );

    // for each key in the data object, insert its value into the string at the correspondent placeholder 
    for (var key in finalData) {
        if (finalData.hasOwnProperty(key) && typeof (finalData[key] == "string")) {
            var replace = finalData[key];
            var find = '{' + key + '}';
            str = str.replace(new RegExp(find,"g"), replace);
        }
    }
    return str;
}

/*
 * @see https://docs.mongodb.com/manual/core/document/#dot-notation
 */
helpers.flatten = function (obj, prefix, current) {
    prefix = prefix || []
    current = current || {}

    // Remember kids, null is also an object!
    if (typeof (obj) === 'object' && obj !== null) {
        Object.keys(obj).forEach(key => {
            this.flatten(obj[key], prefix.concat(key), current)
        })
    } else {
        current[prefix.join('.')] = obj
    }

    return current
}

module.exports = helpers;