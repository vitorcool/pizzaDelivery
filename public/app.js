/*
 * Frontend Logic for application
 *
 */


// Container for frontend application
var app = {};

app.PIZZA_PATH= '/menu';


// Config
app.config = {
    'sessionToken': false
};


// AJAX Client (for RESTful API)
app.client = {}

// Interface for making API calls
app.client.request2 = function ( options, callback) {
    options = {
        headers: options.headers || undefined,
        path: options.path || undefined,
        method: options.method || undefined,
        queryStringObject: options.queryStringObject || undefined,
        payload: options.payload || undefined,
    };

    app.client.request(options.headers, options.path, options.method, options.queryStringObject, options.payload, callback);
}

app.client.request = function (headers, path, method, queryStringObject, payload, callback) {

    // Set defaults
    headers = typeof (headers) == 'object' && headers !== null ? headers : {};
    path = typeof (path) == 'string' ? path : '/';
    method = typeof (method) == 'string' && ['POST', 'GET', 'PUT', 'DELETE'].indexOf(method.toUpperCase()) > -1 ? method.toUpperCase() : 'GET';
    queryStringObject = typeof (queryStringObject) == 'object' && queryStringObject !== null ? queryStringObject : {};
    payload = typeof (payload) == 'object' && payload !== null ? payload : {};
    callback = typeof (callback) == 'function' ? callback : false;

    // For each query string parameter sent, add it to the path
    var requestUrl = path + '?';
    var counter = 0;
    for (var queryKey in queryStringObject) {
        if (queryStringObject.hasOwnProperty(queryKey)) {
            counter++;
            // If at least one query string parameter has already been added, preprend new ones with an ampersand
            if (counter > 1) {
                requestUrl += '&';
            }
            // Add the key and value
            requestUrl += queryKey + '=' + queryStringObject[queryKey];
        }
    }

    // Form the http request as a JSON type
    var xhr = new XMLHttpRequest();
    xhr.open(method, requestUrl, true);
    xhr.setRequestHeader("Content-type", "application/json");

    // For each header sent, add it to the request
    for (var headerKey in headers) {
        if (headers.hasOwnProperty(headerKey)) {
            xhr.setRequestHeader(headerKey, headers[headerKey]);
        }
    }

    // If there is a current session token set, add that as a header
    if (app.getSession("token")) {
        xhr.setRequestHeader("token", app.getSession("token").id);
    }

    // When the request comes back, handle the response
    xhr.onreadystatechange = function () {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            var statusCode = xhr.status;
            var responseReturned = xhr.responseText;

            // Callback if requested
            if (callback) {
                try {
                    var parsedResponse = JSON.parse(responseReturned);
                    callback(statusCode, parsedResponse);
                } catch (e) {
                    callback(statusCode, false);
                }

            }
        }
    }

    // Send the payload as JSON
    var payloadString = JSON.stringify(payload);
    xhr.send(payloadString);

};

app.bindGeoLocationButton=function () {
    document.getElementById("geolocationButton").addEventListener("click", function (e) {

        // Stop it from redirecting anywhere
        e.preventDefault();

        // Get GPS coors
        app.getDeviceGpsLocation(function(location){
            const inputElement = document.querySelector("input#address");
            //enabled spinner to give user feedback of background work
            inputElement.parentNode.querySelector(".fa-spinner").classList.add("fa-spin");

            // define search term form ReverseGeoLocation
            const search = location.coords.latitude + "," + location.coords.longitude;
            app.searchAddress({ "location": search }, function (err, data) {
                data = typeof (data) == 'string' ? JSON.parse(data) : data;
                const callback = function (err,data) {
                    //disable spinner to give user feedback of terminated background work                    
                    inputElement.parentNode.querySelector(".fa-spinner").classList.remove("fa-spin");
                    // Trigger autocomplete event with ReverseGeoLocation data (list of concurrent addresses at GPS given coors)
                    inputElement.dispatchEvent(new CustomEvent("autocomplete",{"detail":{err: err, data: data}}));
                };
                if (!err && typeof (data) == 'object' && data.results instanceof Array) {
                    const addresses = data.results.map(function (place) {
                        return place.address
                    });
                    callback(false, {
                        addresses:addresses,
                        data:data.results,
                    });
                } else {
                    // ignore error
                    callback(err);
                }
            });
            
        });

    });
}


// for each specified interval 
//      observe if editable address has changed and...
//          @todo load near by pizza menu. (based of address)
//          load shoppingcard 
app.bindGetMenuLoop=function() {
    //document.getElementById("getMenuButton").addEventListener("click", function (e) {
    //// Stop it from redirecting anywhere
    //    e.preventDefault();

    setInterval(function(){

        const currentAddress = document.querySelector("input#address").value;

        if(currentAddress !== app.lastAddress){
            // Get pizzaMenu
            app.loadPizzaMenu(currentAddress);
        
            // Get shoppingCard();
            app.loadShoppingCard(currentAddress);
            app.lastAddress = currentAddress;
            app.setSession("deliveryAddress", currentAddress);
        }

    },600);
}


app.bindPayButtton=function() {

    const payButton = document.querySelector("#pay-button");
    payButton.addEventListener("click", function (e) {

        // Stop it from redirecting anywhere
        e.preventDefault();
  
        
        // Fixed delivery Address
        const deliveryAddress = document.querySelector("#fixAddress #address").value;

        // <pizza delivery> payment Intent     
        app.client.request2({
            path: '/api/shoppingcard/pay',
            method: 'POST',
            payload: {
                address: deliveryAddress
            },

        }, function (statusCode, paymentIntentData) {
            // Display an error on the form if needed
            if (statusCode == 200) {
                window.location = "/shoppingCardPaymentConfirmation/?id=" + paymentIntentData.id;
            } else if (statusCode == 403) {
                // log the user out
                app.logUserOut();
            }else{
                console.log(status,paymentIntentData);
            }            
        });
    
    });
}


// Bind the logout button
app.bindLogoutButton = function () {
    document.getElementById("logoutButton").addEventListener("click", function (e) {

        // Stop it from redirecting anywhere
        e.preventDefault();

        // Log the user out
        app.logUserOut();

    });
};

// Log the user out then redirect them
app.logUserOut = function (redirectUser) {
    // Set redirectUser to default to true
    redirectUser = typeof (redirectUser) == 'boolean' ? redirectUser : true;

    // Get the current token id
    var tokenId = typeof (app.getSession("token").id) == 'string' ? app.getSession("token").id : false;

    if(tokenId){
        // Send the current token to the tokens endpoint to delete it
        var queryStringObject = {
            'id': tokenId
        };
        app.client.request(undefined, '/api/tokens', 'DELETE', queryStringObject, undefined, function (statusCode, responsePayload) {
            // Set token to false
            app.setSession("token",false);

            // Send the user to the logged out page
            if (redirectUser) {
                window.location = '/session/deleted';
            }

        });
    }else{
        // Send the user to the logged out page
        if (redirectUser) {
            window.location = '/session/deleted';
        }        
    }
};

// Bind the forms
app.bindForms = function () {
    if (document.querySelector("form")) {

        var allForms = document.querySelectorAll(".formWrapper form");
        for (var i = 0; i < allForms.length; i++) {
            // Bind FORM SUBMIT hander
            // 
            allForms[i].addEventListener("submit", function (e) {

                // Stop it from submitting
                e.preventDefault();

                var formId = this.id;
                var path = this.action;
                var method = this.method.toUpperCase();

                // Hide the error message (if it's currently shown due to a previous error)
                document.querySelector("#" + formId + " .formError").style.display = 'none';

                // Hide the success message (if it's currently shown due to a previous error)
                if (document.querySelector("#" + formId + " .formSuccess")) {
                    document.querySelector("#" + formId + " .formSuccess").style.display = 'none';
                }


                // Turn the inputs into a payload
                var payload = {};
                var elements = this.elements;
                for (var i = 0; i < elements.length; i++) {
                    if (elements[i].type !== 'submit') {
                        // Determine class of element and set value accordingly
                        var classOfElement = typeof (elements[i].classList.value) == 'string' && elements[i].classList.value.length > 0 ? elements[i].classList.value : '';
                        var valueOfElement = elements[i].type == 'checkbox' && classOfElement.indexOf('multiselect') == -1 ? elements[i].checked : classOfElement.indexOf('intval') == -1 ? elements[i].value : parseInt(elements[i].value);
                        var elementIsChecked = elements[i].checked;
                        // Override the method of the form if the input's name is _method
                        var nameOfElement = elements[i].name;
                        if (nameOfElement == '_method') {
                            method = valueOfElement;
                        } else {
                            // Create an payload field named "method" if the elements name is actually httpmethod
                            if (nameOfElement == 'httpmethod') {
                                nameOfElement = 'method';
                            }
                            // Create an payload field named "id" if the elements name is actually uid
                            if (nameOfElement == 'uid') {
                                nameOfElement = 'id';
                            }
                            // If the element has the class "multiselect" add its value(s) as array elements
                            if (classOfElement.indexOf('multiselect') > -1) {
                                if (elementIsChecked) {
                                    payload[nameOfElement] = typeof (payload[nameOfElement]) == 'object' && payload[nameOfElement] instanceof Array ? payload[nameOfElement] : [];
                                    payload[nameOfElement].push(valueOfElement);
                                }
                            } else {
                                payload[nameOfElement] = valueOfElement;
                            }

                        }
                    }
                }

                // If the method is DELETE, the payload should be a queryStringObject instead
                var queryStringObject = method == 'DELETE' ? payload : {};

                // Call the API
                app.client.request(undefined, path, method, queryStringObject, payload, function (statusCode, responsePayload) {
                    // Display an error on the form if needed
                    if (statusCode !== 200) {

                        if (statusCode == 403) {
                            // log the user out
                            app.logUserOut();

                        } else {

                            // Try to get the error from the api, or set a default error message
                            var error = typeof (responsePayload.Error) == 'string' ? responsePayload.Error : 'An error has occured, please try again';

                            // Set the formError field with the error text
                            document.querySelector("#" + formId + " .formError").innerHTML = error;

                            // Show (unhide) the form error field on the form
                            document.querySelector("#" + formId + " .formError").style.display = 'block';
                        }
                    } else {
                        // If successful, send to form response processor
                        app.formResponseProcessor(formId, payload, responsePayload);
                    }

                });
            });
        }
    }
};

// Form response processor
app.formResponseProcessor = function (formId, requestPayload, responsePayload) {
    var functionToCall = false;
    // If account creation was successful, try to immediately log the user in
    if (formId == 'accountCreate' || formId == 'accountEdit2') {
        // Take the email and password, and use it to log the user in
        var newPayload = {
            'email': requestPayload.email,
            'password': requestPayload.password
        };

        app.client.request(undefined, '/api/tokens', 'POST', undefined, newPayload, function (newStatusCode, newResponsePayload) {
            // Display an error on the form if needed
            if (newStatusCode !== 200) {

                // Set the formError field with the error text
                document.querySelector("#" + formId + " .formError").innerHTML = 'Sorry, an error has occured. Please try again.';

                // Show (unhide) the form error field on the form
                document.querySelector("#" + formId + " .formError").style.display = 'block';

            } else {
                // If successful, set the token and redirect the user
                app.setSession("token",newResponsePayload);
                window.location = app.PIZZA_PATH;
            }
        });
    }
    // If login was successful, set the token in localstorage and redirect the user
    if (formId == 'sessionCreate') {
        app.setSession("token",responsePayload);
        window.location = app.PIZZA_PATH;
    }

    // If forms saved successfully and they have success messages, show them
    var formsWithSuccessMessages = ['accountEdit1', 'accountEdit2', 'checksEdit1'];
    if (formsWithSuccessMessages.indexOf(formId) > -1) {
        document.querySelector("#" + formId + " .formSuccess").style.display = 'block';
    }

    // If the user just deleted their account, redirect them to the account-delete page
    if (formId == 'accountEdit3') {
        app.logUserOut(false);
        window.location = '/account/deleted';
    }

    // If the user just created a new check successfully, redirect back to the dashboard
    if (formId == 'checksCreate') {
        window.location = app.PIZZA_PATH;
    }

    // If the user just deleted a check, redirect them to the dashboard
    if (formId == 'checksEdit2') {
        window.location = app.PIZZA_PATH;
    }

    // Redirect to dashboard after user change check
    // If the user just deleted a check, redirect them to the dashboard
    if (formId == 'checksEdit2' || formId == 'checksEdit1') {
        window.location = app.PIZZA_PATH;
    }
};

// Get the session value of given key from localstorage and set it in the app.config object
app.getSession = function (key) {
    const storeKey = "session" + key.charAt(0).toUpperCase() + key.slice(1)
    var storedValue = localStorage.getItem(storeKey);
        
    var value = undefined; // default 
    if (typeof (storedValue) == 'string') {
        try {
            value = JSON.parse(storedValue);         
        } catch (e) {
            value = storedValue;
        }
    }

    if (key == "token") {
        if (typeof (value) == 'object') {
            app.setLoggedInState(true);
        } else {
            app.setLoggedInState(false);
        }
    }

    return value;
};

// Set (or remove) the loggedIn class from the body
app.setLoggedInState = function (add) {
    var target = document.querySelector("body");
    if (add) {
        target.classList.add('loggedIn');
        target.classList.remove('loggedOut');
    } else {
        target.classList.remove('loggedIn');
        target.classList.add('loggedOut');
    }
};

// Set the session key with value in the app.config object as well as localstorage
app.setSession = function (key,value) {
    const str =
        typeof(value) == 'object' ? JSON.stringify(value) : value
    const storeKey = "session"+key.charAt(0).toUpperCase() + key.slice(1)    
    localStorage.setItem(storeKey, str);

    // when stored token update then toggle LoggedIn class
    if (key=='token'){
        const loggedIn = typeof (value) == 'object';
        app.setLoggedInState(loggedIn);
    } 
};


// Renew the token
app.renewToken = function (callback) {
    var currentToken = app.getSession("token"); //typeof (app.config.sessionToken) == 'object' ? app.config.sessionToken : false;

    if (currentToken) {
        // Update the token with a new expiration
        var payload = {
            'id': currentToken.id,
            'extend': true,
        };
        app.client.request(undefined, '/api/tokens', 'PUT', undefined, payload, function (statusCode, responsePayload) {
            // Display an error on the form if needed
            if (statusCode == 200) {
                // Get the new token details
                var queryStringObject = { 'id': currentToken.id };
                app.client.request(undefined, '/api/tokens', 'GET', queryStringObject, undefined, function (statusCode, responsePayload) {
                    // Display an error on the form if needed
                    if (statusCode == 200) {
                        app.setSession('token',responsePayload);
                        callback(false);
                    } else {
                        app.setSession('token',false);
                        callback(true);
                    }
                });
            } else {
                app.setSession('token',false);
                callback(true);
            }
        });
    } else {
        callback(true);
    }
};

// restoreAddress 
// set input#address with:
// 1.try with app.getSession("deliveryAddress")
// 2.try with user.address
app.restoreAddress=function(callback){
    callback=typeof(callback)=='function'?callback:function(){};

    // grab stored session variable named deliveryAddress to set UI address
    const deliveryAddress = app.getSession("deliveryAddress");
    if (deliveryAddress) {
        document.querySelector("#address").value = deliveryAddress;
        callback(deliveryAddress);
    } else {
        // Get the email from the current token, or log the user out if none is there
        var email = typeof (app.getSession("token").email) == 'string' ? app.getSession("token").email : false;

        // End session if sessionToken invalid
        if (!email) {            
            app.logUserOut();
            // no need for callback cause app.logUserOut() with reload page
        }

        // Fetch the user data
        var queryStringObject = {
            'email': email
        };
        app.client.request(undefined, '/api/users', 'GET', queryStringObject, undefined, function (statusCode, responsePayload) {            
            if (statusCode == 200) {
                // set UI address value with user.address
                document.querySelector("#address").value = responsePayload.address;
                // store session variable deliveryAddress 
                app.setSession("deliveryAddress", responsePayload.address);
                callback(responsePayload.address);                
            } else if( statusCode == 403){
                // log the user out
                app.logUserOut();
            }else{
                callback();                
            }
        });
    }

}

app.getBodyClass=function(){
    // Get the current page from the body class
    var bodyClasses = document.querySelector("body").classList;
    var primaryClass = typeof (bodyClasses[0]) == 'string' ? bodyClasses[0] : false;
    return primaryClass;
}
// bind specific to page After html page load
app.loadDataOnPage = function () {
    // Get the current page from the body class
    var bodyClass = app.getBodyClass();

    // Run Page specific things
    try{
        ({
            'index': function(){
                // bind speedLink
                document.querySelectorAll("speedLink").forEach(function(el){
                    const cl = el.classList;
                    if(cl.contains("sl-signup")){
                        //
                    } else if (cl.contains("sl-signup")) {
                    } else if (cl.contains("sl-menu")) {
                    }
                });
            },
            'menu': function(){
                app.restoreAddress();
                app.bindGeoLocationButton();
                app.bindGetMenuLoop();
                app.bindPayButtton();

                const inputAddress = document.querySelector("#address");
                app.loadAddressAutoComplete(inputAddress);                
                
            },
            accountEdit: function() {
                app.loadAccountEditPage();
                const inputAddress = document.querySelector("#address");
                app.loadAddressAutoComplete(inputAddress);
                app.bindGeoLocationButton();
            },
            
            accountCreate: function() {
                const inputAddress = document.querySelector("#address");
                app.loadAddressAutoComplete(inputAddress);
                app.bindGeoLocationButton();
            },

        })[bodyClass]()
        console.log(bodyClass+" loaded");
    }catch(e){
        console.log(bodyClass + " nothing to loaded");
    }

}

app.loadAddressAutoComplete = function (inputElement){
    inputElement = typeof(inputElement) == 'object' && inputElement instanceof Element ? inputElement : false;
    
    if(!inputElement){
        throw "Missing required parameter inputElement";
    }

    helpers.autocomplete(inputElement,function(inputElement, callback ){
        const splitTerm = inputElement.value.split(" ");
        if (splitTerm.length > 1) {

            //enabled spinner to give user feedback of background work
            inputElement.parentNode.querySelector(".fa-spinner").classList.add("fa-spin");
            
            app.searchAddress({"address":inputElement.value}, function (err, data) {                
                data = typeof(data) == 'string'? JSON.parse(data):data;
                const cb=function(err,data){
                    //disable spinner to give user feedback of terminated background work
                    inputElement.parentNode.querySelector(".fa-spinner").classList.remove("fa-spin");
                    
                    callback(err, data);
                };
                if (!err && typeof(data)=='object' && data.results instanceof Array) {                                
                    const addresses = data.results.map(function (place) {
                        return place.address
                    });
                    cb(false, {
                        addresses: addresses,
                        data: data.results,
                    });
                } else {
                    // ignore error
                    cb(err);
                }
            })
        }else{
            callback("Ignoring autocomplete for terms with less them 2 works and for last word less them 2 chars");
        }
    });

    

};

var searchTimer=null;
app.searchAddress = function (searchObj, callback) {
    // clear timer before starts another one
    if (searchTimer != null) {
        clearTimeout(searchTimer);
        searchTimer = null;
    }

    const delayRequest = 500;
    searchTimer = setTimeout(function () {
        searchTimer = null;

        app.client.request(undefined, '/api/addresses', 'GET', searchObj, undefined, function (statusCode, responsePayload) {
            // Callback if requested
            if (callback) {
                try {                    
                    console.log("searchAddress", searchObj, responsePayload);
                    callback(statusCode !== 200, responsePayload);
                } catch (e) {
                    callback(statusCode !== 200, false);
                }

            }
        });
                

    }, delayRequest);
}

app.loadJavaScript = function(url, callback){
    var script = document.createElement('script');
    script.onload = function () {
        callback();
    };
    script.onerror = function () {
        callback("Error loading script: "+url);
    }
    script.src = url;
    document.head.appendChild(script); 
           
}

// Load the pizzaMenu 
app.loadPizzaMenu=function(){
    // Get the email from the current token, or log the user out if none is there
    var email = typeof (app.getSession("token").email) == 'string' ? app.getSession("token").email : false;

    // End session if sessionToken invalid
    if (!email) {
        app.logUserOut();
        return;
    }

    const wrapper = document.querySelector('#menu .itemsWrapper');

    const templateItem = `
                                        <article class="pizzaItem" data-name="{name}">                                            
                                            <header>
                                                <h2>{name}</h2>
                                                <img src="{image}">

                                                <p>
                                                    <span class="bold">Price <a href="#">{price} {currency}</a></span>
                                                    <span class="addPizzaItem">add to card</span>
                                                </p>

                                            </header>
                                            <p>{description}</p>
                                        </article>`;

    app.client.request(undefined, '/api/pizzas', 'GET', { location: undefined }, undefined, function (statusCode, responsePayload) {
        if( statusCode == 403){
            // log the user out
            app.logUserOut();
        }else if(statusCode == 200){
            helpers.renderArr(wrapper, responsePayload || [] , templateItem,{
                events: {
                    'click': function(e){
                        // Stop it from redirecting anywhere
                        e.preventDefault();
                        if (e.target.classList.contains("addPizzaItem")) {
                            app.addPizza2ShoppingCard(e.currentTarget.dataset.name);
                        }
                        
                    }
                }
            });
        }
    });

}


app.addPizza2ShoppingCard = function(name){
    name = typeof(name) == 'string' && name.length>0? name:false;
    
    if(name){
        var newPayload = {
            'name': name,            
        };

        app.client.request(undefined, '/api/shoppingcard', 'POST', undefined, newPayload, function (newStatusCode, newResponsePayload) {
            // Display an error on the form if needed
            if (newStatusCode == 200) {
                app.loadShoppingCard();                
            } else if(newStatusCode == 403 ){
                // log the user out
                app.logUserOut();
            }
        });
    }
}


app.removePizza2ShoppingCard = function(element){
    element = typeof(element) == 'object' && element instanceof Element ? element:false;

    if(element){
        const _idx = element.dataset._idx;
        app.client.request(undefined, '/api/shoppingcard', 'DELETE', {idx:_idx}, undefined, function (newStatusCode, newResponsePayload) {
            // Display an error on the form if needed
            if (newStatusCode == 200) {
                app.loadShoppingCard();
            } else if (newStatusCode == 403) {
                // log the user out
                app.logUserOut();
            }
        });
    }
}

app.loadShoppingCard = function () {
    // Get the email from the current token, or log the user out if none is there
    var email = typeof (app.getSession("token").email) == 'string' ? app.getSession("token").email : false;

    // End session if sessionToken invalid
    if (!email) {
        app.logUserOut();
        return;        
    }

    // wrapper where each element are being added
    const wrapper = document.querySelector('#shoppingCard .itemsWrapper'); 

    // Fetch the user data
    var queryStringObject = {
        'email': email
    };
    // Template used on each element of the shoppingCard
    var templateItem = `
                                <article class="pizzaItem" data-name"{name}">
                                    <span class="closePizzaItem">x</span>
                                    <header>
                                        <h2>{name}</h2>
                                        <img src="{image}">

                                        <p><span class="bold">Price <a href="#">{price} {currency}</a></span></p>
                                    </header>                                  
                                </article>`;
    

    // GET user shoppingCard[] data 
                                    
    app.client.request(undefined, '/api/users', 'GET', queryStringObject, undefined, function (statusCode, responsePayload) {        
        const ok = statusCode == 200;
        // sum total from shoppingCard items
        const payValue = (responsePayload.shoppingCard || []).reduce(function(a, b) {
            return a + b.price;
        },0);
     //   document.querySelector("#payValue").innerHTML = payValue+" usd";

        helpers.renderArr(wrapper, ok ? responsePayload.shoppingCard || [] : [], templateItem, {
            events: {
                'click': function (e) {
                    // Stop it from redirecting anywhere
                    e.preventDefault();
                    if (e.target.classList.contains("closePizzaItem")){
                        app.removePizza2ShoppingCard(e.currentTarget);
                    }
                }
            }
        });
    });
   

}


// Load the account edit page specifically
app.loadAccountEditPage = function () {
    // Get the email from the current token, or log the user out if none is there
    var email = typeof (app.getSession("token").email) == 'string' ? app.getSession("token").email : false;
    if (email) {
        // Fetch the user data
        var queryStringObject = {
            'email': email
        };
        app.client.request(undefined, '/api/users', 'GET', queryStringObject, undefined, function (statusCode, responsePayload) {
            if (statusCode == 200) {
                // Put the data into the forms as values where needed
                document.querySelector("#accountEdit1 .nameInput").value = responsePayload.name;
                document.querySelector("#accountEdit1 .addressInput").value = responsePayload.address;
                document.querySelector("#accountEdit1 .displayEmailInput").value = responsePayload.email;

                // Put the hidden email field into both forms
                var hiddenEmailInputs = document.querySelectorAll("input.hiddenEmailInput");
                for (var i = 0; i < hiddenEmailInputs.length; i++) {
                    hiddenEmailInputs[i].value = responsePayload.email;
                }

            } else {
                // If the request comes back as something other than 200, log the user our (on the assumption that the api is temporarily down or the users token is bad)
                app.logUserOut();
            }
        });
    } else {
        app.logUserOut();
    }
};

// Loop to renew token often
app.tokenRenewalLoop = function () {
    setInterval(function () {
        app.renewToken(function (err) {
            if (!err) {
                console.log("Token renewed successfully @ " + Date.now());
            }
        });
    }, 1000 * 60);
};

// get GPS current location
app.getDeviceGpsLocation=function(callback){
    cb=function(position){        
        if(callback){
            callback(position);
        }
    };
    if (!cb){
        throw("Error: @app.getDeviceGpsLocation - Missing required argument callback");
    }else if(! "geolocation" in navigator) {
        cb("Thiis browser does not suport geolocation");
    }else{
        navigator.geolocation.getCurrentPosition(cb);
    }  
}

// Init (bootstrapping)
app.init = function () {
    // HEADER
    /// Get the token from localstorage
    app.getSession("token");
    /// // Bind logout logout button
    app.bindLogoutButton();

    // CONTENT
    
    /// Bind all form submissions
    app.bindForms();

    /// Set Focus on first form input element
    const firstInput = document.querySelector("input:not(.disabled):not([type=hidden]),textarea:not(.disabled),button:not(.disabled),select:not(.disabled)");
    if(firstInput) firstInput.focus();

        

    // Renew token
    app.tokenRenewalLoop();

    // Load data on page
    app.loadDataOnPage();

};


// Call the init processes after the window loads
window.onload = function () {
    app.init();
};




/* helpers */
helpers = {};
// Take in a string and a data object and find/replace all the keys in it
helpers.interpolateData = function (str, data) {
    str = typeof (str) == 'string' && str.length > 0 ? str : '';
    data = typeof (data) == 'object' && data != null ? data : {};

    const finalData = helpers.flatten(data);

    // for each key in the data object, insert its value into the string at the correspondent placeholder 
    for (var key in finalData) {
        if (finalData.hasOwnProperty(key) && typeof (finalData[key] == "string")) {
            var replace = finalData[key];
            var find = '{' + key + '}';
            str = str.replace(new RegExp(find, "g"), replace);
        }
    }
    return str;
}

helpers.renderArr = function (wrapper, aData, templateItem, binding) {
    wrapper = wrapper instanceof Element ? wrapper : false;
    aData = typeof (aData) == 'object' && aData instanceof Array && aData.length > 0 ? aData : false;
    templateItem = typeof (templateItem) == 'string' && templateItem.length > 0 ? templateItem : false;
    const events = typeof (binding) == 'object' && typeof (binding.events) == 'object' ? binding.events : {};

    if (!wrapper || !aData || !templateItem) {
        console.log("Missing required or invalid parameters", arguments);
        // emppty wrapper
        wrapper.innerHTML = '';
        return;
    }

    function renderItem(data) {
        const ret = helpers.interpolateData(templateItem, data);
        return ret;
    };

    // itherate data while render each item        
    const frag = document.createDocumentFragment();
    (aData || []).forEach(function (item, _idx) {
        aData[_idx]._idx = _idx;
        const html = renderItem(item);
        var rfrag = new DOMParser().parseFromString(html, 'text/html').documentElement;
        rfrag.querySelector("body>*").dataset._idx = _idx;
        // bindings
        //    events
        Object.keys(events).forEach(function (evtName) {
            var evtHandler = events[evtName];
            evtHandler = typeof (evtHandler) == 'function' ? evtHandler : false;
            if (evtHandler) {
                rfrag.querySelector("body>*").addEventListener(evtName, evtHandler);
            }
        });
        frag.appendChild(rfrag.querySelector("body>*"));
    });
    wrapper.innerHTML = "";
    // add new HTML
    wrapper.appendChild(frag);
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

/*the autocomplete function takes two arguments,
    the text field element and a function calling back and array of possible autocompleted values:*/
helpers.autocomplete=function(input, callbackArrFunc) {
    var currentFocus;
    var autocompleteId = input.id + '_' + 'autocomplete-list';
    // Handle event input. triggered when ever input.value is changed
    input.addEventListener("input", function (e) {
        var a, b, i, val = this.value;

        if (!val) { return false; }

        const elem = this;
        callbackArrFunc(input, function (err, data) {
            arrFuncHandler(err, data);
        });
    });
    input.addEventListener("autocomplete", function (e) {
        arrFuncHandler(e.detail.err, e.detail.data);
    });

    
    // arguments (err,data)
    // data : { addresses[string] , data[object]}
    const arrFuncHandler = function (err, data) {
        if(err){
            return;
        }
        // validate data parameters
        const addresses = data instanceof Array ? data:
                          typeof(data) == 'object' && data.addresses instanceof Array ? data.addresses : undefined;
        const addrDetails = typeof (data) == 'object' && data.data instanceof Array && data.addresses.length==data.data.length ? data.data : undefined;

        if (!err && addresses) {
            // close any already open lists of autocompleted values
            closeAllLists();
            // reset focus                 
            currentFocus = -1;
            // find div.autocomplete-items OR create it
            a = document.querySelector("div.autocomplete-items") || document.createElement("DIV");
            a.setAttribute("id", autocompleteId);
            a.setAttribute("class", "autocomplete-items");
            // append the DIV.autocomplete-item element as a child of the specified input element
            input.parentNode.appendChild(a);

            addresses.forEach(function (value, i) {
                //for (i = 0; i < data.length; i++) {
                // Ignore value if equal to specified input value
                if (value.substr(0, value.length).toUpperCase() == value.toUpperCase()) {
                    //  return;
                }
                // create a DIV element for each matching element:
                b = document.createElement("DIV");
                // make the matching letters bold:
                b.innerHTML = "<strong>" + value.substr(0, value.length) + "</strong>";
                b.innerHTML += value.substr(value.length);
                // insert a input field that will hold the current array item's value:
                b.innerHTML += "<input type='hidden' value='" + value + "'>";
                // Handle each "autocomplete item" click event 
                b.addEventListener("click", function (e) {
                    // insert the value for the autocomplete text field:
                    input.value = this.querySelector("input").value;
                    input.dispatchEvent(new CustomEvent("autocomplete:select", { "detail": this.querySelector("input").value }));
                    // close the list of autocompleted values                            
                    closeAllLists();
                });

                if (addrDetails){
                    // store element details at element dataset
                    b.dataset.details = JSON.stringify(addrDetails[i]);
                    a.appendChild(b);
                }

            });
        } else {
            // ignore
        }
    }
    // execute a function presses a key on the keyboard:
    input.addEventListener("keydown", function (e) {
        var x = document.querySelectorAll("#" + autocompleteId + ">div");
        if (e.keyCode == 40) {
            //If the arrow DOWN key is pressed,
            currentFocus++;
            addActive(x);
        } else if (e.keyCode == 38) { //up
            //If the arrow UP key is pressed,                
            currentFocus--;
            addActive(x);
        } else if (e.keyCode == 13) {
            //If the ENTER key is pressed, prevent the form from being submitted,
            e.preventDefault();
            if (currentFocus > -1) {
                //and simulate a click on the "active" item:
                if (x) x[currentFocus].click();
            }
        }
    });
    function addActive(x) {
        // function to classify an item as "active":
        if (!x || x.length == 0) return false;
        // start by removing the "active" class on all items:
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        // add class "autocomplete-active":
        x[currentFocus].classList.add("autocomplete-active");
    }
    function removeActive(x) {
        // function to remove the "active" class from all autocomplete items:
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }
    function closeAllLists(elmnt) {
        document.querySelectorAll("#" + autocompleteId).forEach(function (e) {
            if (e != elmnt) e.remove()
        })
    }
    /*execute a function when someone clicks in the document:*/
    const closeAutocomplete = function (e) {
        closeAllLists(e.target);
    }
    document.removeEventListener("click", closeAutocomplete);
    document.addEventListener("click", closeAutocomplete);
}