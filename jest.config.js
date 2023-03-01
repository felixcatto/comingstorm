/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  testPathIgnorePatterns: ['fixtures'],
  watchPathIgnorePatterns: ['<rootDir>/\\.next/'],
  setupFiles: ['./__tests__/fixtures/envSetup'],
  // preset: 'ts-jest' | 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  transform: {
    // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
  },
};
