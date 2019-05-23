const messenger = require('../models/messenger_model');
const appConfig = require('../../config/app_config');

/*
 * If users came here through testdrive, they need to configure the server URL
 * in default.json before they can access local resources likes images/videos.
 */
function requiresServerURL(next, [recipientId, ...args]) {
  if (appConfig.MESSENGER.SERVER_URL === 'to_be_set_manually') {
    const messageData = {
      recipient: {
        id: recipientId,
      },
      message: {
        text: `
We have static resources like images and videos available to test, but you need to update the code you downloaded earlier to tell us your current server url.
1. Stop your node server by typing ctrl-c
2. Paste the result you got from running "lt —port 5000" into your config/default.json file as the "serverURL".
3. Re-run "node app.js"
Once you've finished these steps, try typing “video” or “image”.
        `,
      },
    };

    messenger.callSendAPI(messageData);
  } else {
    next.apply(this, [recipientId, ...args]);
  }
}

function receivedAccountLink(event) {
  const senderID = event.sender.id;
  // const recipientID = event.recipient.id;

  const { status } = event.account_linking;
  const authCode = event.account_linking.authorization_code;

  console.log('Received account link event with for user %d with status %s '
      + 'and auth code %s ', senderID, status, authCode);
}

function receivedAuthentication(event) {
  const senderID = event.sender.id;
  const recipientID = event.recipient.id;
  const timeOfAuth = event.timestamp;

  // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
  // The developer can set this to an arbitrary value to associate the
  // authentication callback with the 'Send to Messenger' click event. This is
  // a way to do account linking when the user clicks the 'Send to Messenger'
  // plugin.
  const passThroughParam = event.optin.ref;

  console.log('Received authentication for user %d and page %d with pass '
      + "through param '%s' at %d", senderID, recipientID, passThroughParam,
  timeOfAuth);

  // When an authentication is received, we'll send a message back to the sender
  // to let them know it was successful.
  messenger.sendTextMessage(senderID, 'Authentication successful');
}

function receivedMessage(event) {
  const senderID = event.sender.id;
  const recipientID = event.recipient.id;
  const timeOfMessage = event.timestamp;
  const { message } = event;

  console.log('Received message for user %d and page %d at %d with message:',
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  const isEcho = message.is_echo;
  const messageId = message.mid;
  const appId = message.app_id;
  const { metadata } = message;

  // You may get a text or attachment but not both
  const messageText = message.text;
  const messageAttachments = message.attachments;
  const quickReply = message.quick_reply;

  if (isEcho) {
    // Just logging message echoes to console
    console.log('Received echo for message %s and app %d with metadata %s',
      messageId, appId, metadata);
    return;
  } if (quickReply) {
    const quickReplyPayload = quickReply.payload;
    console.log('Quick reply for message %s with payload %s',
      messageId, quickReplyPayload);

    messenger.sendTextMessage(senderID, 'Quick reply tapped');
    return;
  }

  if (messageText) {
    // If we receive a text message, check to see if it matches any special
    // keywords and send back the corresponding example. Otherwise, just echo
    // the text we received.
    switch (messageText.replace(/[^\w\s]/gi, '').trim().toLowerCase()) {
      case 'hello':
      case 'hi':
        messenger.sendHiMessage(senderID);
        break;

      case 'image':
        requiresServerURL(messenger.sendImageMessage, [senderID]);
        break;

      case 'gif':
        requiresServerURL(messenger.sendGifMessage, [senderID]);
        break;

      case 'audio':
        requiresServerURL(messenger.sendAudioMessage, [senderID]);
        break;

      case 'video':
        requiresServerURL(messenger.sendVideoMessage, [senderID]);
        break;

      case 'file':
        requiresServerURL(messenger.sendFileMessage, [senderID]);
        break;

      case 'button':
        messenger.sendButtonMessage(senderID);
        break;

      case 'generic':
        requiresServerURL(messenger.sendGenericMessage, [senderID]);
        break;

      case 'receipt':
        requiresServerURL(messenger.sendReceiptMessage, [senderID]);
        break;

      case 'quick reply':
        messenger.sendQuickReply(senderID);
        break;

      case 'read receipt':
        messenger.sendReadReceipt(senderID);
        break;

      case 'typing on':
        messenger.sendTypingOn(senderID);
        break;

      case 'typing off':
        messenger.sendTypingOff(senderID);
        break;

      case 'account linking':
        requiresServerURL(messenger.sendAccountLinking, [senderID]);
        break;

      default:
        messenger.sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    messenger.sendTextMessage(senderID, 'Message with attachment received');
  }
}

function receivedDeliveryConfirmation(event) {
  // const senderID = event.sender.id;
  // const recipientID = event.recipient.id;
  const { delivery } = event;
  const messageIDs = delivery.mids;
  const { watermark } = delivery;
  // const sequenceNumber = delivery.seq;

  if (messageIDs) {
    messageIDs.forEach((messageID) => {
      console.log('Received delivery confirmation for message ID: %s',
        messageID);
    });
  }

  console.log('All message before %d were delivered.', watermark);
}

function receivedPostback(event) {
  const senderID = event.sender.id;
  const recipientID = event.recipient.id;
  const timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback
  // button for Structured Messages.
  const { payload } = event.postback;

  console.log("Received postback for user %d and page %d with payload '%s' "
      + 'at %d', senderID, recipientID, payload, timeOfPostback);

  messenger.sendTextMessage(senderID, 'Postback called');
}

function receivedMessageRead(event) {
  // const senderID = event.sender.id;
  // const recipientID = event.recipient.id;

  // All messages before watermark (a timestamp) or sequence have been seen.
  const { watermark } = event.read;
  const sequenceNumber = event.read.seq;

  console.log('Received message read event for watermark %d and sequence '
      + 'number %d', watermark, sequenceNumber);
}

module.exports = {
  receivedAccountLink,
  receivedAuthentication,
  receivedMessage,
  receivedMessageRead,
  receivedDeliveryConfirmation,
  receivedPostback,
};
