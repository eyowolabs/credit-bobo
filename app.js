const express = require('express');
const bodyParser = require('body-parser');
const eyowo = require('eyowo-js');

const appConfig = require('./config/app_config');
const appRouter = require('./src/router/app_router');
const { verifyRequestSignature } = require('./src/lib/auth');

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
app.all('*', appRouter);

app.listen(app.get('port'), () => {
  console.info('Application running on port', app.get('port'));
});

module.exports = app;
