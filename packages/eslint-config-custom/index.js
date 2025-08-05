module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'indent': ['error', 2],
    'linebreak-style': ['off'], // Disabled to avoid issues across different OS
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-unused-vars': ['warn'],
    'no-console': ['warn'],
    'comma-dangle': ['error', 'always-multiline'], // Better git diffs
    'no-trailing-spaces': ['error'],
    'eol-last': ['error', 'always'],
  },
};