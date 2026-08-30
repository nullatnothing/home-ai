module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\.(ts|tsx)$': ['babel-jest', { presets: ['babel-preset-expo'] }],
  },
  testMatch: ['<rootDir>/**/__tests__/**/*.test.ts?(x)', '<rootDir>/**/__tests__/**/*.spec.ts?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^react-native$': '<rootDir>/test/mocks/react-native.js',
    '^@react-native-async-storage/async-storage$': '<rootDir>/test/mocks/async-storage.js',
    '^expo/config-plugins$': '<rootDir>/test/mocks/config-plugins.js',
  },
};
