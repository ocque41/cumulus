import fs from 'node:fs/promises';
import path from 'node:path';

const docsDir = path.resolve(process.cwd(), 'src', 'content', 'docs');

const requiredFrontmatterKeys = [
  'title',
  'description',
  'slug',
  'product',
  'audience',
  'order',
  'status',
  'lastUpdated',
];

const allowedProducts = new Set(['ecosystem', 'rune', 'enterprise', 'blocks', 'hub', 'notes']);
const allowedAudiences = new Set(['everyone', 'client', 'vendor', 'admin', 'worker', 'internal']);
const allowedStatuses = new Set(['active', 'building', 'coming-soon']);

const requiredSectionsByLocale = {
  en: [
    '## What this is',
    '## Why I built this',
    '## Who should use this',
    '## What you can do today',
    '## Quick start',
    '## Known limits and maturity',
  ],
  es: [
    '## Que es esto',
    '## Por que construi esto',
    '## Quien deberia usarlo',
    '## Lo que puedes hacer hoy',
    '## Inicio rapido',
    '## Limites conocidos y madurez',
  ],
};

const blockedPatterns = [
  /process\.env/gi,
  /service role/gi,
  /supabase/gi,
  /postgres/gi,
  /jwt/gi,
  /api key/gi,
  /private key/gi,
  /internal architecture/gi,
  /dependency injection/gi,
  /implementation detail/gi,
];

const jargonTerms = [
  'container orchestration',
  'schema migration',
  'http middleware',
  'daemon',
  'event bus',
  'runtime injector',
];

async function collectFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
      continue;
    }

    if (entry.name.endsWith('.en.mdx') || entry.name.endsWith('.es.mdx')) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return null;
  }

  const lines = match[1].split('\n');
  const frontmatter = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.includes(':')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf(':');
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    frontmatter[key] = value;
  }

  return frontmatter;
}

function extractContent(raw) {
  const match = raw.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)$/);
  return match ? match[1] : raw;
}

function sentenceWordAverage(text) {
  const sentences = text
    .replace(/\n+/g, ' ')
    .split(/[.!?]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (sentences.length === 0) {
    return 0;
  }

  const words = text
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  return words.length / sentences.length;
}

function countMatches(text, pattern) {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

function slugAndLocaleFromPath(filePath) {
  const relative = path.relative(docsDir, filePath).replace(/\\/g, '/');
  const localeMatch = relative.match(/\.(en|es)\.mdx$/);
  if (!localeMatch) {
    throw new Error(`Unsupported docs filename: ${relative}`);
  }

  const locale = localeMatch[1];
  const slug = relative.replace(/\.(en|es)\.mdx$/, '');

  return { slug, locale, relative };
}

async function main() {
  try {
    await fs.access(docsDir);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      console.log('Docs validation skipped: src/content/docs is not present.');
      return;
    }

    throw error;
  }

  const files = await collectFiles(docsDir);

  if (files.length === 0) {
    throw new Error('No documentation files found in src/content/docs.');
  }

  const issues = [];
  const localeMap = new Map();

  for (const filePath of files) {
    const raw = await fs.readFile(filePath, 'utf8');
    const { slug, locale, relative } = slugAndLocaleFromPath(filePath);

    const key = slug;
    if (!localeMap.has(key)) {
      localeMap.set(key, new Set());
    }
    localeMap.get(key).add(locale);

    const frontmatter = parseFrontmatter(raw);
    if (!frontmatter) {
      issues.push(`${relative}: missing frontmatter block.`);
      continue;
    }

    for (const requiredKey of requiredFrontmatterKeys) {
      if (!(requiredKey in frontmatter)) {
        issues.push(`${relative}: missing frontmatter key "${requiredKey}".`);
      }
    }

    if (frontmatter.slug && frontmatter.slug !== slug) {
      issues.push(`${relative}: frontmatter slug "${frontmatter.slug}" does not match path slug "${slug}".`);
    }

    if (frontmatter.product && !allowedProducts.has(frontmatter.product)) {
      issues.push(`${relative}: invalid product "${frontmatter.product}".`);
    }

    if (frontmatter.audience && !allowedAudiences.has(frontmatter.audience)) {
      issues.push(`${relative}: invalid audience "${frontmatter.audience}".`);
    }

    if (frontmatter.status && !allowedStatuses.has(frontmatter.status)) {
      issues.push(`${relative}: invalid status "${frontmatter.status}".`);
    }

    if (frontmatter.order && Number.isNaN(Number(frontmatter.order))) {
      issues.push(`${relative}: order must be numeric.`);
    }

    const content = extractContent(raw);

    for (const sectionHeading of requiredSectionsByLocale[locale]) {
      if (!content.includes(sectionHeading)) {
        issues.push(`${relative}: missing required section "${sectionHeading}".`);
      }
    }

    for (const pattern of blockedPatterns) {
      if (countMatches(content, pattern) > 0) {
        issues.push(`${relative}: contains blocked technical/internal pattern "${pattern}".`);
      }
    }

    const lowerContent = content.toLowerCase();
    const jargonHits = jargonTerms.filter((term) => lowerContent.includes(term));
    if (jargonHits.length > 0) {
      issues.push(`${relative}: contains jargon terms (${jargonHits.join(', ')}).`);
    }

    const avgWordsPerSentence = sentenceWordAverage(content);
    if (avgWordsPerSentence > 28) {
      issues.push(
        `${relative}: readability check failed (average words per sentence ${avgWordsPerSentence.toFixed(1)} > 28).`
      );
    }
  }

  for (const [slug, locales] of localeMap.entries()) {
    if (!locales.has('en')) {
      issues.push(`${slug}: missing English file.`);
    }

    if (!locales.has('es')) {
      issues.push(`${slug}: missing Spanish file.`);
    }
  }

  if (issues.length > 0) {
    console.error('Docs validation failed:');
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }

  console.log(`Docs validation passed for ${files.length} locale files.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
