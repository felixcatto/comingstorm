const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.development') });

const keys = process.env.KEYS.split(',');
const encrypt = value => crypto.createHmac('sha256', keys[0]).update(value).digest('hex');

const rem2px = (input, fontSize = 16) => {
  if (input == null) {
    return input;
  }
  switch (typeof input) {
    case 'object':
      if (Array.isArray(input)) {
        return input.map(val => rem2px(val, fontSize));
      } else {
        const ret = {};
        for (const key in input) {
          ret[key] = rem2px(input[key]);
        }
        return ret;
      }
    case 'string':
      return input.replace(/(\d*\.?\d+)rem$/, (_, val) => parseFloat(val) * fontSize + 'px');
    default:
      return input;
  }
};

module.exports = {
  encrypt,
  rem2px,
};
