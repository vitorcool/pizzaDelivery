/*
* template <issue> handler
*
*/

// Dependencies
const helpers = require('../../helpers');
const util = require('util');
const debug = util.debuglog('handlers');

// Define <issue> handler container
const index = {};

// http handler for <issue>
index.handler = function (data, callback) {
    // Reject all request that isn't a GET
    if (data.method == 'get') {

        // prepare data for interpolation
        var templateData = {
            head: {
                title: 'Detail <issue>',
                description: 'description of <issue>',
            },
            body: {                
                class: 'index',
            }
        };

        // Read in a template as a string
        helpers.getLaidOutTemplate('index', templateData, function (err, strHtml) {
            if (!err && strHtml) {
                if (!err && strHtml) {
                    callback(200, strHtml, 'html');
                } else {                    
                    callback(500, undefined, 'html');
                }                
            } else {                
                callback(500, undefined, 'html');
            }
        },'default');

    } else {
        callback(405, undefined, 'html');
    }
}



module.exports.handler = index.handler;