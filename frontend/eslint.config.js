import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import {
  allRestrictedSyntax,
  designTokenRestrictedSyntax,
  panelPresetRestrictedSyntax,
  typeUtilityRestrictedSyntax,
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
            group: [
              '@/features/*/components/*',
              '@/features/*/hooks/*',
              '@/features/*/api/*',
              '@/features/*/utils/*',
              '@/features/*/collection/**',
              '@/features/*/entry/**',
              '@/features/*/validation/**',
              '@/features/*/monitor/**',
              '@/features/*/pages/**',
            ],
            message: 'Import from the feature public API (@/features/<name>) unless this is an intra-feature relative import.',
          },
          {
            group: [
              '@/features/lab/hooks',
              '@/features/lab/hooks/**',
              '@/features/lab/utils',
              '@/features/lab/utils/**',
              '@/features/lab/types',
              '@/features/lab/types/**',
              '@/features/lab/constants',
              '@/features/lab/constants/**',
            ],
            message: 'Use @/features/lab barrel from outside lab; use relative imports inside features/lab.',
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
    files: ['src/features/**/*.{ts,tsx}', 'src/app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [
          {
            name: '@/components',
            message: 'Import from @/components/<subpath> (primitives, data-table, filters, overlays, etc.) instead of the top-level barrel.',
          },
        ],
        patterns: [
          {
            group: [
              '@/features/*/components/*',
              '@/features/*/hooks/*',
              '@/features/*/api/*',
              '@/features/*/utils/*',
              '@/features/*/collection/**',
              '@/features/*/entry/**',
              '@/features/*/validation/**',
              '@/features/*/monitor/**',
              '@/features/*/pages/**',
            ],
            message: 'Import from the feature public API (@/features/<name>) unless this is an intra-feature relative import.',
          },
          {
            group: [
              '@/features/lab/hooks',
              '@/features/lab/hooks/**',
              '@/features/lab/utils',
              '@/features/lab/utils/**',
              '@/features/lab/types',
              '@/features/lab/types/**',
              '@/features/lab/constants',
              '@/features/lab/constants/**',
            ],
            message: 'Use @/features/lab barrel from outside lab; use relative imports inside features/lab.',
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
          {
            group: ['@/utils/tableColumnRenders', '@/utils/tableColumnRenders.tsx'],
            message: 'Generic table cell helpers only; domain renders live in @/features/orders or @/features/patients.',
          },
          {
            group: ['@/features/*/utils/*TableColumnRenders*'],
            message: 'Do not import feature table renders from shared components.',
          },
          {
            group: ['@/components/inputs/inputStyles', '@/components/inputs/inputStyles.ts'],
            message: 'Import form chrome from @/theme/recipes.',
          },
          {
            group: ['@/theme/recipes/*'],
            message:
              'Import design recipes from @/theme/recipes (barrel only), not recipe subpaths.',
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
    files: ['src/theme/recipes/**/*.ts'],
    rules: {
      'max-lines': 'off',
      'no-restricted-syntax': ['error', {
        selector: 'Literal[value=/text-\\[\\d+px\\]/]',
        message: 'Use type-* utilities or recipes TYPE/TABLE_TYPE, not arbitrary px font sizes.',
      }, {
        selector: 'TemplateElement[value.raw=/text-\\[\\d+px\\]/]',
        message: 'Use type-* utilities or recipes TYPE/TABLE_TYPE, not arbitrary px font sizes.',
      }, {
        selector: 'Literal[value=/rounded-\\[/]',
        message: 'Use RADIUS from @/theme/recipes, not arbitrary rounded-[Npx].',
      }, {
        selector: 'TemplateElement[value.raw=/rounded-\\[/]',
        message: 'Use RADIUS from @/theme/recipes, not arbitrary rounded-[Npx].',
      }, {
        selector: 'Literal[value=/h-\\[34px\\]/]',
        message: 'Use CONTROL.height from @/theme/recipes.',
      }, {
        selector: 'TemplateElement[value.raw=/h-\\[34px\\]/]',
        message: 'Use CONTROL.height from @/theme/recipes.',
      }],
    },
  },
  {
    files: [
      'src/components/surfaces/Panel.tsx',
      'src/components/data-table/constants.ts',
      'src/components/display/DetailField.tsx',
      'src/components/display/DetailGroup.tsx',
      'src/components/display/DetailsTable.tsx',
      'src/features/**/config/*Table.config.tsx',
      'src/features/lab/utils/labResult.ts',
    ],
    rules: {
      'no-restricted-syntax': ['error', ...designTokenRestrictedSyntax],
    },
  },
  {
    files: ['src/components/**/*.{ts,tsx}', 'src/features/**/*.{ts,tsx}'],
    ignores: [
      'src/theme/recipes/**',
      'src/components/surfaces/Panel.tsx',
      'src/features/auth/**/*.{ts,tsx}',
      'src/features/lab/collection/SampleCollectionLabelActions.tsx',
    ],
    rules: {
      'no-restricted-syntax': ['error', ...allRestrictedSyntax, ...typeUtilityRestrictedSyntax, ...panelPresetRestrictedSyntax],
    },
  },
])
