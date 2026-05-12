import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const blockedPaths = [
  /^\.agent\//,
  /^\.agents\//,
  /^\.claude\//,
  /^\.codex\//,
  /^\.vscode\//,
  /^mcp\//,
  /^vendor\/.*\.tgz$/,
  /^PLAN\.md$/,
  /^docs\/liquid-glass\/implementation-log\.md$/,
  /^docs\/liquid-glass\/ops-debugging\.md$/,
  /^scripts\/flight_controller\.ts$/,
  /^scripts\/launch_sequence\.ts$/,
  /^scripts\/stabilization\.ts$/,
];

const ignoredPaths = new Set([
  'package-lock.json',
  'scripts/security/public-safety-scan.mjs',
  'docs/public-release.md',
]);

const binaryExtensions = new Set([
  '.ico',
  '.jpg',
  '.jpeg',
  '.mov',
  '.mp4',
  '.otf',
  '.pdf',
  '.png',
  '.ttf',
  '.webp',
]);

const blockedContent = [
  [/sbp_[a-z0-9]+/i, 'Supabase personal access token'],
  [/project_ref=/i, 'provider project ref'],
  [/mwomfejvkscbwbmhnzsh/i, 'known private Supabase project ref'],
  [/71f7b6ca-1256-4887-a817-3e05b6566911/i, 'known private Relay tenant id'],
  [/npm\.pkg\.github\.com/i, 'private package registry'],
  [/_authToken/i, 'package registry token config'],
  [/SUPABASE_MCP_BEARER_TOKEN/i, 'local MCP bearer token config'],
  [/BRAVE_API_KEY/i, 'local search API key config'],
  [/npm_[A-Za-z0-9]{30,}/, 'npm access token'],
  [/BEGIN [A-Z ]+PRIVATE KEY/, 'private key block'],
];

function extensionOf(path) {
  const dot = path.lastIndexOf('.');
  return dot >= 0 ? path.slice(dot).toLowerCase() : '';
}

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

const findings = [];

for (const file of files) {
  if (!existsSync(file)) continue;

  if (blockedPaths.some((pattern) => pattern.test(file))) {
    findings.push(`${file}: tracked private/internal path`);
    continue;
  }

  if (ignoredPaths.has(file) || binaryExtensions.has(extensionOf(file))) continue;

  let content = '';
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  for (const [pattern, reason] of blockedContent) {
    if (pattern.test(content)) findings.push(`${file}: ${reason}`);
  }
}

if (findings.length) {
  console.error('Public safety scan failed:');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log('Public safety scan passed.');
