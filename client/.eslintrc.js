module.exports = {
  'env': {
    'browser': true,
    'es2021': true,
    'node': true
  },
  'extends': [
    'eslint:recommended',
    'plugin:vue/vue3-essential'
  ],
  'overrides': [],
  'parserOptions': {
    'ecmaVersion': 'latest',
    'sourceType': 'module'
  },
  'plugins': [
    'vue'
  ],
  'rules': {
    'indent': [
      'error',
      2,
      {
        'SwitchCase': 1
      }
    ],
    'semi': [
      'error',
      'always'
    ],
    'quotes': [
      'error',
      'single'
    ],
    'no-trailing-spaces': 'error',
    'keyword-spacing': [
      'error',
      {
        'before': true
      }
    ],
    'space-before-blocks': 'error',
    'object-curly-spacing': [
      'error',
      'always'
    ],
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'array-bracket-spacing': [
      'error',
      'never'
    ],
    'block-spacing': 'error',
    'brace-style': 'error',
    'func-call-spacing': [
      'error',
      'never'
    ],
    'key-spacing': [
      'error',
      {
        'beforeColon': false
      }
    ],
    'new-cap': ['error', { 'capIsNew': false }],
    'no-var': 'error',
    'no-use-before-define': 'off',
    'no-unused-vars': 'off',
    'vue/html-indent': ['error', 2, {
      'attribute': 1,
      'baseIndent': 1,
      'closeBracket': 0,
      'alignAttributesVertically': true,
      'ignores': []
    }]
  }
};