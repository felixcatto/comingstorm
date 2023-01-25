const crypto = require('crypto');

const keys = ['heavy rain', 'hedgehog'];
const encrypt = value => crypto.createHmac('sha256', keys[0]).update(value).digest('hex');

module.exports = {
  encrypt,
};
