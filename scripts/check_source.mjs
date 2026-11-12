// Syntax-check runtime, tooling and tests without a hand-maintained shell command.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function collect(folder) {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const path = join(folder, entry.name);
    return entry.isDirectory() ? collect(path) : /\.(?:js|cjs|mjs)$/.test(path) ? [path] : [];
  });
}

const files = [
  ...collect('src'),
  ...collect('tests'),
  ...collect('scripts'),
  'eslint.config.mjs',
  'playwright.config.cjs'
];
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log(`PASS: syntax for ${files.length} runtime, test and tooling files.`);
