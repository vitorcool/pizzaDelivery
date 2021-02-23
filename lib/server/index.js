/*
* Server-related tasks
*
*/


// Dependencies
const http = require('http');
const https = require('https');
const fs = require('fs');
const config = require('../config');
const helpers = require('../helpers');
const unifiedServer = require('./unifiedServer');


const httpsCertsPath = require('path').normalize(__dirname+'/../../https/');
var key = fs.readFileSync(httpsCertsPath+ "localhost.key");
var cert = fs.readFileSync(httpsCertsPath+"localhost.crt");



// Instantiate the server module object
const _server = {};

_server.httpsServerOptions = {
  key: key,
  cert: cert
};

_server.httpServer = http.createServer((req, res) => {
    //res.end('Hello World.');
    unifiedServer(req,res);
 });
_server.httpsServer = https.createServer(_server.httpsServerOptions, (req, res) => {
    //res.end('Hello World.');
    unifiedServer(req,res);
 });

_server.init = function(options,callback){
  // validate arguments
  options = typeof(options) == 'object' && options!=null ? options: {};
  options.httpPort = options.httpPort ? options.httpPort : config.httpPort;
  options.httpsPort = options.httpsPort ? options.httpsPort : config.httpsPort;
  callback=typeof(callback)=='function'?callback:function(){}

  // Start http server
  _server.httpServer.listen(options.httpPort, () => {
    console.log('\x1b[36m%s\x1b[0m', "Http server listing on port : " + options.httpPort);
  
    // Start https server
    _server.httpsServer.listen(options.httpsPort, () => {
      console.log('\x1b[35m%s\x1b[0m', "Https server listing on port : " + options.httpsPort);
      callback();
    });    
  });

  
}

module.exports = _server;