const babelconfig = require('./babelconfig');

module.exports = {
  transform: { '^.+\\.[jt]s$': ['babel-jest', babelconfig.server] },
  testPathIgnorePatterns: ['fixtures'],
  setupFiles: ['./__tests__/fixtures/envSetup'],
};
