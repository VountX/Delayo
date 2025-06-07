import js from '@eslint/js'
import parserTs from '@typescript-eslint/parser'
import pluginTs from '@typescript-eslint/eslint-plugin'
import pluginReact from 'eslint-plugin-react'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import pluginReactRefresh from 'eslint-plugin-react-refresh'
import pluginImport from 'eslint-plugin-import'
import pluginJsxA11y from 'eslint-plugin-jsx-a11y'
import prettier from 'eslint-config-prettier'

export default [
  js.configs.recommended,

  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: parserTs,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        chrome: 'readonly',
        document: 'readonly',
        window: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        localStorage: 'readonly',
        navigator: 'readonly',
        process: 'readonly',
        __dirname: 'readonly', // usado no vite.config.ts
      },
    },
    plugins: {
      '@typescript-eslint': pluginTs,
      react: pluginReact,
      'react-hooks': pluginReactHooks,
      'react-refresh': pluginReactRefresh,
      import: pluginImport,
      'jsx-a11y': pluginJsxA11y,
    },
    rules: {
      // React + JSX
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/jsx-filename-extension': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // Imports
      'import/extensions': 'off',
      'import/no-extraneous-dependencies': 'off',

      // TS
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error'],
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',

      // A11y
      'jsx-a11y/label-has-associated-control': 'warn',
    },
    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
  },

  prettier,
]
