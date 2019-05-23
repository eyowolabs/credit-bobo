const express = require('express');
const bodyParser = require('body-parser');
const eyowo = require('eyowo-js');

const appConfig = require('./config/app_config');
const { verifyRequestSignature } = require('./src/lib/auth');
const messengerHelper = require('./src/helpers/messenger_helper');

if (!(appConfig.MESSENGER.APP_SECRET && appConfig.MESSENGER.VALIDATION_TOKEN
    && appConfig.MESSENGER.PAGE_ACCESS_TOKEN && appConfig.MESSENGER.SERVER_URL)) {
  console.error('Missing config values');
  process.exit(1);
}

const client = new eyowo.Client({
  appKey: appConfig.EYOWO.APP_KEY,
  appSecret: appConfig.EYOWO.APP_SECRET,
  environment: appConfig.EYOWO.ENV,
});
const app = express();

app.set('port', appConfig.SERVER.PORT);
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use(bodyParser.json({ verify: verifyRequestSignature }));

app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe'
      && req.query['hub.verify_token'] === appConfig.MESSENGER.VALIDATION_TOKEN) {
    console.log('Validating webhook');
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error('Failed validation. Make sure the validation tokens match.');
    res.sendStatus(403);
  }
});

app.post('/webhook', (req, res) => {
  const data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {
    // Iterate over each entry
    // There may be multiple if batched
    data.entry.forEach((pageEntry) => {
      console.info(`pageID: ${pageEntry.id} \n timeOfEvent: ${pageEntry.time}`);

      // Iterate over each messaging event
      pageEntry.messaging.forEach((messagingEvent) => {
        if (messagingEvent.optin) {
          messengerHelper.receivedAuthentication(messagingEvent);
        } else if (messagingEvent.message) {
          messengerHelper.receivedMessage(messagingEvent);
        } else if (messagingEvent.delivery) {
          messengerHelper.receivedDeliveryConfirmation(messagingEvent);
        } else if (messagingEvent.postback) {
          messengerHelper.receivedPostback(messagingEvent);
        } else if (messagingEvent.read) {
          messengerHelper.receivedMessageRead(messagingEvent);
        } else if (messagingEvent.account_linking) {
          messengerHelper.receivedAccountLink(messagingEvent);
        } else {
          console.log('Webhook received unknown messagingEvent: ', messagingEvent);
        }
      });
    });
    res.sendStatus(200);
  }
});

app.get('/authorize', (req, res) => {
  const accountLinkingToken = req.query.account_linking_token;
  const redirectURI = req.query.redirect_uri;

  // Authorization Code should be generated per user by the developer. This will
  // be passed to the Account Linking callback.
  const authCode = '1234567890';

  // Redirect users to this URI on successful login
  const redirectURISuccess = `${redirectURI}&authorization_code=${authCode}`;

  res.render('authorize', {
    accountLinkingToken,
    redirectURI,
    redirectURISuccess,
  });
});

app.listen(app.get('port'), () => {
  console.info('Node app is running on port', app.get('port'));
});

module.exports = app;
