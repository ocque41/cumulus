import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const marketingContentDir = path.join(root, 'src', 'content', 'marketing');
const localizedSourceFiles = [path.join(root, 'src', 'lib', 'marketing', 'product-briefs.ts')];

const bannedJargon = [
  'kubernetes',
  'middleware pipeline',
  'dependency injection',
  'postgres replication',
  'jwt signing',
  'service role',
  'private key',
];

const claimTerms = ['#1', 'best in class', 'guaranteed', 'millions of users', 'unlimited forever'];

const issues = [];

async function listMarketingContentFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listMarketingContentFiles(fullPath)));
    } else if (entry.isFile() && fullPath.endsWith('.mdx')) {
      files.push(fullPath);
    }
  }

  return files;
}

const files = [...localizedSourceFiles, ...(await listMarketingContentFiles(marketingContentDir))];

for (const filePath of files) {
  const content = await fs.readFile(filePath, 'utf8');
  const relative = path.relative(root, filePath);

  if (localizedSourceFiles.includes(filePath) && (!content.includes('en:') || !content.includes('es:'))) {
    issues.push(`${relative}: missing EN/ES localization blocks.`);
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
