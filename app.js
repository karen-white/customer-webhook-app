const http = require('http');
const express = require('express');
const bodyParser = require('body-parser')
const dotenv = require('dotenv');
dotenv.config();

const BigCommerce = require('node-bigcommerce');
const bigCommerce = new BigCommerce({
  clientId: process.env.CLIENTID,
  accessToken: process.env.ACCESSTOKEN,
  storeHash: process.env.STOREHASH,
  responseType: 'json'
});

const accountSid = process.env.ACCOUNTSID;
const authToken = process.env.AUTHTOKEN;
const client = require('twilio')(accountSid, authToken);

const app = express();

app.use(bodyParser.json())

  bigCommerce.get('/hooks')
    .then(data => {
      let webhooks = data;
      let scopes = webhooks.map(a => a.scope);
      const hookBody = {
        "scope": "store/customer/created",
        "destination": "https://7a821ff0.ngrok.io/webhooks",
        "is_active": true
      }

      console.log(scopes);

      if (scopes.indexOf("store/customer/created") > -1 || scopes.indexOf("store/customer/*") > -1) {
        console.log("Customer webhook already exists");
      } else {
          bigCommerce.post('/hooks', hookBody)
            .then(data => {
                console.log('Customer webhook created');
            })
      }

    });

    app.post('/webhooks', function (req, res) {
        res.send('OK');
        let webhook = req.body;
        let customerId = webhook.data.id;
        //console.log(webhook);
        console.log(customerId);

        bigCommerce.get(`/customers/${customerId}`)
        .then(data => {
          let firstName = data.first_name;
          let lastName = data.last_name;
          sendText(firstName, lastName);
          })
        });
    
    function sendText(firstName, lastName){
        client.messages
        .create({
            body: `${firstName} ${lastName} just registered an account on your store!`,
            from: '+15127777777',
            to: '+15125555555'
        })
        .then(message => console.log(message.sid));
    }

http.createServer(app).listen(1337, () => {
  console.log('Express server listening on port 1337');
});