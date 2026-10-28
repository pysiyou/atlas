#!/usr/bin/env node
/**
 * Atlas cross-stack codegen — generates Python and TypeScript from contracts/.
 *
 * Human-edited: enums.json, lab.json, container-catalog.json, test-catalog.json,
 * feedback.json, audit-events.json.
 * Generated: openapi.json (FastAPI export).
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateAuditEvents, verifyAuditCatalogCoverage } from './lib/audit-events.mjs';
import { generateContainerCatalog } from './lib/container-catalog.mjs';
import { generateEnums } from './lib/domain-enums.mjs';
import { generateFeedbackContract } from './lib/feedback-contract.mjs';
import { generateLabContract } from './lib/lab-contract.mjs';
import { CONTRACTS, ROOT } from './lib/read-contract.mjs';
import { generateTestCatalogMeta } from './lib/test-catalog-meta.mjs';
import { validateAllContracts } from './lib/validate-contracts.mjs';

validateAllContracts();
generateLabContract();
generateEnums();
generateContainerCatalog();
generateFeedbackContract();
generateAuditEvents();
generateTestCatalogMeta();
verifyAuditCatalogCoverage();
if (process.env.ATLAS_CODEGEN_SKIP_OPENAPI !== '1') {
  generateOpenApiTypes();
} else {
  console.log('skip OpenAPI types (ATLAS_CODEGEN_SKIP_OPENAPI=1)');
}
console.log('codegen complete');

function exportOpenApiSpec() {
  const openapiPath = path.join(CONTRACTS, 'openapi.json');
  const output = execSync(
    'poetry run python -c "import json; from app.main import app; print(json.dumps(app.openapi()))"',
    {
      cwd: path.join(ROOT, 'backend'),
      encoding: 'utf8',
      shell: true,
    },
  );
  fs.mkdirSync(CONTRACTS, { recursive: true });
  fs.writeFileSync(openapiPath, output);
  console.log('wrote contracts/openapi.json');
  return openapiPath;
}

function generateOpenApiTypes() {
  try {
    const openapiPath = exportOpenApiSpec();
    const outPath = path.join(ROOT, 'frontend/src/lib/api/types/generated/api.d.ts');
    execSync(`npx openapi-typescript ${JSON.stringify(openapiPath)} -o ${JSON.stringify(outPath)}`, {
      cwd: path.dirname(fileURLToPath(import.meta.url)),
      stdio: 'inherit',
    });
    console.log('wrote frontend/src/lib/api/types/generated/api.d.ts');
  } catch (error) {
    console.warn('skip OpenAPI types (backend unavailable or openapi-typescript failed):', error.message);
  }
}
