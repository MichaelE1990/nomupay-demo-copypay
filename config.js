// config.js
// Load local .env in non-production environments
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

module.exports = {
  ENTITY_ID:        process.env.ENTITY_ID,
  ACCESS_TOKEN:     process.env.ACCESS_TOKEN,
  API_HOST:         process.env.API_HOST || 'eu-test.oppwa.com',
  SHOPPER_RESULT_URL: process.env.SHOPPER_RESULT_URL || '/result'
};