import js from '@eslint/js';

const browserGlobals = {
  AudioContext: 'readonly',
  cancelAnimationFrame: 'readonly',
  document: 'readonly',
  localStorage: 'readonly',
  navigator: 'readonly',
  performance: 'readonly',
  requestAnimationFrame: 'readonly',
  setTimeout: 'readonly',
  window: 'readonly'
};

const nodeGlobals = {
  WebSocket: 'readonly',
  Buffer: 'readonly',
  clearTimeout: 'readonly',
  console: 'readonly',
  process: 'readonly'
};

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**'
    ]
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...nodeGlobals,
        ...browserGlobals
      }
    },
    rules: {
      'no-unused-vars': [
        'error',
        {
          args: 'none',
          caughtErrors: 'none',
          ignoreRestSiblings: true
        }
      ],
      'no-warning-comments': ['warn', { terms: ['todo', 'fixme'], location: 'anywhere' }],
      'prefer-const': 'off'
    }
  }
];
