const express = require('express');
const messengerController = require('../../src/controllers/messenger_controller');

const router = express.Router();

router.get('/test', (req, res) => res.status(200).json({ status: true, message: 'Test successful.' }));

router.get('/webhook', messengerController.validateHook);

router.post('/webhook', messengerController.handleRequest);

router.get('/authorize', messengerController.authorizeClient);

module.exports = router;
