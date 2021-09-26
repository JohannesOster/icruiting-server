module.exports = {
  forceExit: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleDirectories: ['node_modules', 'src'],
  testPathIgnorePatterns: ['node_modules', 'tests/integration'],
  rootDir: './../../',
  testMatch: [
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/tests/unit/**/*.test.ts',
  ],
};
