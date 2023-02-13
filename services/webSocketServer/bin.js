const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env.development') });
const { startServer } = require('./main');

startServer();
