#!/usr/bin/env node
/**
 * Count remaining raw semantic text-color classes in features (uniformity tracker).
 */
import { execSync } from 'node:child_process';

const pattern = 'text-text-(primary|secondary|tertiary|muted)';
const cmd = `rg -c "${pattern}" src/features --glob '*.tsx' --glob '*.ts' 2>/dev/null || true`;

try {
  const out = execSync(cmd, { encoding: 'utf8', cwd: new URL('..', import.meta.url).pathname });
  const lines = out.trim().split('\n').filter(Boolean);
  const total = lines.reduce((sum, line) => {
    const count = Number(line.split(':').pop());
    return sum + (Number.isFinite(count) ? count : 0);
  }, 0);
  console.log(`features/** ${pattern}: ${total} match(es) in ${lines.length} file(s)`);
  if (lines.length > 0) {
    console.log(out.trim());
  }
} catch {
  console.log('rg not available; skip inventory');
  process.exit(0);
}
