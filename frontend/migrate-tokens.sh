#!/bin/bash

# Migration script to remove design-system token imports
# This script removes import lines that reference the deleted token system

echo "Starting token migration..."

# Find all TypeScript/TSX files with design-system imports
files=$(grep -rl "from '@/shared/design-system" src/ --include="*.ts" --include="*.tsx")

for file in $files; do
  echo "Processing: $file"
  
  # Remove import lines for design-system tokens
  sed -i '' '/from.*@\/shared\/design-system/d' "$file"
  
  # Remove empty import blocks (lines with just "import {" followed by "}")
  sed -i '' '/^import {$/,/^}.*from/d' "$file"
done

echo "Migration complete. Please review changes and fix any broken references manually."
echo "Run 'npm run lint' to find remaining issues."
