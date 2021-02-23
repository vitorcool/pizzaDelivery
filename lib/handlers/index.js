/*
* request handlers
*
*/

// Dependencies
const createHtmlHandler = require('../hmlHttpHandler').createHtmlHttpHandler;


// Define request Router
const handlers = {};

// Declared HTML handlers
handlers.index = createHtmlHandler("index",{
    'head.title': 'Pizza Delivery - service',
    'head.description': 'A Simple way of getting Pizza near by',
    
  //  'body.class': 'index'    
});
handlers.accountCreate = createHtmlHandler("accountCreate",{
    'head.title': 'Create an account',
    'head.description': 'Signup is easy and only takes a few seconds.',
//    'body.class' : 'accountCreate',
});
handlers.accountEdit = createHtmlHandler("accountEdit", {
    'head.title': 'Account Setting',
    //'body.class': 'accountEdit',
});
handlers.accountDeleted = createHtmlHandler("accountDeleted", {
    'head.title': 'Account Deleted',
    'head.description': 'Your account has been deleted',
});
handlers.sessionCreate = createHtmlHandler("sessionCreate", {
    'head.title': 'Login to your Account',
    'head.description': 'Please enter your phone number and password to access your accountSignup is easy and only takes a few seconds.',
  //  'body.class': 'sessionCreate',
});
handlers.sessionDeleted= createHtmlHandler("sessionDeleted", {
    'head.title': 'Session Deleted',
    'head.description': 'Your session has been deleted',
});
handlers.pizzaList = createHtmlHandler("menu", {
    'head.title': 'Menu Pizza',
    'head.description': 'Add some pizza to your shopping card',
});        

handlers.shoppingCardPaymentConfirmation = require("./html/shoppingCardPaymentConfirmation").handler;

// Declared API handlers 

handlers.users = require('./api/users').handler;
handlers.tokens= require('./api/tokens').handler;
handlers.user_shoppingCard = require('./api/shoppingCard').handler;
//handlers.user_shoppingCard_order = require('./api/shoppingCard_order').handler;
handlers.user_shoppingCard_pay = require('./api/shoppingCard_pay').handler;
handlers.user_shoppingCard_pay_confirm = require('./api/shoppingCard_pay_confirm').handler;
handlers.addresses = require('./api/addresses').handler;

handlers.pizzas= require('./api/pizzas').handler;
require('./api/pizzas').createStore(function(err){
    if(err)
        console.log(log);
});

// Public Assets handler
const createPublicAssetsHandler = require('../publicAssetsHttpHandler').createPublicAssetsHandler;
handlers.public = createPublicAssetsHandler('public/');

// Ping handler
handlers.ping = function(data,callback){
    callback(200,{'ping':'pong'});
};

handlers.notFound = function(data,callback){
    callback(404,{Error: 'Not found'}); 
};

handlers.examplesError = function(data,callback){
    var error = new Error('This is an example error');
    throw(error);
};

// Export 
module.exports = handlers;