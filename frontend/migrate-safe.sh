#!/bin/bash

# Safe token migration - replaces only whole-word token references

set -e

echo "🚀 Starting safe token migration..."

# Process TypeScript/TSX files
find src -name "*.tsx" -o -name "*.ts" | while read file; do
  # Skip if file doesn't contain token patterns
  if ! grep -q "brandColors\|semanticColors\|neutralColors\|mobileCard\|labCard\|section\.\|dropdown\." "$file" 2>/dev/null; then
    continue
  fi
  
  echo "Processing: $file"
  
  # Use perl for more precise replacements (respects word boundaries)
  perl -i -pe '
    # Color tokens - simple ones
    s/\bbrandColors\.primary\.icon\b/text-brand/g;
    s/\bbrandColors\.primary\.background\b/bg-brand/g;
    s/\bsemanticColors\.danger\.icon\b/text-danger/g;
    s/\bsemanticColors\.danger\.errorText\b/text-danger/g;
    s/\bsemanticColors\.danger\.requiredIndicator\b/text-danger/g;
    s/\bsemanticColors\.success\.icon\b/text-success/g;
    s/\bsemanticColors\.warning\.icon\b/text-warning/g;
    s/\bneutralColors\.text\.primary\b/text-text-primary/g;
    s/\bneutralColors\.text\.secondary\b/text-text-secondary/g;
    s/\bneutralColors\.text\.muted\b/text-text-muted/g;
    s/\bneutralColors\.text\.disabled\b/text-text-disabled/g;
    s/\bneutralColors\.border\.medium\b/border-border-strong/g;
    
    # Sizing
    s/\biconSizes\.sm\b/w-4 h-4/g;
    s/\biconSizes\.md\b/w-5 h-5/g;
    
    # Interactions
    s/\btransitions\.colors\b/transition-colors duration-200/g;
    s/\bhover\.background\b/hover:bg-surface-hover/g;
    s/\bfocus\.outline\b/focus:outline-none/g;
    
    # Borders
    s/\bradius\.md\b/rounded-md/g;
    s/\bradius\.lg\b/rounded-lg/g;
    s/\bborder\.divider\b/border-b border-border/g;
    
    # Typography
    s/\bfontSize\.xs\b/text-xs/g;
    s/\bfontSize\.sm\b/text-sm/g;
    s/\bfontWeight\.medium\b/font-medium/g;
    s/\bfontWeight\.semibold\b/font-semibold/g;
  ' "$file"
done

echo "✅ Safe migration complete!"
echo "Run 'npm run build' to check results."
