/*
* http handler for html request and response with definable template and data
*
*/

// Dependencies
const getLaidOutTemplate = require('./helpers').getLaidOutTemplate;
const util = require('util');
const debug = util.debuglog('handlers');


// Definition of HtmlHandler Class
// model extracted from mentor - guess who...
class HtmlHttpHandler{
    
    // #templateName: Used to locate template file name, assign html.body.class name,
    #templateName = "";
    // #templateData: Object with data to be interpolated
    #templateData = {};
    
    #layout = '_layout';

    constructor(templateName, templateData, layout) {
        this.withTemplate(templateName);
        this.withData(templateData);
        this.withLayout(layout);
    }

    withTemplate = function (name) {
        this.#templateName = typeof (name) == 'string' && name.length > 0 ? name : this.#templateName;
        return this;
    }

    withData = function (data) {
        this.#templateData = typeof (data) == 'object' && data != null ? data : this.#templateData;
        return this;
    }

    withLayout = function (layout) {
        this.#layout = typeof (layout) == 'string' || typeof (layout) == 'boolean' || layout == undefined ? layout : undefined;
        return this;
    }

    get = function () {
        const me=this;
        return function (data, callback) {
            // Reject all request that isn't a GET
            if (data.method == 'get') {

                const data = Object.assign(me.#templateData, {
                    'body.class': me.#templateName,   // body.class with be equal to templateName                
                });

                // Read in a template as a string
                getLaidOutTemplate(me.#templateName, data, function (err, strHtml) {
                    if (!err && strHtml) {
                        if (!err && strHtml) {
                            callback(200, strHtml, 'html');
                        } else {                            
                            callback(500, undefined, 'html');
                        }
                    } else {          
                        console.log(err);
                        callback(500, err, 'html');
                    }
                }, me.#layout);

            } else {
                callback(405, undefined, 'html');
            }
        }
    }

};


const createHtmlHttpHandler = function (templateName, templateData, layout){
    return (new HtmlHttpHandler(templateName, templateData, layout)).get();
}

module.exports = {
    createHtmlHttpHandler: createHtmlHttpHandler,    
};
