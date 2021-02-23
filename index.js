/*
* Primary file of the API Pizza delivery
*
*/

// Dependencies
const helpers = require('./lib/helpers');
const server = require('./lib/server');
const cli = require('./lib/cli');

// Declare the app
app = {};
// Init function
app.init = function(){
    // Start the server
    server.init();

	// Start the CLI, but make sure it starts last
    setTimeout(function(){
        cli.init();
        //test
        //cli.responders.help.call(cli,"xx");
    },50);
};

// Execute
app.init();


// Export the app
module.exports = app;