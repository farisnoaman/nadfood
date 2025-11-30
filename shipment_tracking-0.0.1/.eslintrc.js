module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint'],
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  rules: {
    'no-console': 'error',
    // Add any custom rules here
  },
};