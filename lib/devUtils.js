const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.development') });

const keys = process.env.KEYS.split(',');
const encrypt = value => crypto.createHmac('sha256', keys[0]).update(value).digest('hex');

module.exports = {
  encrypt,
};
