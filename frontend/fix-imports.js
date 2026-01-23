#!/usr/bin/env node
/**
 * Script to fix duplicate imports by merging them
 */

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/types/test.ts',
  'src/utils/sampleHelpers.ts',
];

function fixDuplicateImports(filePath) {
  const fullPath = path.join(__dirname, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');
  
  const imports = {};
  const newLines = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    const importMatch = line.match(/^import\s+(?:type\s+)?{([^}]+)}\s+from\s+['"]([^'"]+)['"]/);
    const typeImportMatch = line.match(/^import\s+type\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/);
    
    if (importMatch || typeImportMatch) {
      const isTypeImport = !!typeImportMatch;
      const match = importMatch || typeImportMatch;
      const items = match[1].split(',').map(s => s.trim()).filter(Boolean);
      const source = match[2];
      const key = `${isTypeImport ? 'type:' : ''}${source}`;
      
      if (!imports[key]) {
        imports[key] = { items: [], isType: isTypeImport, source };
      }
      imports[key].items.push(...items);
      i++;
    } else {
      // Check if we've finished processing imports
      if (line && !line.startsWith('import') && Object.keys(imports).length > 0) {
        // Write all collected imports
        Object.values(imports).forEach(imp => {
          const uniqueItems = [...new Set(imp.items)];
          const typePrefix = imp.isType ? 'type ' : '';
          newLines.push(`import ${typePrefix}{ ${uniqueItems.join(', ')} } from '${imp.source}';`);
        });
        imports = {};
      }
      newLines.push(line);
      i++;
    }
  }
  
  fs.writeFileSync(fullPath, newLines.join('\n'));
  console.log(`Fixed: ${filePath}`);
}

filesToFix.forEach(fixDuplicateImports);
