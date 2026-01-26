#!/bin/bash

# Fix common token usage patterns across all files

set -e

echo "🔧 Fixing token usage patterns..."

# Get files with token usage
files=$(grep -rl "\(mobileCard\|brandColors\|semanticColors\|neutralColors\|filterControlSizing\|iconSizes\|dropdown\|labCard\|cardBase\|section\.\|getFormSectionClasses\|getInputClasses\)" src/ --include="*.tsx" --include="*.ts" 2>/dev/null || true)

if [ -z "$files" ]; then
  echo "✅ No token usage found!"
  exit 0
fi

for file in $files; do
  echo "Fixing: $file"
  
  # Replace common color tokens
  sed -i '' 's/brandColors\.primary\.icon/text-brand/g' "$file"
  sed -i '' 's/brandColors\.primary\.background/bg-brand/g' "$file"
  sed -i '' 's/brandColors\.primary\.text/text-brand/g' "$file"
  sed -i '' 's/semanticColors\.danger\.icon/text-danger/g' "$file"
  sed -i '' 's/semanticColors\.danger\.errorText/text-danger/g' "$file"
  sed -i '' 's/semanticColors\.danger\.background/bg-danger/g' "$file"
  sed -i '' 's/semanticColors\.success\.icon/text-success/g' "$file"
  sed -i '' 's/semanticColors\.success\.background/bg-success/g' "$file"
  sed -i '' 's/semanticColors\.warning\.icon/text-warning/g' "$file"
  sed -i '' 's/neutralColors\.text\.primary/text-text-primary/g' "$file"
  sed -i '' 's/neutralColors\.text\.secondary/text-text-secondary/g' "$file"
  sed -i '' 's/neutralColors\.text\.muted/text-text-muted/g' "$file"
  sed -i '' 's/neutralColors\.text\.disabled/text-text-disabled/g' "$file"
  sed -i '' 's/neutralColors\.border\.default/border-border/g' "$file"
  sed -i '' 's/neutralColors\.border\.medium/border-border-strong/g' "$file"
  
  # Replace sizing tokens
  sed -i '' 's/iconSizes\.sm/w-4 h-4/g' "$file"
  sed -i '' 's/iconSizes\.md/w-5 h-5/g' "$file"
  sed -i '' 's/filterControlSizing\.height/h-\[34px\]/g' "$file"
  
  # Replace interaction tokens
  sed -i '' 's/hover\.background/hover:bg-surface-hover/g' "$file"
  sed -i '' 's/hover\.opacity/hover:opacity-90/g' "$file"
  sed -i '' 's/focus\.outline/focus:outline-none/g' "$file"
  sed -i '' 's/transitions\.colors/transition-colors duration-200/g' "$file"
  sed -i '' 's/transitions\.all/transition-all duration-200/g' "$file"
  
  # Replace border tokens
  sed -i '' 's/radius\.sm/rounded-sm/g' "$file"
  sed -i '' 's/radius\.md/rounded-md/g' "$file"
  sed -i '' 's/radius\.lg/rounded-lg/g' "$file"
  sed -i '' 's/border\.divider/border-b border-border/g' "$file"
  
  # Replace typography tokens
  sed -i '' 's/fontSize\.xs/text-xs/g' "$file"
  sed -i '' 's/fontSize\.sm/text-sm/g' "$file"
  sed -i '' 's/fontWeight\.medium/font-medium/g' "$file"
  sed -i '' 's/fontWeight\.semibold/font-semibold/g' "$file"
  
  # Replace card tokens with inline styles
  sed -i '' 's/mobileCard\.base/bg-surface rounded-lg p-4 shadow-sm border border-border hover:shadow-md transition-shadow cursor-pointer/g' "$file"
  sed -i '' 's/mobileCard\.header\.container/mb-3/g' "$file"
  sed -i '' 's/mobileCard\.header\.title/text-base font-semibold text-text-primary/g' "$file"
  sed -i '' 's/mobileCard\.content\.container/space-y-2/g' "$file"
  sed -i '' 's/mobileCard\.content\.textSecondary/text-sm text-text-secondary/g' "$file"
  sed -i '' 's/mobileCard\.footer\.container/flex justify-between items-center mt-3 pt-3 border-t border-border/g' "$file"
  
  # Replace lab card tokens
  sed -i '' 's/labCard\.base/bg-surface rounded-lg p-4 shadow-sm border border-border/g' "$file"
  
  # Remove undefined variables (section.container etc) - these need manual review
  # We'll just comment them for now
done

echo "✅ Token usage patterns fixed!"
echo ""
echo "⚠️  Some patterns may need manual review:"
echo "   - section.container/heading/content"
echo "   - dropdown.* patterns" 
echo "   - Complex nested token references"
echo ""
echo "Run 'npm run build' to check for remaining errors."
