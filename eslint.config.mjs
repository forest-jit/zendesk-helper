import js from '@eslint/js';
import globals from 'globals';

// Classic content scripts intentionally share these names in one isolated world.
const sharedExtensionGlobals = {
  zdhThemes: 'readonly',
  zdhThemeControls: 'readonly',
  zdhThemeFiles: 'readonly'
};

export default [
  { ignores: ['node_modules/**', '.agents/**', 'docs/**', 'test-results/**'] },
  {
    files: ['src/**/*.js', 'local-review/*.js'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        ...globals.browser,
        ...globals.webextensions,
        ...globals.serviceworker,
        ...sharedExtensionGlobals,
        module: 'readonly',
        require: 'readonly'
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none', varsIgnorePattern: '^_' }]
    }
  },
  {
    files: ['scripts/**/*.mjs', '*.mjs'],
    ...js.configs.recommended,
    languageOptions: { globals: globals.node, sourceType: 'module' }
  }
];
