import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const findings = [];

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function assert(condition, message) {
  if (!condition) findings.push(message);
}

const rootPackage = readJson('package.json');
const dbPackage = readJson('apps/cumulus-db/package.json');
const rootLicense = existsSync('LICENSE') ? readFileSync('LICENSE', 'utf8') : '';
const dbLicense = existsSync('apps/cumulus-db/LICENSE') ? readFileSync('apps/cumulus-db/LICENSE', 'utf8') : '';

assert(rootPackage.license === 'Apache-2.0', 'package.json must declare Apache-2.0 for the root app.');
assert(dbPackage.license === 'AGPL-3.0-only', 'apps/cumulus-db/package.json must declare AGPL-3.0-only.');
assert(rootLicense.includes('Apache License') && rootLicense.includes('Version 2.0'), 'root LICENSE must contain Apache-2.0 text.');
assert(
  dbLicense.includes('GNU AFFERO GENERAL PUBLIC LICENSE') && dbLicense.includes('Version 3'),
  'apps/cumulus-db/LICENSE must contain AGPL-3.0 text.',
);

const files = Array.from(
  new Set(
    [
      execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }),
      execFileSync('git', ['ls-files', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' }),
    ]
      .join('')
      .split('\0')
      .filter(Boolean),
  ),
);

const allowedBoundaryTooling = new Set([
  'scripts/security/license-boundary-check.mjs',
  'scripts/release/create-public-export.mjs',
]);

const agplImportPattern =
  /(?:from\s+|import\s*\(\s*|require\s*\(\s*)['"][^'"]*(?:@cumulus\/database|apps\/cumulus-db)[^'"]*['"]/;

for (const file of files) {
  if (!existsSync(file)) continue;

  if (file.startsWith('apps/cumulus-db/src/') && file.endsWith('.ts')) {
    const content = readFileSync(file, 'utf8');
    if (!content.startsWith('// SPDX-License-Identifier: AGPL-3.0-only')) {
      findings.push(`${file}: missing AGPL SPDX header`);
    }
  }

  if (!allowedBoundaryTooling.has(file) && !file.startsWith('apps/cumulus-db/') && /\.(c|m)?tsx?$|\.m?js$/.test(file)) {
    const content = readFileSync(file, 'utf8');
    if (agplImportPattern.test(content)) {
      findings.push(`${file}: Apache-side code must not import the AGPL database provider.`);
    }
  }
}

if (findings.length) {
  console.error('License boundary check failed:');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log('License boundary check passed.');
