# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: catalog.spec.ts >> Catalog >> open test detail
- Location: e2e/catalog.spec.ts:15:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByRole('row').filter({ hasText: /HEM001|CBC/i }).first()

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]:
      - generic:
        - heading "CargoPlan" [level=1]
      - button "Expand Sidebar" [ref=e6] [cursor=pointer]
    - generic [ref=e11]:
      - navigation "Main navigation" [ref=e12]:
        - link [ref=e13] [cursor=pointer]:
          - /url: /dashboard
        - link [ref=e20] [cursor=pointer]:
          - /url: /patients
        - link [ref=e31] [cursor=pointer]:
          - /url: /orders
        - link [ref=e38] [cursor=pointer]:
          - /url: /laboratory
        - link [ref=e44] [cursor=pointer]:
          - /url: /payments
        - link [ref=e54] [cursor=pointer]:
          - /url: /reports
        - link [active] [ref=e61] [cursor=pointer]:
          - /url: /catalog
      - group "Settings" [ref=e70]:
        - button [disabled] [ref=e71]
        - button [disabled] [ref=e87]
        - button [disabled] [ref=e94]
    - button "Switch to light theme" [ref=e102]
    - button [ref=e109] [cursor=pointer]:
      - img "System Administrator" [ref=e112]
      - generic:
        - paragraph: System Administrator
        - paragraph: Administrator
  - main [ref=e113]:
    - generic [ref=e114]:
      - banner [ref=e115]:
        - heading "Test Catalog" [level=1] [ref=e117]
      - generic [ref=e118]:
        - generic [ref=e121]:
          - textbox "Search tests by name, code, or synonym..." [ref=e128]
          - generic [ref=e129]: Select test category
          - generic [ref=e145]: Select sample type
          - generic [ref=e159]: Filter by price range
        - generic [ref=e176]:
          - table [ref=e177]:
            - generic [ref=e178]:
              - generic [ref=e179]:
                - generic [ref=e180] [cursor=pointer]: Code
                - generic [ref=e182] [cursor=pointer]: Test Name
                - generic [ref=e184]: LOINC
                - generic [ref=e186] [cursor=pointer]: Category
                - generic [ref=e188] [cursor=pointer]: Sample Type
                - generic [ref=e190] [cursor=pointer]: Price
              - generic [ref=e192] [cursor=pointer]:
                - generic [ref=e193]: COAG002
                - generic [ref=e198]:
                  - generic [ref=e199]: Activated Partial Thromboplastin Time (aPTT)
                  - generic [ref=e200]: aPTT, APTT
                - generic [ref=e201]: 1994-3
                - generic [ref=e204]: COAGULATION
                - generic [ref=e207]: BLOOD
                - generic [ref=e210]: $35.00
              - generic [ref=e213] [cursor=pointer]:
                - generic [ref=e214]: MICRO001
                - generic [ref=e219]:
                  - generic [ref=e220]: AFB (Acid-Fast Bacilli) Sputum Smear - Ziehl-Neelsen
                  - generic [ref=e221]: TB Smear, AFB Microscopy
                - generic [ref=e222]: 12475-8
                - generic [ref=e225]: MICROBIOLOGY
                - generic [ref=e228]: SPUTUM
                - generic [ref=e231]: $45.00
              - generic [ref=e234] [cursor=pointer]:
                - generic [ref=e235]: CHEM014
                - generic [ref=e240]:
                  - generic [ref=e241]: Alanine Aminotransferase (ALT)
                  - generic [ref=e242]: SGPT, ALT
                - generic [ref=e243]: 1742-6
                - generic [ref=e246]: BIOCHEMISTRY
                - generic [ref=e249]: BLOOD
                - generic [ref=e252]: $30.00
              - generic [ref=e255] [cursor=pointer]:
                - generic [ref=e256]: CHEM020
                - generic [ref=e261]:
                  - generic [ref=e262]: Albumin (Serum)
                  - generic [ref=e263]: Serum Albumin
                - generic [ref=e264]: 1863-0
                - generic [ref=e267]: BIOCHEMISTRY
                - generic [ref=e270]: BLOOD
                - generic [ref=e273]: $30.00
              - generic [ref=e276] [cursor=pointer]:
                - generic [ref=e277]: CHEM016
                - generic [ref=e282]:
                  - generic [ref=e283]: Alkaline Phosphatase (ALP)
                  - generic [ref=e284]: ALP, Alkaline Phos
                - generic [ref=e285]: 1743-4
                - generic [ref=e288]: BIOCHEMISTRY
                - generic [ref=e291]: BLOOD
                - generic [ref=e294]: $30.00
              - generic [ref=e297] [cursor=pointer]:
                - generic [ref=e298]: CHEM026
                - generic [ref=e303]:
                  - generic [ref=e304]: Amylase (Serum)
                  - generic [ref=e305]: Serum Amylase, Amy
                - generic [ref=e306]: 1798-8
                - generic [ref=e309]: BIOCHEMISTRY
                - generic [ref=e312]: BLOOD
                - generic [ref=e315]: $30.00
              - generic [ref=e318] [cursor=pointer]:
                - generic [ref=e319]: SER005
                - generic [ref=e324]:
                  - generic [ref=e325]: Anti-HBc (Hepatitis B Core Antibody)
                  - generic [ref=e326]: Hepatitis B Core Antibody
                - generic [ref=e327]: 5196-1
                - generic [ref=e330]: SEROLOGY
                - generic [ref=e333]: BLOOD
                - generic [ref=e336]: $50.00
              - generic [ref=e339] [cursor=pointer]:
                - generic [ref=e340]: SER006
                - generic [ref=e345]:
                  - generic [ref=e346]: Anti-HBs (Hepatitis B Surface Antibody)
                  - generic [ref=e347]: Hepatitis B Surface Antibody
                - generic [ref=e348]: 5194-6
                - generic [ref=e351]: SEROLOGY
                - generic [ref=e354]: BLOOD
                - generic [ref=e357]: $50.00
              - generic [ref=e360] [cursor=pointer]:
                - generic [ref=e361]: SER007
                - generic [ref=e366]:
                  - generic [ref=e367]: Anti-HCV (Hepatitis C Antibody)
                  - generic [ref=e368]: HCV Antibody
                - generic [ref=e369]: 7905-9
                - generic [ref=e372]: SEROLOGY
                - generic [ref=e375]: BLOOD
                - generic [ref=e378]: $50.00
              - generic [ref=e381] [cursor=pointer]:
                - generic [ref=e382]: CHEM015
                - generic [ref=e387]:
                  - generic [ref=e388]: Aspartate Aminotransferase (AST)
                  - generic [ref=e389]: SGOT, AST
                - generic [ref=e390]: 1920-8
                - generic [ref=e393]: BIOCHEMISTRY
                - generic [ref=e396]: BLOOD
                - generic [ref=e399]: $30.00
              - generic [ref=e402] [cursor=pointer]:
                - generic [ref=e403]: ENDO001
                - generic [ref=e408]:
                  - generic [ref=e409]: Beta-hCG (Human Chorionic Gonadotropin) - Serum Quantitative
                  - generic [ref=e410]: Serum hCG, Quantitative hCG
                - generic [ref=e411]: 2118-8
                - generic [ref=e414]: BIOCHEMISTRY
                - generic [ref=e417]: BLOOD
                - generic [ref=e420]: $30.00
              - generic [ref=e423] [cursor=pointer]:
                - generic [ref=e424]: CHEM010
                - generic [ref=e429]:
                  - generic [ref=e430]: Bicarbonate / Total CO2
                  - generic [ref=e431]: HCO3, CO2 (serum)
                - generic [ref=e432]: 2028-9
                - generic [ref=e435]: BIOCHEMISTRY
                - generic [ref=e438]: BLOOD
                - generic [ref=e441]: $30.00
              - generic [ref=e444] [cursor=pointer]:
                - generic [ref=e445]: CHEM019
                - generic [ref=e450]:
                  - generic [ref=e451]: Bilirubin - Direct (Conjugated)
                  - generic [ref=e452]: Direct Bilirubin, DBIL
                - generic [ref=e453]: 1968-7
                - generic [ref=e456]: BIOCHEMISTRY
                - generic [ref=e459]: BLOOD
                - generic [ref=e462]: $30.00
              - generic [ref=e465] [cursor=pointer]:
                - generic [ref=e466]: CHEM018
                - generic [ref=e471]:
                  - generic [ref=e472]: Bilirubin - Total
                  - generic [ref=e473]: Total Bilirubin, TBIL
                - generic [ref=e474]: 1975-2
                - generic [ref=e477]: BIOCHEMISTRY
                - generic [ref=e480]: BLOOD
                - generic [ref=e483]: $30.00
              - generic [ref=e486] [cursor=pointer]:
                - generic [ref=e487]: HEMA002
                - generic [ref=e492]:
                  - generic [ref=e493]: Blood Cross-Match (Compatibility Test)
                  - generic [ref=e494]: Serological Cross-match, Major Cross-match
                - generic [ref=e495]: 5808-8
                - generic [ref=e498]: HEMATOLOGY
                - generic [ref=e501]: BLOOD
                - generic [ref=e504]: $25.00
              - generic [ref=e507] [cursor=pointer]:
                - generic [ref=e508]: MICRO005
                - generic [ref=e513]:
                  - generic [ref=e514]: Blood Culture (Aerobic and Anaerobic)
                  - generic [ref=e515]: Septic Workup, Bacteremia Culture
                - generic [ref=e516]: 27853-3
                - generic [ref=e519]: MICROBIOLOGY
                - generic [ref=e522]: BLOOD
                - generic [ref=e525]: $45.00
              - generic [ref=e528] [cursor=pointer]:
                - generic [ref=e529]: HEMA001
                - generic [ref=e534]:
                  - generic [ref=e535]: Blood Grouping - ABO and Rh D System
                  - generic [ref=e536]: Blood Group, Blood Type +1 more
                - generic [ref=e537]: 883-4
                - generic [ref=e540]: HEMATOLOGY
                - generic [ref=e543]: BLOOD
                - generic [ref=e546]: $25.00
              - generic [ref=e549] [cursor=pointer]:
                - generic [ref=e550]: CHEM005
                - generic [ref=e555]:
                  - generic [ref=e556]: Blood Urea Nitrogen (BUN)
                  - generic [ref=e557]: Urea, Serum Urea
                - generic [ref=e558]: 3094-0
                - generic [ref=e561]: BIOCHEMISTRY
                - generic [ref=e564]: BLOOD
                - generic [ref=e567]: $30.00
              - generic [ref=e570] [cursor=pointer]:
                - generic [ref=e571]: CHEM028
                - generic [ref=e576]:
                  - generic [ref=e577]: C-Reactive Protein (CRP)
                  - generic [ref=e578]: CRP, hs-CRP
                - generic [ref=e579]: 1988-5
                - generic [ref=e582]: BIOCHEMISTRY
                - generic [ref=e585]: BLOOD
                - generic [ref=e588]: $30.00
              - generic [ref=e591] [cursor=pointer]:
                - generic [ref=e592]: CHEM011
                - generic [ref=e597]:
                  - generic [ref=e598]: Calcium (Serum) - Total
                  - generic [ref=e599]: Total Calcium, Ca
                - generic [ref=e600]: 2000-8
                - generic [ref=e603]: BIOCHEMISTRY
                - generic [ref=e606]: BLOOD
                - generic [ref=e609]: $30.00
          - generic [ref=e613]:
            - generic [ref=e614]:
              - generic [ref=e615]:
                - generic [ref=e616]: Rows per page
                - combobox "Rows per page" [ref=e617] [cursor=pointer]:
                  - option "10" [selected]
                  - option "25"
                  - option "50"
                  - option "100"
                  - option "All"
              - generic [ref=e618]: 1–20 of 87
            - generic [ref=e619]:
              - button "Previous page" [disabled] [ref=e620]
              - generic [ref=e624]:
                - button "Page 1, current" [ref=e625]: "1"
                - button "Go to page 2" [ref=e626]: "2"
                - button "Go to page 3" [ref=e627]: "3"
                - button "Go to page 4" [ref=e628]: "4"
                - button "Go to page 5" [ref=e629]: "5"
              - button "Next page" [ref=e630]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { login, navigateSidebar } from './helpers';
  3  | 
  4  | test.describe('Catalog', () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await login(page, 'admin');
  7  |     await navigateSidebar(page, 'Catalog');
  8  |   });
  9  | 
  10 |   test('list shows tests', async ({ page }) => {
  11 |     await expect(page.locator('main')).toBeVisible();
  12 |     await expect(page.getByText(/HEM001|CBC|blood/i).first()).toBeVisible({ timeout: 15_000 });
  13 |   });
  14 | 
  15 |   test('open test detail', async ({ page }) => {
> 16 |     await page.getByRole('row').filter({ hasText: /HEM001|CBC/i }).first().click();
     |                                                                            ^ Error: locator.click: Test timeout of 60000ms exceeded.
  17 |     await expect(page).toHaveURL(/catalog\/HEM001/, { timeout: 10_000 });
  18 |   });
  19 | 
  20 |   test('search catalog', async ({ page }) => {
  21 |     const s = page.getByPlaceholder(/search/i).first();
  22 |     if (await s.isVisible()) {
  23 |       await s.fill('glucose');
  24 |       await page.waitForTimeout(500);
  25 |     }
  26 |   });
  27 | });
  28 | 
```