const appConfig = require('../../config/app_config');
const messengerHelper = require('../../src/helpers/messenger_helper');

module.exports = {
  authorizeClient(req, res) {
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
  },
  validateHook(req, res) {
    if (req.query['hub.mode'] === 'subscribe'
        && req.query['hub.verify_token'] === appConfig.MESSENGER.VALIDATION_TOKEN) {
      console.log('Validating webhook');
      res.status(200).send(req.query['hub.challenge']);
    } else {
      console.error('Failed validation. Make sure the validation tokens match.');
      res.sendStatus(403);
    }
  },
  handleRequest(req, res) {
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
  },
};
