# Laboratory Catalog Scripts

This directory contains utility scripts for managing the laboratory test catalog.

## Catalog Enrichment Script

### Purpose

The `enrichCatalog.js` script transforms the raw Pan-African test catalog (`lab_test_catalog_full.json`) into an enriched version with application-specific fields.

### What It Does

1. **Maps Categories**: Converts 44 catalog categories → 10 app categories
   - Example: "Clinical Chemistry - Liver Function" → "biochemistry"

2. **Maps Sample Types**: Converts 26 catalog sample types → 7 app types
   - Example: "Serum (fasting)" → "blood"

3. **Parses Container Info**: Extracts container types and colors
   - Example: "EDTA tube (purple cap), 3 mL" → `{types: ["tube"], colors: ["purple"]}`

4. **Adds Pricing**: Assigns default prices by category (to be customized)
   - Hematology: $25, Biochemistry: $30, Serology: $50, etc.

### Usage

```bash
# From the frontend directory
node scripts/enrichCatalog.js
```

This will:
- Read `lab_test_catalog_full.json`
- Apply all mappings and transformations
- Generate `lab_test_catalog_enriched.json`
- Print a detailed report

### Output Fields Added

Each test in the enriched catalog will have these additional fields:

```json
{
  "mapped_category": "hematology",
  "mapped_sample_type": "blood",
  "container_types": ["tube"],
  "container_top_colors": ["purple"],
  "sample_volume_description": "3ml",
  "price_usd": 25.00,
  "enriched_at": "2026-01-12T..."
}
```

### Customization

To customize mappings or pricing:

1. Open `scripts/enrichCatalog.js`
2. Edit the mapping tables at the top:
   - `CATEGORY_MAP`
   - `SAMPLE_TYPE_MAP`
   - `DEFAULT_PRICING`
3. Re-run the script

### Report Output

The script generates a comprehensive report showing:
- Tests by category distribution
- Tests by sample type distribution
- Any unmapped values (warnings)
- Pricing summary by category
- Total tests processed

### Integration

After running the enrichment:

1. The enriched catalog is ready to use in the app
2. Import it in your seed data or context
3. All fields are pre-computed (no runtime transformation needed)
4. Update pricing in the JSON file as needed for your laboratory

### Maintenance

Run this script whenever:
- The source catalog (`lab_test_catalog_full.json`) is updated
- You need to adjust category mappings
- You want to update default pricing
- New sample types or categories are added
