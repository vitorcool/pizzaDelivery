# REST API for pizzaDelivery company

## Run server

    cd <project folder>
    node index.js


# REST API

The REST API to the pizzaDelivery is described below.

## Create new user

`POST /ap/users/`
### Required data
name,street,email,password

    curl --request POST 'http://localhost:3000/api/users' \
    --header 'Content-Type: text/plain' \
    --data-raw '{
        "name":"John Tester",
        "address": "2 W 21st St, New York, NY 10010, USA",
        "email": "user@some.domain",
        "password": "password"        
    }'

### Response
    
    Status: 200 OK    
    Content-Type: application/json
    
    {
        "email": "user@some.domain",
        "name": "John Tester",
        "street": "200 street, 2345, Canada",
        "hashedPassword": "b5883e06fb9282a6ca554c18c28899f590e0ae27e4fa3d7a526d5c2ab320526b",
        "shoppingCard": []
    }


## Edit user
`PUT /api/users/`
#### Required header: token
#### Required data: email
#### Optional data: name,street,password
### Request

    curl --request PUT 'http://localhost:3000/api/users' \
    --header 'token: my_authentication_token' \
    --header 'Content-Type: text/plain' \
    --data-raw '{
        "name":"Mary Tester"
    }'

### Response

    Status: 200 OK    
    Content-Type: application/json
 
    {
        "email": "user@some.domain",
        "name": "Mary Tester",
        "street": "200 street, 2345, Canada",
        "hashedPassword": "b5883e06fb9282a6ca554c18c28899f590e0ae27e4fa3d7a526d5c2ab320526b",
        "shoppingCard": []
    }

## Delete User
`DELETE /api/users?email=user@some.domain`
#### Required header: token
### Request

    curl --request DELETE 'http://localhost:3000/users?email=user@some.domain' \
    --header 'token: my_authentication_token'

### Response

    Status: 200 OK    
    Content-Type: application/json
 
    {}

## Get user data
`GET /users`
#### Required header: token
### Request

    curl --request GET 'http://localhost:3000/api/users?email=user@some.domain' \
    --header 'token: my_authentication_token' \

### Response

    Status: 200 OK    
    Content-Type: application/json
 
    {
        "email": "user@some.domain",
        "name": "Mary Tester",
        "street": "200 street, 2345, Canada",
        "hashedPassword": "b5883e06fb9282a6ca554c18c28899f590e0ae27e4fa3d7a526d5c2ab320526b",
        "shoppingCard": []
    }

## Create Token (User login)
`POST /api/tokens/`
#### Required data: email,password
### Request

    curl --request POST 'http://localhost:3000/api/tokens' \
    --header 'Content-Type: application/json' \
    --data-raw '{
        "email":"user@some.domain",
        "password": "password"
        }'

### Response
    
    Status: 200 OK    
    Content-Type: application/json
    
    {
    "email": "vitorcool@gmail.com",
    "id": "cn9pl4xxtj15456a0p2a",
    "expires": 1612454126615
    }

## Delete Token (User logout)
`DELETE /api/tokens?id=my_authentication_token`
### Request
    curl --request DELETE 'http://localhost:3000/api/tokens?id=cn9pl4xxtj15456a0p2a'

### Response
    
    Status: 200 OK    
    Content-Type: application/json
    
    {}


## Get Pizzas menu
`GET /api/pizzas/`
#### Required header: token
### Request

    curl --request GET 'http://localhost:3000/api/pizzas' \
    --header 'token: my_authentication_token'

### Response

    Status: 200 OK    
    Content-Type: application/json

    [
        "Pizza1",
        "Pizza2",
        "Pizza3"
    ]

## Get pizza data
`GET /api/pizzas/?name=Pizza`
#### Required header: token
### Request

    curl --request GET 'http://localhost:3000/api/pizzas?name=Pizza1' \
    --header 'token: my_authentication_token'

### Response

    Status: 200 OK    
    Content-Type: application/json

    {
        "name": "Pizza1",
        "price": 10
    }


## Add pizza to ShoppingCard
`POST /api/shoppingcard`
#### Required header: token
#### Required data: name
### Request

    curl --request POST 'http://localhost:3000/api/shoppingcard' \
    --header 'token: myauthentication_token' \
    --header 'Content-Type: application/json' \
    --data-raw '{ 
        "name": "Pizza2"
    }'

### Response

    Status: 200 OK
    Content-Type: application/json
    
    {
       "name": "Pizza2",
        "price": 10
    }

## Get user ShoppingCard
`GET /api/shoppingcard`
#### Required header: token
### Request

    curl --request GET 'http://localhost:3000/api/shoppingcard' \
    --header 'token: myauthentication_token' 

### Response

    Status: 200 OK
    Content-Type: application/json
    
    [
        {
            "name": "Pizza2",
            "price": 10
        }
    ]

## Delete user ShoppingCard
`GET /api/shoppingcard`
#### Required header: token
### Request

    curl --request DELETE 'http://localhost:3000/api/shoppingcard' \
    --header 'token: myauthentication_token' 

### Response

    Status: 200 OK
    Content-Type: application/json
    
    {}


## shopping card Payment intent
`POST /api/shoppingcard/pay`
#### Required header: token
#### Requured data: address
### Request

    curl --request POST 'http://localhost:3000/api/shoppingcard/pay' \
    --header 'token: myauthentication_token' 
    --data-raw '{
        "address": "200 street, 2345, Canada",        
    }'
### Response

    Status: 200 OK
    Content-Type: application/json
    
    {
        "id": ...
    }


## shopping card Payment intent confirmation
`POST /api/shoppingcard/pay/confirm`
#### Required header: token
#### Requured data: address
### Request

    curl --request POST 'http://localhost:3000/api/shoppingcard/pay/confirm' \
    --header 'token: myauthentication_token' 
    --data-raw '{
        "id": paymentIntent_id,        
        "card": "4242 4242 4242 4242",
        "expirationdate: "12/23",
        "securitycode": "111"
    }'
### Response

    Status: 200 OK
    Content-Type: application/json
    
    {
        "id": ...
    }

## Address geo location
`POST /api/addresses`
#### Required header: token
#### Required data: address 
### Request

    curl --request POST 'http://localhost:3000/api/addresses' \
    --header 'token: myauthentication_token' 
    --data-raw '{
        "address": "2 W 21st St, New York, NY 10010, USA"
    }'
### Response

    Status: 200 OK
    Content-Type: application/json
    
    [...]


## Address reverse geo location
`POST /api/addresses`
#### Required header: token
#### Required data: location
### Request

    curl --request POST 'http://localhost:3000/api/addresses' \
    --header 'token: myauthentication_token' 
    --data-raw '{
        "location": "40.740227,-73.990545"
    }'
    
### Response

    Status: 200 OK
    Content-Type: application/json
    
    [...]"# pizzaDelivery" 
