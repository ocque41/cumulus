import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const targetArg = process.argv[2];

if (!targetArg) {
  console.error('Usage: npm run public:export -- <target-directory>');
  process.exit(1);
}

const target = resolve(process.cwd(), targetArg);
const targetRelativeToRoot = relative(root, target);

if (target === root || (!targetRelativeToRoot.startsWith('..') && !isAbsolute(targetRelativeToRoot))) {
  console.error('Choose a target directory outside this repo.');
  process.exit(1);
}

if (existsSync(target) && readdirSync(target).length > 0) {
  console.error(`Target directory is not empty: ${target}`);
  process.exit(1);
}

const blockedPaths = [
  /^\.agent\//,
  /^\.agents\//,
  /^\.claude\//,
  /^\.codex\//,
  /^\.vscode\//,
  /^mcp\//,
  /^mcp\.json$/,
  /^vendor\/.*\.tgz$/,
  /^PLAN\.md$/,
  /^docs\/liquid-glass\//,
  /^scripts\/flight_controller\.ts$/,
  /^scripts\/launch_sequence\.ts$/,
  /^scripts\/stabilization\.ts$/,
  /^temp_/,
];

const excludedPaths = [
  /^apps\/cumulus-db\/dist\//,
];

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd || root,
    encoding: options.encoding || 'utf8',
    stdio: options.stdio || 'pipe',
  });
}

function listExportFiles() {
  const output = [
    run('git', ['ls-files', '-z']),
    run('git', ['ls-files', '--others', '--exclude-standard', '-z']),
  ].join('');

  return Array.from(new Set(output.split('\0').filter(Boolean)))
    .filter((file) => !excludedPaths.some((pattern) => pattern.test(file)))
    .filter((file) => existsSync(resolve(root, file)))
    .filter((file) => statSync(resolve(root, file)).isFile())
    .sort();
}

run(process.execPath, ['scripts/security/public-safety-scan.mjs'], { stdio: 'inherit' });
run(process.execPath, ['scripts/security/license-boundary-check.mjs'], { stdio: 'inherit' });

const files = listExportFiles();
const blocked = files.filter((file) => blockedPaths.some((pattern) => pattern.test(file)));

if (blocked.length) {
  console.error('Public export blocked by private/internal paths:');
  for (const file of blocked) console.error(`- ${file}`);
  process.exit(1);
}

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });

for (const file of files) {
  const source = resolve(root, file);
  const destination = resolve(target, file);
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(source, destination);
}

run('git', ['init', '--initial-branch=main'], { cwd: target, stdio: 'inherit' });
run('git', ['add', '.'], { cwd: target, stdio: 'inherit' });
run(
  'git',
  [
    '-c',
    'user.name=Cumulus Release Bot',
    '-c',
    'user.email=release@cumulush.com',
    'commit',
    '-m',
    'Initial public release',
  ],
  { cwd: target, stdio: 'inherit' },
);

console.log(`Public export created at ${target}`);
