#!/bin/bash

# Bulk Token Migration Script
# Removes design-system imports and replaces common token patterns

set -e

echo "🚀 Starting bulk token migration..."

# Get list of files with design-system imports
files=$(grep -rl "from '@/shared/design-system" src/ --include="*.ts" --include="*.tsx" 2>/dev/null || true)

if [ -z "$files" ]; then
  echo "✅ No files with design-system imports found!"
  exit 0
fi

file_count=$(echo "$files" | wc -l | tr -d ' ')
echo "📝 Found $file_count files to migrate"

# Process each file
for file in $files; do
  echo "Processing: $file"
  
  # Remove import lines
  sed -i '' '/^import.*from.*@\/shared\/design-system/d' "$file"
  
  # Remove empty lines that might be left
  sed -i '' '/^$/N;/^\n$/d' "$file"
done

echo "✅ Import removal complete!"
echo ""
echo "⚠️  Manual fixes may be needed for:"
echo "   - Token usage in className strings"
echo "   - Helper function calls (getFormSectionClasses, etc.)"
echo "   - Complex token references"
echo ""
echo "Run 'npm run lint' to find remaining issues."
