import js from '@eslint/js';

import react from 'eslint-plugin-react';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';

// Dependency direction, as documented in CONTRIBUTING.md:
//   components / hooks / routes -> presentation -> services/* -> services/shared -> lib
const ui = ['src/components/**', 'src/hooks/**', 'src/routes/**'];
const presentation = ['src/presentation/**'];
const contexts = ['src/services/*', 'src/services/*/**'];
const otherContexts = [...contexts, '!src/services/shared', '!src/services/shared/**'];

// Every bounded context is reached through its barrel, never through its layers.
const contextInternals = {
  group: ['src/services/*/**', '**/services/*/**'],
  message:
    'Import a bounded context through its barrel (src/services/<context>), not its internal layers.',
};

const restrictImports = (...patterns) => ['error', { patterns }];

export default defineConfig([
  globalIgnores(['dist', 'node_modules', 'coverage', 'dev-dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // React
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/display-name': 'off',
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',

      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // TypeScript
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',

      // Accessibility
      ...jsxA11y.configs.recommended.rules,

      '@typescript-eslint/only-throw-error': [
        'error',
        {
          allow: [{ from: 'file', name: ['Redirect'] }],
        },
      ],

      // Dependency direction
      'no-restricted-imports': restrictImports(contextInternals),
    },
  },
  {
    files: ['src/presentation/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrictImports(contextInternals, {
        group: ui,
        message:
          'presentation sits below the UI tier and must not import components, hooks or routes.',
      }),
    },
  },
  {
    files: ['src/services/**/*.ts'],
    rules: {
      'no-restricted-imports': restrictImports(contextInternals, {
        group: [...ui, ...presentation],
        message: 'A bounded context must not import UI or presentation code.',
      }),
    },
  },
  {
    files: ['src/services/shared/**/*.ts'],
    rules: {
      'no-restricted-imports': restrictImports(contextInternals, {
        group: [...ui, ...presentation, ...otherContexts],
        message: 'The shared kernel sits below the bounded contexts and must not import them.',
      }),
    },
  },
  {
    files: ['src/lib/**/*.ts'],
    rules: {
      'no-restricted-imports': restrictImports({
        group: [...ui, ...presentation, ...contexts],
        message: 'lib holds technical primitives and must not import domain or view code.',
      }),
    },
  },
  {
    files: ['src/tests/e2e/setup.ts', 'src/tests/e2e/setup/**/*.ts'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
    },
  },
  prettier,
]);
