import js from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import importPlugin from 'eslint-plugin-import';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * The layered architecture (spec 15.3) is enforced by eslint-plugin-boundaries:
 * a layer may only import from the layers below it, and CI fails on violations.
 * domain/ purity (no React, no Firebase) is enforced by no-restricted-imports
 * here AND by an independent source-scan test in tests/architecture.
 */
const LAYER_POLICIES = [
  { type: 'app', allow: ['app', 'features', 'ui', 'data', 'platform', 'domain', 'i18n', 'lib'] },
  { type: 'features', allow: ['features', 'ui', 'data', 'platform', 'domain', 'i18n', 'lib'] },
  { type: 'ui', allow: ['ui', 'lib', 'i18n'] },
  { type: 'data', allow: ['data', 'domain', 'platform', 'lib'] },
  { type: 'platform', allow: ['platform', 'lib'] },
  { type: 'domain', allow: ['domain', 'lib'] },
  { type: 'i18n', allow: ['i18n', 'domain'] },
  { type: 'lib', allow: ['lib'] },
].map((policy) => ({
  from: { element: { type: policy.type } },
  allow: { to: { element: { types: { anyOf: policy.allow } } } },
}));

export default tseslint.config(
  // `.claude` holds agent worktrees — each a full checkout with its own built `dist/`; never lint them.
  { ignores: ['dist', 'dev-dist', 'coverage', 'node_modules', '.firebase', '.claude'] },

  js.configs.recommended,
  ...tseslint.configs.strict,

  // Allow underscore-prefixed unused identifiers and empty catch blocks.
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },

  // Application source (excludes tests) — architecture boundaries apply here.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/*.test.{ts,tsx}', 'src/**/__tests__/**'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, import: importPlugin, boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**/*' },
        { type: 'features', pattern: 'src/features/*/**/*' },
        { type: 'ui', pattern: 'src/ui/**/*' },
        { type: 'data', pattern: 'src/data/**/*' },
        { type: 'platform', pattern: 'src/platform/**/*' },
        { type: 'domain', pattern: 'src/domain/**/*' },
        { type: 'i18n', pattern: 'src/i18n/**/*' },
        { type: 'lib', pattern: 'src/lib/**/*' },
      ],
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'boundaries/dependencies': ['error', { default: 'disallow', policies: LAYER_POLICIES }],
    },
  },

  // domain/ must not reach for React or Firebase (spec 15.5).
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    ignores: ['src/domain/**/__tests__/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-dom',
                'react-router',
                'react-router-dom',
                'firebase',
                'firebase/*',
                '@firebase/*',
              ],
              message: 'domain/ must stay pure — no React, no Firebase (spec 15.5).',
            },
          ],
        },
      ],
      // Time and randomness are inputs to the domain, never ambient effects (spec 15.5).
      'no-restricted-properties': [
        'error',
        { object: 'Date', property: 'now', message: 'domain/ is pure — pass time in as an input.' },
        { object: 'Math', property: 'random', message: 'domain/ is pure — pass randomness in.' },
        {
          object: 'crypto',
          property: 'randomUUID',
          message: 'domain/ is pure — pass ids in as inputs.',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Date']",
          message: 'domain/ is pure — pass time in as an input, not new Date().',
        },
      ],
    },
  },

  // Browser + node globals for src test files.
  {
    files: ['src/**/*.test.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },

  // Node-side tooling and tests.
  {
    files: [
      'tests/**/*.{ts,tsx}',
      'seed/**/*.ts',
      'scripts/**/*.{ts,mjs}',
      'vite.config.ts',
      'vitest.config.ts',
      'vitest.rules.config.ts',
      'tailwind.config.ts',
      'eslint.config.js',
    ],
    languageOptions: { globals: globals.node },
  },

  prettier,
);
