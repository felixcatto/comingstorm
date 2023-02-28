const babelconfig = require('./babelconfig');

const esModules = ['query-string', 'decode-uri-component', 'split-on-first', 'filter-obj'];

module.exports = {
  transform: { '^.+\\.[jt]s$': ['babel-jest', babelconfig.server] },
  testPathIgnorePatterns: ['fixtures'],
  setupFiles: ['./__tests__/fixtures/envSetup'],
  watchPathIgnorePatterns: ['<rootDir>/\\.next/'],
  transformIgnorePatterns: [`/node_modules/(?!${esModules.join('|')})`],
};
