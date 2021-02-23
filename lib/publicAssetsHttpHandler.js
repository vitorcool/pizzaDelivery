/*
*  http handler for publicAssets requests.
*  response will deliver content of publicAsset name located at defined path 
*/



// Dependencies
const path = require('path');
const fs = require('fs');


// Define PublicAssets handler class
class PublicAssetsHandler {


    constructor(routePath, filePath) {
        // default publicAssets path 
        this._routePath = 'public/';

        this._filePath = path.join(__dirname+'/../', 'public/');
        //path.dirname(require.main.filename) + '\\public\\';

        // map/dictionary/what ever file extension must have contentType or else Public Asset Handler do not serve
        this._mapFileExt2ContentType = {
            '.html': 'html',
            '.css': 'css',
            '.png': 'png',
            '.jpg': 'jpg',
            '.ico': 'favicon',
            '.js': 'javascript',
            '.svg': 'svg',
            '.svgx': 'svg',
        };
        this.withRoutePath(routePath);
        this.withFilePath(filePath);
    }

    withRoutePath(routePath) {
        this._routePath = typeof (routePath) == "string" && routePath.length > 0 ? routePath : this._routePath;
    }

    withFilePath(filePath) {
        this._filePath = typeof (filePath) == "string" && filePath.length > 0 ? filePath : this._filePath;
    }

    // Public assets
    get() {
        const me = this;
        return function (data, callback) {
            // Reject all not equal to GET method
            if (data.method == 'get') {
                // Get the filename being requested
                const trimmedAssetName = data.trimmedPath.replace(me._routePath, '').trim();
                if (trimmedAssetName.length > 0) {
                    // Read in the asset's data
                    me.getStaticAsset(trimmedAssetName, function (err, data) {
                        if (!err && data) {
                            //get asset file name extension
                            const ext = path.parse(trimmedAssetName).ext;
                            // @DELETED Check  the content type (or else default it to plain text)

                            // if File Extension not Mapped HARDCODE@_mapFileExt2ContentType do not serve
                            if (typeof (me._mapFileExt2ContentType[ext]) == 'string') {
                                var contentType = me._mapFileExt2ContentType[ext];
                                // Callback the data
                                callback(200, data, contentType);
                            } else {
                                callback(500, { Error: "static asset extension not mapped" });
                            }


                        } else {
                            callback(500, { Error: "Could not get static asset" });
                        }
                    })
                } else {
                    callback(404);
                }

            } else {
                callback(405);
            }
        }
    };

    // Get the fileName content located at _filePath
    getStaticAsset(fileName, callback) {
        fileName = typeof (fileName) == 'string' && fileName.length > 0 ? fileName : false;
        if (fileName) {
            fileName = path.join(this._filePath, fileName);
            fs.readFile(fileName, function (err, data) {
                if (!err && data) {
                    callback(false, data);
                } else {
                    callback("No file could be found");
                }
            })
        } else {
            callback('A valid file name was not specified');
        }
    }
}


// create instance of PublicAssetHandlerhandler 
const createPublicAssetsHandler = function (routePath, filePath) {
    return (new PublicAssetsHandler(routePath, filePath)).get();
}

module.exports = {
    createPublicAssetsHandler: createPublicAssetsHandler,
};