import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// eslint-plugin-react can expose a few rule modules as empty objects when its
// CommonJS index loads them under newer Node/ESLint combinations. Preloading
// them keeps the upstream Next preset stable without changing project rules.
require('eslint-plugin-react/lib/rules/jsx-no-literals');
require('eslint-plugin-react/lib/rules/jsx-wrap-multilines');
require('eslint-plugin-react/lib/rules/sort-prop-types');

const { default: nextCoreWebVitals } = await import('eslint-config-next/core-web-vitals');
const { default: nextTypeScript } = await import('eslint-config-next/typescript');

const ignoredPaths = [
  'node_modules/**',
  '.next/**',
  'out/**',
  'build/**',
  'coverage/**',
  'mcp/**',
  'sessions/**',
  ['apps', 'cumulus-db', 'dist', '**'].join('/'),
  'temp_*.tsx',
  'next-env.d.ts',
];

const eslintConfig = [
  {
    ignores: ignoredPaths,
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
    ignores: ignoredPaths,
  },
];

export default eslintConfig;
