#!/usr/bin/env node

/**
 * Phase 1: Remove Barrel Files
 * This script removes all index.ts barrel files and updates imports
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all index.ts files
const barrelFiles = execSync('find src -type f -name "index.ts" -not -path "*/node_modules/*"', {
  cwd: process.cwd(),
  encoding: 'utf-8'
}).trim().split('\n').filter(Boolean);

console.log(`Found ${barrelFiles.length} barrel files\n`);

// Keep these barrel files (top-level aggregators)
const keepFiles = [
  'src/types/index.ts',
  'src/config/index.ts',
  'src/pages/index.ts',
  'src/hooks/queries/index.ts',
  'src/lib/query/index.ts',
];

const filesToDelete = barrelFiles.filter(file => !keepFiles.includes(file));

console.log(`Will delete ${filesToDelete.length} barrel files`);
console.log(`Will keep ${keepFiles.length} barrel files\n`);

// For each barrel file to delete, we need to:
// 1. Find what it exports
// 2. Find all files that import from it
// 3. Update those imports to point directly to the source
// 4. Delete the barrel file

filesToDelete.forEach((barrelFile, index) => {
  console.log(`[${index + 1}/${filesToDelete.length}] Processing: ${barrelFile}`);
  
  const barrelDir = path.dirname(barrelFile);
  const barrelContent = fs.readFileSync(barrelFile, 'utf-8');
  
  // Parse exports from the barrel file
  const exportMatches = barrelContent.matchAll(/export \{ ([^}]+) \} from ['"]\.\/([^'"]+)['"]/g);
  const exportMap = new Map();
  
  for (const match of exportMatches) {
    const exports = match[1].split(',').map(e => e.trim());
    const sourceFile = match[2];
    exports.forEach(exp => {
      // Handle "export { Foo as Bar }"
      const [original, alias] = exp.split(' as ').map(s => s.trim());
      exportMap.set(alias || original, sourceFile);
    });
  }
  
  // Also handle "export * from './file'"
  const exportAllMatches = barrelContent.matchAll(/export \* from ['"]\.\/([^'"]+)['"]/g);
  for (const match of exportAllMatches) {
    const sourceFile = match[1];
    // For export *, we need to read the source file to know what's exported
    const sourcePath = path.join(barrelDir, sourceFile + (sourceFile.endsWith('.ts') || sourceFile.endsWith('.tsx') ? '' : '.ts'));
    if (fs.existsSync(sourcePath)) {
      const sourceContent = fs.readFileSync(sourcePath, 'utf-8');
      const namedExports = sourceContent.matchAll(/export (?:const|function|class|interface|type|enum) (\w+)/g);
      for (const exp of namedExports) {
        exportMap.set(exp[1], sourceFile);
      }
    }
  }
  
  console.log(`  Found ${exportMap.size} exports`);
  
  // Find all files that import from this barrel
  const importPattern = barrelFile.replace('src/', '@/').replace('/index.ts', '');
  
  try {
    const grepResults = execSync(
      `grep -r "from '${importPattern}'" src --include="*.ts" --include="*.tsx" || true`,
      { cwd: process.cwd(), encoding: 'utf-8' }
    ).trim();
    
    if (grepResults) {
      const importingFiles = grepResults.split('\n').map(line => line.split(':')[0]).filter(Boolean);
      console.log(`  Found ${importingFiles.length} files importing from this barrel`);
      
      // Update each importing file
      importingFiles.forEach(importingFile => {
        let content = fs.readFileSync(importingFile, 'utf-8');
        let modified = false;
        
        // Find imports from this barrel
        const importRegex = new RegExp(`import \\{([^}]+)\\} from ['"]${importPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
        
        content = content.replace(importRegex, (match, imports) => {
          modified = true;
          const importList = imports.split(',').map(i => i.trim());
          const newImports = [];
          
          importList.forEach(imp => {
            const [importName] = imp.split(' as ');
            const sourceFile = exportMap.get(importName.trim());
            
            if (sourceFile) {
              const newImportPath = `${importPattern}/${sourceFile}`;
              newImports.push(`import { ${imp} } from '${newImportPath}'`);
            } else {
              console.warn(`    Warning: Could not find source for ${importName}`);
              newImports.push(match); // Keep original if we can't resolve
            }
          });
          
          return newImports.join(';\n');
        });
        
        if (modified) {
          fs.writeFileSync(importingFile, content);
          console.log(`    Updated: ${importingFile}`);
        }
      });
    }
  } catch (error) {
    console.log(`  No imports found (or grep error)`);
  }
});

console.log('\n✅ Import updates complete');
console.log('\nDeleting barrel files...');

filesToDelete.forEach(file => {
  fs.unlinkSync(file);
  console.log(`  Deleted: ${file}`);
});

console.log(`\n✅ Deleted ${filesToDelete.length} barrel files`);
console.log('\nRunning build to verify...');

try {
  execSync('npm run build', { cwd: process.cwd(), stdio: 'inherit' });
  console.log('\n✅ Build successful!');
} catch (error) {
  console.error('\n❌ Build failed. Please review errors above.');
  process.exit(1);
}
