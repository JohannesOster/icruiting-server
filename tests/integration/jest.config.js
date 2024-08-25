module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globalSetup: './jest.setup.js',
  globalTeardown: './jest.teardown.js',
  setupFilesAfterEnv: ['./jest.setupAfterEnv.js'],
  moduleDirectories: ['node_modules', 'src'],
  modulePathIgnorePatterns: ['__mocks__'],
};
