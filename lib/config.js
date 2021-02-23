/*
* Create and exports configuration 
*/

// The Default configuration
class DefaultEnviromentConfig {
	constructor(options) {
        this.httpPort = 3000;
        this.httpsPort = 3001;
        this.envName = 'defaut';
        this.hashingSecret = 'blabla';   // very important to define on proction mode. public internet is a security hell.
        this.tokenTimeout = 1000 * 60 * 60;  // 1 hour defined in miliseconds
        this.stripe_api_key = 'sk_test_51IFmF7CNn1q1Zb719gcEjjPFe49n8fvl90N7otdaUtxVrWPhqpVVEkotnLwSqGjB2PekQhUcq0MfhBXdVGCyaUQt002JHyHLLQ';
        this.mailgun = {
            api_key: 'key-6971d61cbfac2346cc1f337c7b1b55a1',
            domain: 'sandboxd5d9c827fa5b48ef99216e468bfb8e3c.mailgun.org',
            email: 'postmaster@sandboxd5d9c827fa5b48ef99216e468bfb8e3c.mailgun.org',
        };
        this.truWayGeocoding = {
            api_key: "bd9e9bc631msh93b7f0157d0c417p111203jsn0067515a912e",
            api_host: "trueway-geocoding.p.rapidapi.com",
        };
        this.neutrinoEmailValidate = {
            api_key: "bd9e9bc631msh93b7f0157d0c417p111203jsn0067515a912e",
            api_host: "community-neutrino-email-validate.p.rapidapi.com",
        };
        this.templateGlobals = {
            appName: 'PizzaDeliveryService',
            companyName: 'NotARealCompany, inc',
            yearCreated: '2021',
            baseUrl: 'http://localhost:3000',
        };
        
        Object.assign(this, options);          
    }
    
    
}
var environments = {};

// Staging (default) enviroment
environments.staging = new DefaultEnviromentConfig({
    httpPort: process.env.PORT || 3000,
    httpsPort:3001,
    envName : 'staging',       
});

// Production environment
environments.production = new DefaultEnviromentConfig({
    httpPort:5000,
    httpsPort:5001,
    envName : 'production',    
});

// get NODE_ENV enviroment varible
var currentEnviroment = typeof(process.env.NODE_ENV) === 'string'
    ? process.env.NODE_ENV.toLowerCase()
    : '';

// check if current environment exists  
// ifnot enviroments.staging
var enviromentToExport = typeof(environments[currentEnviroment]) === 'object'
    ? environments[currentEnviroment]
    : environments.staging;

module.exports = enviromentToExport;    