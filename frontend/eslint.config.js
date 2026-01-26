import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'node_modules', 'build', '.vite']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      // File size enforcement
      'max-lines': ['warn', { 
        max: 300, 
        skipComments: true, 
        skipBlankLines: true 
      }],
      
      // Function size enforcement (increased for React components with JSX)
      'max-lines-per-function': ['warn', { 
        max: 150, 
        skipComments: true,
        skipBlankLines: true 
      }],
      
      // Prevent deeply nested code (allow 5 for complex UI components)
      'max-depth': ['error', 5],
      
      // Enforce early returns
      'no-else-return': ['error', { allowElseIf: false }],
      
      // Prevent unnecessary complexity (adjusted for business logic in domain features)
      'complexity': ['warn', 25],
      
      // TypeScript specific
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_' 
      }],
      
      // React specific
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/rules-of-hooks': 'error',
      
      // Code quality
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'prefer-arrow-callback': 'error',
      // Allow separate type and value imports from same source
      'no-duplicate-imports': 'off',
      
      // Styling: Warn about hardcoded Tailwind classes that should use design tokens
      // Note: This is a basic check. For comprehensive enforcement, see STYLING.md
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'Literal[value=/\\b(bg-surface rounded p-6|text-lg font-semibold text-text-primary|bg-\\[#|text-\\[#)/]',
          message: 'Avoid hardcoded Tailwind classes. Use design tokens from @/shared/design-system/tokens/presets instead. See STYLING.md for examples.',
        },
      ],
    },
  },
])
