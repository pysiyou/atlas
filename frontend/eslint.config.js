import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import unicorn from 'eslint-plugin-unicorn'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import {
  allRestrictedSyntax,
  designTokenRestrictedSyntax,
  hexColorLiteralSyntax,
  panelPresetRestrictedSyntax,
  typeUtilityRestrictedSyntax,
  featureSemanticTextRestrictedSyntax,
} from './eslint.restricted-syntax.mjs'

/** Shared import-boundary patterns (no dead-path or “removed API” guards — TS enforces those). */
const productImportPatterns = [
  {
    group: ['@/types/domain/**'],
    message: 'Use @/types, @/types/generated/*, or @/types/zod.',
  },
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
    message: 'Use @/features/lab/cross or @/features/lab/routes from outside lab; use relative imports inside features/lab.',
  },
  {
    group: ['@/lib/query/*'],
    message: 'Import from @/lib/query.',
  },
  {
    group: ['@/lib/api/*', '!@/lib/api/types', '!@/lib/api/types/**'],
    message: 'Import runtime API from @/lib/api; types from @/lib/api/types.',
  },
]

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
    plugins: {
      unicorn,
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
      'no-restricted-syntax': [
        'error',
        ...allRestrictedSyntax,
        {
          selector: 'TSQualifiedName[left.name="React"][right.name="FC"]',
          message:
            'Use export function Component(props: ComponentProps) instead of React.FC.',
        },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'prefer-arrow-callback': 'error',
      // Allow separate type and value imports from same source
      'no-duplicate-imports': 'off',

      // Naming and filename conventions (components: export function + PascalCase files)
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'variableLike', format: ['camelCase', 'PascalCase', 'UPPER_CASE'], leadingUnderscore: 'allow' },
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
        { selector: 'enumMember', format: ['PascalCase', 'UPPER_CASE'] },
      ],
      'unicorn/filename-case': [
        'error',
        {
          case: 'pascalCase',
          ignore: [
            String.raw`^index\.ts$`,
            String.raw`^main\.tsx$`,
            String.raw`^use[A-Z].*\.tsx?$`,
            String.raw`^[a-z].*\.config\.ts$`,
            String.raw`^[a-z].*\.ts$`,
            String.raw`^[a-z].*\.shared\.tsx$`,
            String.raw`^ui\.tsx$`,
            String.raw`^toast\.tsx$`,
            String.raw`^client\.ts$`,
            String.raw`^routes\.ts$`,
            String.raw`^types\.ts$`,
            String.raw`^constants\.ts$`,
            String.raw`^navigation\.ts$`,
            String.raw`^views\.ts$`,
            String.raw`^catalog\.ts$`,
            String.raw`^api\.ts$`,
            String.raw`^empty-html2canvas\.ts$`,
          ],
        },
      ],

      'no-restricted-imports': ['error', { patterns: productImportPatterns }],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}', 'src/app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [
          {
            name: '@/components',
            message: 'Import from @/components/<subpath> instead of the top-level barrel.',
          },
        ],
        patterns: productImportPatterns,
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
            group: ['@/utils/TableColumnRenders', '@/utils/TableColumnRenders.tsx'],
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
    files: ['src/types/generated/enums.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    files: ['src/types/generated/**', 'src/types/domain/**'],
    rules: {
      'max-lines': 'off',
    },
  },
  {
    files: ['src/config/**'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    files: ['src/lib/api/**', 'src/lib/query/**'],
    rules: {
      'no-restricted-imports': 'off',
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
      'src/components/feedback/SpinnerLoader.tsx',
      'src/features/auth/**/*.{ts,tsx}',
      'src/features/lab/collection/SampleCollectionLabelActions.tsx',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...allRestrictedSyntax,
        ...typeUtilityRestrictedSyntax,
        ...panelPresetRestrictedSyntax,
        ...hexColorLiteralSyntax,
      ],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...allRestrictedSyntax,
        ...typeUtilityRestrictedSyntax,
        ...panelPresetRestrictedSyntax,
        ...hexColorLiteralSyntax,
        ...featureSemanticTextRestrictedSyntax,
      ],
    },
  },
  {
    files: ['src/components/surfaces/LoadingPresets.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['src/features/shared/EntityPresentation.tsx', 'src/features/shared/presentationHooks.ts'],
    rules: {
      'react-refresh/only-export-components': 'off',
      'no-restricted-imports': 'off',
      'max-lines': 'off',
    },
  },
  {
    files: [
      'src/utils/presentation.ts',
      'src/features/reports/utils/reportPDFBody.ts',
      'src/features/lab/hooks/labQueueFilters.ts',
      'src/features/lab/workflow/shared/QueueCardLeftColumn.tsx',
      'src/features/lab/workflow/modals/DetailModal.ResultEntry.tsx',
      'src/features/lab/workflow/modals/DetailModal.SampleCollection.tsx',
      'src/features/lab/workflow/modals/DetailModal.TestDetail.tsx',
      'src/features/lab/collection/SampleCollectionPopover.tsx',
      'src/features/patients/api/patients.ts',
      'src/features/referent-doctors/components/ReferentDoctorSelect.tsx',
      'src/features/orders/hooks/useOrderUpsertModal.tsx',
      'src/components/data-table/TableViewParts.tsx',
    ],
    rules: {
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'complexity': 'off',
    },
  },
  {
    files: ['src/features/lab/workflow/modals/DetailModal.SampleCollection.View.tsx'],
    rules: {
      'max-lines-per-function': ['warn', { max: 160, skipComments: true, skipBlankLines: true }],
    },
  },
  {
    files: [
      'src/features/lab/components/ResultsParameterGrid.tsx',
      'src/features/patients/components/CareSnapshotSection.tsx',
      'src/features/reports/utils/prepareReportData.ts',
      'src/features/lab/utils/queueDisplay.ts',
    ],
    rules: {
      'max-lines-per-function': 'off',
      'complexity': 'off',
    },
  },
  {
    files: ['src/config/views.ts'],
    rules: {
      complexity: 'off',
    },
  },
  {
    files: ['src/hooks/filters.ts', 'src/icons/registry.ts'],
    rules: {
      'max-lines': 'off',
    },
  },
])
