module.exports = {
  
    resetMocks: false,

    setupFiles: ['./jest.setup.js', 'jest-chrome'],
    // Indicates whether each individual test should be reported during the run
    verbose: true,
  
    // The test environment that will be used for testing
    testEnvironment: 'node',
  
    // The glob patterns Jest uses to detect test files
    testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],
  
    // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
    testPathIgnorePatterns: ['/node_modules/'],
  
    // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
    transformIgnorePatterns: ['/node_modules/'],
  
    // Indicates whether the coverage information should be collected while executing the test
    collectCoverage: false,
  
    // The directory where Jest should output its coverage files
    coverageDirectory: 'coverage',
  
    // A list of reporter names that Jest uses when writing coverage reports
    coverageReporters: ['text', 'lcov'],
  
    // An object that configures minimum threshold enforcement for coverage results
    coverageThreshold: null,
  
    // A map from regular expressions to paths to transformers
    transform: {
      '^.+\\.jsx?$': 'babel-jest',
    },
  };