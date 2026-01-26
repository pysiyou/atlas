/**
 * Automated Token Migration Script
 * Safely replaces design-system token usage with direct Tailwind classes
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Token replacement mappings
const TOKEN_REPLACEMENTS: Record<string, string> = {
  // Color tokens
  'brandColors.primary.icon': 'text-brand',
  'brandColors.primary.background': 'bg-brand',
  'brandColors.primary.text': 'text-brand',
  'brandColors.primary.border': 'border-brand',
  'brandColors.primary.focusRing': 'focus:ring-brand',
  
  'semanticColors.danger.icon': 'text-danger',
  'semanticColors.danger.errorText': 'text-danger',
  'semanticColors.danger.background': 'bg-danger',
  'semanticColors.danger.requiredIndicator': 'text-danger',
  'semanticColors.danger.borderLight': 'border-red-300',
  'semanticColors.danger.backgroundLight': 'bg-red-100',
  
  'semanticColors.success.icon': 'text-success',
  'semanticColors.success.background': 'bg-success',
  'semanticColors.success.borderLight': 'border-green-300',
  'semanticColors.success.backgroundLight': 'bg-green-100',
  
  'semanticColors.warning.icon': 'text-warning',
  'semanticColors.warning.valueHigh': 'text-warning',
  'semanticColors.warning.borderLight': 'border-yellow-300',
  'semanticColors.warning.backgroundLight': 'bg-yellow-100',
  
  'neutralColors.text.primary': 'text-text-primary',
  'neutralColors.text.secondary': 'text-text-secondary',
  'neutralColors.text.muted': 'text-text-muted',
  'neutralColors.text.disabled': 'text-text-disabled',
  'neutralColors.border.default': 'border-border',
  'neutralColors.border.medium': 'border-border-strong',
  
  // Sizing tokens
  'iconSizes.sm': 'w-4 h-4',
  'iconSizes.md': 'w-5 h-5',
  'iconSizes.lg': 'w-6 h-6',
  'filterControlSizing.height': 'h-[34px]',
  
  // Interaction tokens
  'hover.background': 'hover:bg-surface-hover',
  'hover.opacity': 'hover:opacity-90',
  'focus.outline': 'focus:outline-none',
  'transitions.colors': 'transition-colors duration-200',
  'transitions.all': 'transition-all duration-200',
  
  // Border tokens
  'radius.sm': 'rounded-sm',
  'radius.md': 'rounded-md',
  'radius.lg': 'rounded-lg',
  'border.divider': 'border-b border-border',
  
  // Typography
  'fontSize.xs': 'text-xs',
  'fontSize.sm': 'text-sm',
  'fontWeight.medium': 'font-medium',
  'fontWeight.semibold': 'font-semibold',
  'heading.h3': 'text-lg font-semibold text-text-primary',
  'heading.h2': 'text-2xl font-semibold text-text-primary',
  'body.muted': 'text-sm text-text-muted',
};

// Component token replacements (inline full structures)
const COMPONENT_REPLACEMENTS: Record<string, string> = {
  'mobileCard.base': 'bg-surface rounded-lg p-4 shadow-sm border border-border hover:shadow-md transition-shadow cursor-pointer',
  'mobileCard.header.container': 'mb-3',
  'mobileCard.header.title': 'text-base font-semibold text-text-primary',
  'mobileCard.content.container': 'space-y-2',
  'mobileCard.content.textSecondary': 'text-sm text-text-secondary',
  'mobileCard.footer.container': 'flex justify-between items-center mt-3 pt-3 border-t border-border',
  
  'labCard.base': 'bg-surface rounded-lg p-4 shadow-sm border border-border',
  
  'cardBase.base': 'bg-surface rounded-lg border border-border shadow-sm',
  'padding.card.sm': 'p-4',
  'padding.card.md': 'p-6',
  'padding.card.lg': 'p-8',
  
  'filterControl.trigger': 'h-[34px] px-3 bg-surface border border-border-strong rounded-md hover:bg-surface-hover focus:outline-none focus:border-brand transition-colors duration-200',
  
  'section.container': 'bg-surface rounded-lg p-6 shadow-sm border border-border',
  'section.heading': 'text-lg font-semibold text-text-primary mb-4',
  'section.content': 'space-y-4',
};

// Dropdown token replacements
const DROPDOWN_REPLACEMENTS: Record<string, string> = {
  'dropdown.trigger': 'h-[34px] px-3 bg-surface border border-border-strong rounded-md hover:bg-surface-hover focus:outline-none focus:border-brand transition-colors duration-200 cursor-pointer flex items-center justify-between gap-2',
  'dropdown.triggerOpen': 'border-brand',
  'dropdown.triggerDisabled': 'opacity-50 cursor-not-allowed',
  'dropdown.content': 'bg-surface border border-border rounded-md shadow-lg py-1 max-h-60 overflow-auto',
  'dropdown.item': 'px-3 py-2 text-sm hover:bg-surface-hover cursor-pointer transition-colors duration-150',
  'dropdown.itemSelected': 'bg-brand/10 text-brand',
  'dropdown.itemDisabled': 'opacity-50 cursor-not-allowed',
};

// Combine all replacements
const ALL_REPLACEMENTS = {
  ...TOKEN_REPLACEMENTS,
  ...COMPONENT_REPLACEMENTS,
  ...DROPDOWN_REPLACEMENTS,
};

async function migrateFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  
  // Sort replacements by length (longest first) to avoid partial replacements
  const sortedReplacements = Object.entries(ALL_REPLACEMENTS)
    .sort((a, b) => b[0].length - a[0].length);
  
  for (const [token, replacement] of sortedReplacements) {
    const regex = new RegExp(token.replace(/\./g, '\\.'), 'g');
    if (content.includes(token)) {
      content = content.replace(regex, replacement);
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  }
  
  return false;
}

async function main() {
  console.log('🚀 Starting automated token migration...\n');
  
  // Find all TypeScript files with token usage
  const files = await glob('src/**/*.{ts,tsx}', {
    ignore: ['**/node_modules/**', '**/dist/**'],
    absolute: true,
  });
  
  let migratedCount = 0;
  
  for (const file of files) {
    const relativePath = path.relative(process.cwd(), file);
    const wasMigrated = await migrateFile(file);
    
    if (wasMigrated) {
      console.log(`✅ Migrated: ${relativePath}`);
      migratedCount++;
    }
  }
  
  console.log(`\n✨ Migration complete! ${migratedCount}/${files.length} files updated`);
  console.log('\n⚠️  Next steps:');
  console.log('   1. Run: npm run build');
  console.log('   2. Fix any remaining errors manually');
  console.log('   3. Run: npm run lint');
  console.log('   4. Test the application');
}

main().catch(console.error);
