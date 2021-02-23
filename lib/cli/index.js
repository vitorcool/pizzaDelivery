/*
* CLI-Related tasks
*
*/


const readline = require("readline");
const util = require("util");
const debug = util.debuglog('cli');

const events = require("events");
class _events extends events{

}
const e = new _events();

// Instanciate de CLI module object
const cli = {};

// import responders
cli.responders = require('./responders');



cli.commands = {
    'exit': {
        description: 'Kill de CLI and rest of the application',
        execute: function () {
            console.log("bye");
            process.exit(0);
        }
    },
    'man': {
        description: 'Show this help page',
        execute: cli.responders.help
    },
    'help': {
        description: 'Alias of the "man"command',
        execute: cli.responders.help
    },
    'stats': {
        description: 'Get statistics on the underlying operating system and resource utilization',
        execute: cli.responders.stats
    },
    'list users': {
        switches : ['--24h'],
        description: 'Show a list of all the registered (undeleted) users in the system. The flag --24h filter users signed up in the last 24 hours',
        execute: cli.responders.listUsers
    },
    'more user info': {
        switches : ['--{userId}'],
        description: 'Show details of a specified user',
        execute: cli.responders.moreUserInfo
    },
    'list menu': {
        description: 'Show a list of all items of menu',
        execute: cli.responders.listMenu
    },
    'list orders': {
        switches : ['--24h'],
        description: 'Show a list of all orders. The flag --24h filter orders to those placed in the last 24 hours',
        execute: cli.responders.listOrders
    },
    'more order info':{
        switches: ['--{orderId}'],
        description: 'Show details of a specified order',
        execute: cli.responders.moreOrderInfo
    },

};

// Input handlers
Object.keys(cli.commands).forEach(function(command){
    const execute=cli.commands[command].execute;
    e.on(command,function(str){
        execute.call(cli,str);
    });
});


// Input Processor
cli.processInput=function(str){
    str = typeof(str) == 'string' && str.trim().length>0 ? str.trim().toLowerCase(): false;
     
    // process input if any, otherwire ignore it
    if(! str){ 
        return;
    }
    
    
    // Codify the unique string that identify the unique questions allowed to be asked
    const uniqueInputs = Object.keys(cli.commands);

    // itherate possible inputs and emit an event when match is found
    var matchFound = false;
    var counter = 0;
    uniqueInputs.some(function(input){
        if (str.indexOf(input) > -1) {
            matchFound = true;
            // emit an event matching the unique input, and include th full string given
            /* debug({
                method:"cli.processInput", 
                param: str
            }); */
            e.emit(input, str);
            return true;
        }
    });

    // if not match found, tell the user to try again
    if(!matchFound){
        console.log("Sorry, try again");
    }

}

// Init script
cli.init = function() {
    // Send de start message to the console, in dark blue
    console.log('\x1b[34m%s\x1b[0m', "The CLI is running");

    // Start the interface
    var _interface = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '>',
    });

    // Create a initial prompt
    _interface.prompt();

    // Handle each line of input separately
    _interface.on('line',function(str){
        // Send to the input processor        
        cli.processInput(str);

        // Reinitialize the prompt afterwards
        _interface.prompt();
    });

    // if the  user stops the CLI, kill the associated process
    _interface.on('close',function(){
        process.exit(0);
    });

}




// Exports de module
module.exports = cli;
