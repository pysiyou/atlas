import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import {
  allRestrictedSyntax,
  designTokenRestrictedSyntax,
} from './eslint.restricted-syntax.mjs'

export default defineConfig([
  globalIgnores(['dist', 'node_modules', 'build', '.vite', 'src/lib/api/types/generated/**']),
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
      'no-restricted-syntax': ['error', ...allRestrictedSyntax],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'prefer-arrow-callback': 'error',
      // Allow separate type and value imports from same source
      'no-duplicate-imports': 'off',

      // Import boundaries — prefer feature barrels for cross-feature access
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['@/features/*/components/*', '@/features/*/hooks/*', '@/features/*/api/*', '@/features/*/utils/*'],
            message: 'Import from the feature public API (@/features/<name>) unless this is an intra-feature relative import.',
          },
          {
            group: ['@/utils'],
            importNames: ['ICONS'],
            message: 'Import ICONS from @/config/icons instead of @/utils.',
          },
        ],
      }],
    },
  },
  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['@/features/**'],
            message: 'Shared components must not import from features. Move domain logic to @/utils or feature barrels.',
          },
        ],
      }],
    },
  },
  {
    files: ['src/types/enums/generated/**'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    files: ['src/components/theme/recipes.ts'],
    rules: {
      'max-lines': 'off',
      'no-restricted-syntax': ['error', {
        selector: 'Literal[value=/text-\\[\\d+px\\]/]',
        message: 'Use the type scale (text-3xs through text-lg), not arbitrary px font sizes.',
      }, {
        selector: 'TemplateElement[value.raw=/text-\\[\\d+px\\]/]',
        message: 'Use the type scale (text-3xs through text-lg), not arbitrary px font sizes.',
      }, {
        selector: 'Literal[value=/rounded-\\[/]',
        message: 'Use RADIUS from @/components/theme/recipes, not arbitrary rounded-[Npx].',
      }, {
        selector: 'TemplateElement[value.raw=/rounded-\\[/]',
        message: 'Use RADIUS from @/components/theme/recipes, not arbitrary rounded-[Npx].',
      }, {
        selector: 'Literal[value=/h-\\[34px\\]/]',
        message: 'Use CONTROL.height from @/components/theme/recipes.',
      }, {
        selector: 'TemplateElement[value.raw=/h-\\[34px\\]/]',
        message: 'Use CONTROL.height from @/components/theme/recipes.',
      }],
    },
  },
  {
    files: [
      'src/components/inputs/inputStyles.ts',
      'src/components/surfaces/Panel.tsx',
      'src/components/data-table/constants.ts',
      'src/features/lab/utils/labStyles.ts',
      'src/features/lab/utils/labResult.ts',
      'src/features/lab/commandCenter/commandCenterStyles.ts',
      'src/features/lab/commandCenter/dashboardStyles.ts',
      'src/features/timeline/timelineStyles.ts',
    ],
    rules: {
      'no-restricted-syntax': ['error', ...designTokenRestrictedSyntax],
    },
  },
])
