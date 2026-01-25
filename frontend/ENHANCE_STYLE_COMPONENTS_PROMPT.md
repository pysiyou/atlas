# Enhance Style Components - Centralization Prompt

## Task
Enhance all style-related component properties (colors, text styles, sizes, spacing, borders, shadows) by centralizing them into a unified design token system.

## Current State
- Design tokens exist for colors, typography, spacing, borders, and shadows
- Components use tokens but may have inconsistent implementations
- Some style properties might still be hardcoded or duplicated

## Objectives

### 1. Centralize All Style Properties
- **Colors**: Ensure all color values (background, text, border, hover states) use centralized tokens
- **Text Styles**: Centralize font sizes, weights, line heights, letter spacing
- **Sizes**: Standardize component sizes (width, height, padding, margin, gap)
- **Borders**: Centralize border widths, styles, and radius values
- **Shadows**: Standardize all shadow/elevation values
- **Spacing**: Ensure consistent spacing scale across all components

### 2. Component-Specific Token Organization
- Create component-specific token files for each UI component type
- Group related style properties together (e.g., Button tokens, Input tokens, Card tokens)
- Ensure tokens are reusable and composable

### 3. Consistency Improvements
- Same component type = Same styles everywhere
- Same semantic meaning = Same color everywhere
- Same size category = Same dimensions everywhere
- Remove all hardcoded style values

### 4. Developer Experience
- Make tokens easy to discover and use
- Provide clear naming conventions
- Add TypeScript types for better autocomplete
- Include usage examples in comments

## What to Do

1. **Audit**: Review all components and identify:
   - Hardcoded color values
   - Inconsistent text styles
   - Duplicated size values
   - Non-standard spacing
   - Inconsistent borders/shadows

2. **Centralize**: Move all style values to appropriate token files:
   - Colors → `colors.ts`
   - Text → `typography.ts`
   - Sizes → Component-specific token files
   - Spacing → `spacing.ts`
   - Borders → `borders.ts`
   - Shadows → `shadows.ts`

3. **Standardize**: Ensure consistency:
   - All buttons use same size tokens
   - All inputs use same style tokens
   - All cards use same spacing tokens
   - All text uses same typography tokens

4. **Enhance**: Improve token system:
   - Add missing token variants
   - Create token aliases for common patterns
   - Add helper functions for token composition
   - Improve TypeScript types

## Files to Focus On

- `/src/shared/design-system/tokens/` - All token files
- `/src/shared/ui/` - Core UI components
- `/src/features/**/components/` - Feature components

## Success Criteria

- ✅ All style properties use centralized tokens
- ✅ No hardcoded colors, sizes, or spacing values
- ✅ Consistent styling across same component types
- ✅ Easy to update styles globally from token files
- ✅ Type-safe token access with autocomplete

## Expected Outcome

A fully centralized design system where:
- Changing a color in one place updates it everywhere
- Component styles are consistent and predictable
- Developers can easily find and use the right tokens
- The codebase is maintainable and scalable
