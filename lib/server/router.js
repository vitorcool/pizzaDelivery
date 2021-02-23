/*
*   Router - mapping user url to some handler
*
*/

const handlers = require('../handlers');

const router = {
  // Static files
  'public': handlers.public,
  // html
  '': handlers.index,
  'account/create': handlers.accountCreate,
  'account/edit': handlers.accountEdit,
  'account/deleted': handlers.accountDeleted,
  'session/create': handlers.sessionCreate,
  'session/deleted': handlers.sessionDeleted,
  //@TODO list pizzas, onclick pizza buy button, add pizza to shoppingCard, links(shoppingCard,Order)
  'menu': handlers.pizzaList, 
  'shoppingCardPaymentConfirmation': handlers.shoppingCardPaymentConfirmation,
  // api
  'api/users' : handlers.users,
  'api/tokens': handlers.tokens,
  'api/pizzas': handlers.pizzas,
  'api/shoppingcard': handlers.user_shoppingCard,
  // 'api/shoppingcard/order': handlers.user_shoppingCard_order,
  'api/shoppingcard/pay': handlers.user_shoppingCard_pay,
  'api/shoppingcard/pay/confirm': handlers.user_shoppingCard_pay_confirm,
  'api/addresses' : handlers.addresses,
  
  // other
  'ping'  : handlers.ping,
  'examples/error': handlers.examplesError,
};


module.exports = {
    handlers: handlers,
    router: router
}