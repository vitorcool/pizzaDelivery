openssl genrsa -out localhost.key 2048

openssl req -new -sha256 -key localhost.key -out localhost.csr -config req.cfg

openssl x509 -req -in localhost.csr -signkey localhost.key -out localhost.crt -days 3650 -extensions SAN