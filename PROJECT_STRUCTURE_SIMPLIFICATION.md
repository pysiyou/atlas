# Project Structure Simplification Plan

## Executive Summary

This document outlines a plan to simplify the Atlas frontend codebase from **~220 feature files** to approximately **~140 files** by eliminating duplication, removing unnecessary abstraction layers, and consolidating related components. The visual output will remain unchanged.

---

## Current State Analysis

### File Count by Feature

| Feature | Current Files | Target Files | Reduction |
|---------|---------------|--------------|-----------|
| Order | 55 | 35 | -20 |
| Lab | 52 | 32 | -20 |
| Patient | 48 | 30 | -18 |
| Filters | 26 | 12 | -14 |
| Payment | 16 | 12 | -4 |
| Catalog | 12 | 10 | -2 |
| Shared UI | 35 | 30 | -5 |

### Key Problems Identified

1. **Mobile Card Duplication** - Separate desktop/mobile components with 50%+ code overlap
2. **Filter Over-Abstraction** - 3-layer architecture (Controls → Wrappers → Feature) when 2 layers suffice
3. **InfoField Triplication** - Same component exists in 3 places
4. **Scattered Form Directories** - `components/forms/` AND `forms/` in same feature
5. **57 Index Files** - Excessive re-export files inflating file count
6. **Config Directory Bloat** - Separate `/config/` directories for 15-line constant files

---

## Proposed New Structure

### Feature Directory Template

Each feature should follow this simplified structure:

```
/features/{feature}/
├── components/           # UI components (responsive, no mobile variants)
│   ├── cards/           # Card components
│   ├── display/         # Read-only display components
│   └── filters/         # Feature-specific filter compositions
├── forms/               # All form-related components
├── modals/              # Modal components
├── pages/               # Route pages and table configs
├── hooks/               # Only complex, reusable hooks (max 3-4)
├── types.ts             # All feature types in one file
├── constants.ts         # All constants (eliminate /config/ dir)
└── utils.ts             # All utilities (or utils/ with max 2-3 files)
```

### Shared Directory Structure

```
/shared/
├── ui/
│   ├── atoms/           # Button, Input, Badge, Icon, Avatar
│   ├── composites/      # Card, Alert, Tabs, Select, etc.
│   ├── tables/          # Table system (consolidate 8 files → 4)
│   ├── modals/          # Modal system
│   └── layout/          # SectionContainer, etc.
├── components/
│   ├── InfoField.tsx    # Single source of truth
│   └── sections/        # Reusable section components
├── hooks/               # Shared hooks
├── utils/               # Shared utilities
└── context/             # React contexts
```

---

## Phase 1: High-Impact Consolidations (Priority: HIGH)

### 1.1 Eliminate Filter Wrapper Layer

**Problem**: Unnecessary abstraction layer adds 6 files with no value.

**Current** (3 layers):
```
filter-controls/SearchControl.tsx      # Layer 1: Actual UI
filters/SearchFilter.tsx               # Layer 2: Thin wrapper (REMOVE)
features/*/filters/*Filters.tsx        # Layer 3: Feature composition
```

**Target** (2 layers):
```
filter-controls/SearchControl.tsx      # Layer 1: Actual UI
features/*/filters/*Filters.tsx        # Layer 2: Use controls directly
```

**Files to Delete**:
- `features/filters/filters/SearchFilter.tsx`
- `features/filters/filters/DateRangeFilter.tsx`
- `features/filters/filters/AgeRangeFilter.tsx`
- `features/filters/filters/MultiSelectFilter.tsx`
- `features/filters/filters/PriceRangeFilter.tsx`
- `features/filters/filters/SingleSelectFilter.tsx`
- `features/filters/filters/index.ts`

**Migration**:
1. Update imports in feature filter files to use Controls directly
2. Move any unique logic from wrappers into controls
3. Delete wrapper files

**Files Saved**: 7

---

### 1.2 Consolidate Mobile Card Variants

**Problem**: Desktop and mobile cards are separate files with 50%+ code duplication.

**Current**:
```
lab/collection/CollectionCard.tsx          (282 lines)
lab/collection/CollectionMobileCard.tsx    (147 lines) ← MERGE INTO ABOVE
lab/entry/EntryCard.tsx                    (216 lines)
lab/entry/EntryMobileCard.tsx              (135 lines) ← MERGE INTO ABOVE
lab/validation/ValidationCard.tsx          (283 lines)
lab/validation/ValidationMobileCard.tsx    (263 lines) ← MERGE INTO ABOVE
```

**Target**:
```
lab/collection/CollectionCard.tsx          (responsive, ~300 lines)
lab/entry/EntryCard.tsx                    (responsive, ~250 lines)
lab/validation/ValidationCard.tsx          (responsive, ~350 lines)
```

**Migration Strategy**:
1. Create shared `useIsMobile()` hook or use existing
2. Merge mobile layout into desktop component using conditional rendering
3. Extract shared utilities (statusMapFromFlags, parseResultEntry) to `labUtils.ts`
4. Delete mobile variant files

**Example Pattern**:
```tsx
// Before: Separate files
// CollectionCard.tsx + CollectionMobileCard.tsx

// After: Single responsive component
const CollectionCard = ({ data }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (isMobile) {
    return <MobileLayout {...props} />;
  }
  return <DesktopLayout {...props} />;
};
```

**Files Saved**: 3

---

### 1.3 Unify InfoField Component

**Problem**: Same component exists in 3 places with minor variations.

**Current**:
```
shared/components/sections/InfoField.tsx        (67 lines) ← KEEP
features/order/components/display/OrderInfoField.tsx   (39 lines) ← DELETE
features/patient/components/display/InfoField.tsx      (27 lines) ← DELETE
```

**Target**:
```
shared/components/sections/InfoField.tsx        (enhanced, ~80 lines)
```

**Migration**:
1. Enhance shared InfoField to support all use cases (ReactNode values, optional icons)
2. Update imports in order and patient features
3. Delete feature-specific variants

**Files Saved**: 2

---

## Phase 2: Directory Consolidations (Priority: MEDIUM)

### 2.1 Merge Date Filter Components

**Problem**: Calendar date filter split across 3 tightly-coupled files.

**Current**:
```
order/components/filters/DateFilterHeader.tsx     (76 lines)
order/components/filters/DateFilterCalendar.tsx   (172 lines)
order/components/filters/DateFilterPresets.tsx    (50 lines)
```

**Target**:
```
order/components/filters/DateFilter.tsx           (~280 lines, internal subcomponents)
```

**Migration**:
1. Create single DateFilter with internal Header, Calendar, Presets sections
2. Keep as internal components if needed for readability
3. Export only the main DateFilter

**Files Saved**: 2

---

### 2.2 Consolidate Patient Display + Sections

**Problem**: Two directories serve similar purposes with unclear separation.

**Current**:
```
patient/components/display/
├── GeneralInfoSection.tsx
├── InfoField.tsx              ← DELETE (use shared)
├── MedicalHistorySectionDisplay.tsx
├── ReportsList.tsx
└── VitalSignsDisplay.tsx

patient/sections/
├── AffiliationInfoSection.tsx
├── MedicalHistorySection.tsx
├── OrderHistorySection.tsx
└── PatientInfoSection.tsx
```

**Target**:
```
patient/components/sections/
├── GeneralInfoSection.tsx
├── MedicalHistorySection.tsx  (merge display version)
├── AffiliationInfoSection.tsx
├── OrderHistorySection.tsx
├── VitalSignsSection.tsx
└── ReportsSection.tsx
```

**Migration**:
1. Move all to `components/sections/`
2. Merge `MedicalHistorySectionDisplay` into `MedicalHistorySection`
3. Rename for consistency (add Section suffix)
4. Delete empty `display/` and old `sections/` directories

**Files Saved**: 3 (plus cleaner structure)

---

### 2.3 Eliminate Config Directories

**Problem**: Separate `/config/` directories for small constant files.

**Current**:
```
features/catalog/config/catalogFilterConfig.ts
features/lab/config/collectionFilterConfig.ts
features/lab/config/labFilterConstants.ts
features/order/config/constants.ts
features/patient/config/constants.ts
```

**Target**:
```
features/catalog/constants.ts
features/lab/constants.ts         (merge both config files)
features/order/constants.ts
features/patient/constants.ts
```

**Migration**:
1. Move constants to feature root level
2. Merge multiple config files per feature into single constants.ts
3. Delete empty config directories

**Files Saved**: 5 directories eliminated

---

### 2.4 Resolve Order Forms Duplication

**Problem**: Forms in two locations with unclear separation.

**Current**:
```
order/components/forms/
├── OrderForm.tsx
├── PatientSelect.tsx
├── PaymentSection.tsx
└── TestSelect.tsx

order/forms/
├── OrderUpsertForm.tsx
├── OrderUpsertLayout.tsx
└── OrderSections.tsx
```

**Target**:
```
order/forms/
├── OrderForm.tsx              (merge from components/forms)
├── OrderUpsertForm.tsx
├── OrderUpsertLayout.tsx
├── sections/
│   ├── PatientSelect.tsx
│   ├── PaymentSection.tsx
│   ├── TestSelect.tsx
│   └── OrderSections.tsx
```

**Migration**:
1. Move all form components to `forms/`
2. Create `forms/sections/` for form sub-sections
3. Delete `components/forms/` directory

**Files Saved**: Cleaner structure (same file count)

---

## Phase 3: Index File Cleanup (Priority: LOW)

### 3.1 Reduce Index Files

**Problem**: 57 index files, many are trivial single-line re-exports.

**Current Pattern**:
```ts
// features/order/components/cards/index.ts
export * from './OrderCard';
export * from './OrderTableCard';
```

**Target Pattern**:
- Keep index files only for directories with 4+ exports
- Remove index files for 1-2 file directories
- Use direct imports for small directories

**Migration**:
1. Identify index files with ≤2 exports
2. Update imports to use direct paths
3. Delete trivial index files

**Estimated Reduction**: 57 → 20 index files

---

## Phase 4: Shared UI Reorganization (Priority: LOW)

### 4.1 Organize by Category

**Current** (flat structure, 35 files):
```
shared/ui/
├── Badge.tsx
├── Button.tsx
├── Table.tsx
├── TableActionMenu.tsx
├── Modal.tsx
├── ModalRenderer.tsx
├── ... 29 more files
```

**Target** (categorized):
```
shared/ui/
├── atoms/
│   ├── Badge.tsx
│   ├── Button.tsx
│   ├── Icon.tsx
│   ├── Input.tsx
│   └── Avatar.tsx
├── composites/
│   ├── Alert.tsx
│   ├── Card.tsx
│   ├── Select.tsx
│   └── Tabs.tsx
├── tables/
│   ├── Table.tsx
│   ├── TableHeader.tsx
│   ├── TableBody.tsx
│   └── TablePagination.tsx
├── modals/
│   ├── Modal.tsx
│   ├── ModalRenderer.tsx
│   └── modalRegistry.ts
└── layout/
    ├── SectionContainer.tsx
    └── TabbedSectionContainer.tsx
```

**Migration**: File moves only, no code changes needed.

---

## Phase 5: Utility Consolidation (Priority: LOW)

### 5.1 Reduce Utility File Count

**Target**: Maximum 2-3 utility files per feature.

**Order Feature**:
```
Current: dateFilterHelpers.ts, orderDetailUtils.ts, orderPayloadBuilder.ts, orderTimelineUtils.ts
Target:  orderUtils.ts (merge all), payloadBuilder.ts
```

**Patient Feature**:
```
Current: affiliationUtils.ts, formProgressCalculator.ts, patientDetailUtils.ts, patientPayloadBuilder.ts, patientValidation.ts
Target:  patientUtils.ts (merge detail + affiliation), payloadBuilder.ts, validation.ts
```

---

## Implementation Order

### Week 1: High-Impact, Low-Risk
1. [ ] Delete filter wrapper layer (Phase 1.1)
2. [ ] Unify InfoField component (Phase 1.3)
3. [ ] Eliminate config directories (Phase 2.3)

### Week 2: Card Consolidation
4. [ ] Consolidate CollectionCard + mobile variant (Phase 1.2)
5. [ ] Consolidate EntryCard + mobile variant (Phase 1.2)
6. [ ] Consolidate ValidationCard + mobile variant (Phase 1.2)

### Week 3: Directory Cleanup
7. [ ] Merge date filter components (Phase 2.1)
8. [ ] Consolidate patient display + sections (Phase 2.2)
9. [ ] Resolve order forms duplication (Phase 2.4)

### Week 4: Polish
10. [ ] Clean up index files (Phase 3.1)
11. [ ] Reorganize shared UI (Phase 4.1)
12. [ ] Consolidate utility files (Phase 5.1)

---

## Risk Assessment

| Change | Risk | Mitigation |
|--------|------|------------|
| Filter wrapper removal | Low | Wrappers are thin; test filter functionality |
| Mobile card merge | Medium | Thorough responsive testing required |
| InfoField unification | Low | Simple component; update all imports |
| Directory moves | Low | Update import paths; IDE refactoring |
| Index file cleanup | Low | Straightforward import path updates |

---

## Success Metrics

- **File Count**: ~220 → ~140 (36% reduction)
- **Duplicate Code**: Eliminate ~2,000 lines of duplication
- **Directory Depth**: Max 3 levels from feature root
- **Index Files**: 57 → 20
- **Visual Output**: Zero changes (verified by screenshot comparison)

---

## Files to Delete (Summary)

### Phase 1: 12 files
```
features/filters/filters/SearchFilter.tsx
features/filters/filters/DateRangeFilter.tsx
features/filters/filters/AgeRangeFilter.tsx
features/filters/filters/MultiSelectFilter.tsx
features/filters/filters/PriceRangeFilter.tsx
features/filters/filters/SingleSelectFilter.tsx
features/filters/filters/index.ts
features/lab/collection/CollectionMobileCard.tsx
features/lab/entry/EntryMobileCard.tsx
features/lab/validation/ValidationMobileCard.tsx
features/order/components/display/OrderInfoField.tsx
features/patient/components/display/InfoField.tsx
```

### Phase 2: 5 files + 4 directories
```
features/order/components/filters/DateFilterHeader.tsx
features/order/components/filters/DateFilterPresets.tsx
features/catalog/config/ (directory)
features/lab/config/ (directory)
features/order/config/ (directory)
features/patient/config/ (directory)
```

### Phase 3: ~37 index files
(To be identified during implementation)

---

## Notes

- All changes preserve existing functionality and visual appearance
- Each phase can be implemented independently
- Test thoroughly after each phase before proceeding
- Use feature flags if needed for gradual rollout
