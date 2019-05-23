const express = require('express');
const bodyParser = require('body-parser');
const eyowo = require('eyowo-js');

const appSecret = process.env.APP_SECRET;
const appKey = process.env.APP_KEY;

const client = new eyowo.Client({
  appKey,
  appSecret,
  environment: 'production',
});

const app = express();
