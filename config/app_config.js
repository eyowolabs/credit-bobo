module.exports = {
  EYOWO: {
    APP_SECRET: process.env.EYOWO_APP_SECRET,
    APP_KEY: process.env.EYOWO_APP_KEY,
    ENV: 'production',
  },
  MESSENGER: {
    APP_SECRET: process.env.MESSENGER_APP_SECRET,
    VALIDATION_TOKEN: process.env.MESSENGER__VALIDATION_TOKEN,
    PAGE_ACCESS_TOKEN: process.env.MESSENGER_PAGE_ACCESS_TOKEN,
    SERVER_URL: process.env.MESSENGER_SERVER_URL,
  },
  SERVER: {
    ENV: process.env.NODE_ENV,
    PORT: process.env.SERVER_PORT,
  },
};
