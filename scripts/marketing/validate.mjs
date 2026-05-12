import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const files = [
  path.join(root, 'src', 'lib', 'marketing', 'content.ts'),
  path.join(root, 'src', 'lib', 'marketing', 'product-briefs.ts'),
];

const requiredMarkers = [
  'homeContent',
  'modelsContent',
  'selectorPersonas',
  'dailyFlowSteps',
  'purchaseSteps',
  'visionLines',
];

const bannedJargon = [
  'kubernetes',
  'middleware pipeline',
  'dependency injection',
  'postgres replication',
  'jwt signing',
  'service role',
  'private key',
  'api key',
];

const claimTerms = ['#1', 'best in class', 'guaranteed', 'millions of users', 'unlimited forever'];

const issues = [];

for (const filePath of files) {
  const content = await fs.readFile(filePath, 'utf8');
  const relative = path.relative(root, filePath);

  if (!content.includes('en:') || !content.includes('es:')) {
    issues.push(`${relative}: missing EN/ES localization blocks.`);
  }

  for (const marker of requiredMarkers) {
    if (filePath.endsWith('content.ts') && !content.includes(marker)) {
      issues.push(`${relative}: missing required marker "${marker}".`);
    }
  }

  const lower = content.toLowerCase();

  for (const term of bannedJargon) {
    if (lower.includes(term.toLowerCase())) {
      issues.push(`${relative}: contains banned technical term "${term}".`);
    }
  }

  const lines = content.split('\n');
  lines.forEach((line, index) => {
    const lineLower = line.toLowerCase();
    for (const term of claimTerms) {
      if (lineLower.includes(term) && !lineLower.includes('[source:')) {
        issues.push(`${relative}:${index + 1}: claim term "${term}" must include [source: ...].`);
      }
    }
  });
}

if (issues.length > 0) {
  console.error('Marketing validation failed:');
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('Marketing validation passed.');
