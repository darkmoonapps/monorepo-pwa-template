import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, extname, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const MIN_NODE_VERSION = '22.0.0';
export const MIN_PNPM_VERSION = '10.0.0';
export const PLACEHOLDER_PROJECT_NAME = 'app';
export const DEFAULT_PNPM_PREPARE = 'pnpm@10.33.4';
export const POSTGRES_HEALTH_TIMEOUT_MS = 90_000;
export const POSTGRES_HEALTH_INTERVAL_MS = 2_000;

export const SKIP_DIRECTORY_NAMES = new Set([
  '.git',
  'node_modules',
  'dist',
  'coverage',
  '.turbo',
  'storybook-static',
  'playwright-report',
  'test-results',
  '.pnpm-store',
]);

export const RENAMABLE_EXTENSIONS = new Set([
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.json',
  '.md',
  '.mdc',
  '.mjs',
  '.prisma',
  '.sql',
  '.toml',
  '.ts',
  '.tsx',
  '.txt',
  '.yaml',
  '.yml',
]);

export const DEFAULT_ENV_FILES = [
  { example: 'apps/api/.env.example', dest: 'apps/api/.env' },
  { example: 'apps/web/.env.example', dest: 'apps/web/.env' },
];

const RESERVED_PROJECT_NAMES = new Set([
  'app',
  'api',
  'web',
  'shared',
  'ui',
  'test',
  'src',
  'node',
  'pnpm',
]);

const PROJECT_NAME_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export class SetupError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = 'SetupError';
  }
}

/**
 * @param {string[]} args
 * @returns {{
 *   help?: boolean,
 *   rename?: string,
 *   error?: string,
 * }}
 */
export function parseCliArgs(args) {
  /** @type {{ help?: boolean, rename?: string, error?: string }} */
  const result = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--help' || arg === '-h') {
      result.help = true;
      continue;
    }

    if (arg === '--rename') {
      const value = args[index + 1];
      if (value === undefined || value.startsWith('-')) {
        return { error: 'Expected a project name after --rename.' };
      }
      result.rename = value;
      index += 1;
      continue;
    }

    if (arg.startsWith('--rename=')) {
      const value = arg.slice('--rename='.length);
      if (value.length === 0) {
        return { error: 'Expected a project name after --rename=' };
      }
      result.rename = value;
      continue;
    }

    return { error: `Unknown argument: ${arg}` };
  }

  return result;
}

/**
 * @param {string | undefined} name
 * @returns {{ ok: true, name: string } | { ok: false, error: string }}
 */
export function validateProjectName(name) {
  if (typeof name !== 'string' || name.trim().length === 0) {
    return {
      ok: false,
      error: 'Project name is required after --rename.',
    };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return {
      ok: false,
      error: 'Project name must be at least 2 characters.',
    };
  }

  if (trimmed.length > 50) {
    return {
      ok: false,
      error: 'Project name is too long (max 50 characters).',
    };
  }

  if (trimmed.startsWith('@') || trimmed.includes('/')) {
    return {
      ok: false,
      error:
        'Pass the unscoped name only. --rename acme becomes @acme/web, @acme/api, …',
    };
  }

  if (!PROJECT_NAME_PATTERN.test(trimmed)) {
    return {
      ok: false,
      error:
        'Project name must be lowercase letters, digits, and hyphens (npm package name). Example: acme-pwa',
    };
  }

  if (RESERVED_PROJECT_NAMES.has(trimmed)) {
    return {
      ok: false,
      error: `The name "${trimmed}" is reserved. Choose a product name such as acme-pwa.`,
    };
  }

  return { ok: true, name: trimmed };
}

/**
 * @param {string} slug
 * @returns {string}
 */
export function toTitleCase(slug) {
  return slug
    .split('-')
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * @param {string} projectName
 * @returns {{ from: string, to: string }[]}
 */
export function createRenameReplacements(projectName) {
  const title = toTitleCase(projectName);

  return [
    {
      from: 'app-example-query-cache',
      to: `${projectName}-example-query-cache`,
    },
    { from: 'app-postgres', to: `${projectName}-postgres` },
    { from: 'app-api', to: `${projectName}-api` },
    { from: 'app-ui', to: `${projectName}-ui` },
    { from: '@app/', to: `@${projectName}/` },
    {
      from: 'postgresql://app:app_dev@localhost:5432/app',
      to: `postgresql://${projectName}:${projectName}_dev@localhost:5432/${projectName}`,
    },
    { from: 'localhost:5432/app', to: `localhost:5432/${projectName}` },
    { from: 'POSTGRES_USER: app', to: `POSTGRES_USER: ${projectName}` },
    {
      from: 'POSTGRES_PASSWORD: app_dev',
      to: `POSTGRES_PASSWORD: ${projectName}_dev`,
    },
    { from: 'POSTGRES_DB: app', to: `POSTGRES_DB: ${projectName}` },
    { from: 'pg_isready -U app', to: `pg_isready -U ${projectName}` },
    { from: '"package-name": "app"', to: `"package-name": "${projectName}"` },
    { from: '"name": "app"', to: `"name": "${projectName}"` },
    { from: "setTitle('App API')", to: `setTitle('${title} API')` },
  ];
}

/**
 * @param {string} content
 * @param {{ from: string, to: string }[]} replacements
 * @returns {string}
 */
export function applyReplacements(content, replacements) {
  let result = content;
  for (const { from, to } of replacements) {
    if (from.length === 0) {
      continue;
    }
    result = result.split(from).join(to);
  }
  return result;
}

/**
 * @param {Record<string, string>} files
 * @param {{ from: string, to: string }[]} replacements
 * @returns {{ path: string, updated: string, changed: boolean }[]}
 */
export function renameFileContents(files, replacements) {
  return Object.entries(files).map(([path, content]) => {
    const updated = applyReplacements(content, replacements);
    return { path, updated, changed: updated !== content };
  });
}

/**
 * @param {string} name
 * @returns {boolean}
 */
export function shouldSkipDirectoryName(name) {
  return SKIP_DIRECTORY_NAMES.has(name);
}

/**
 * @param {string} relativePath
 * @returns {boolean}
 */
export function isRenamableSourceFile(relativePath) {
  const base = basename(relativePath);
  if (base === 'pnpm-lock.yaml') {
    return false;
  }
  if (base === '.env' || base.startsWith('.env.')) {
    return base.endsWith('.example');
  }
  return RENAMABLE_EXTENSIONS.has(extname(base));
}

/**
 * @param {string | undefined} range
 * @returns {string | null}
 */
export function parseEngineMinimum(range) {
  if (typeof range !== 'string') {
    return null;
  }
  const match = range.match(/(\d+\.\d+\.\d+)/);
  return match ? match[1] : null;
}

/**
 * @param {{ engines?: { node?: string, pnpm?: string }, packageManager?: string }} pkg
 * @returns {{ node: string, pnpm: string, packageManager: string }}
 */
export function getVersionRequirements(pkg) {
  return {
    node: parseEngineMinimum(pkg.engines?.node) ?? MIN_NODE_VERSION,
    pnpm: parseEngineMinimum(pkg.engines?.pnpm) ?? MIN_PNPM_VERSION,
    packageManager: pkg.packageManager ?? DEFAULT_PNPM_PREPARE,
  };
}

/**
 * @param {string} input
 * @returns {{ major: number, minor: number, patch: number, text: string } | null}
 */
export function parseSemver(input) {
  const match = String(input).match(/(\d+)\.(\d+)\.(\d+)/);
  if (match === null) {
    return null;
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    text: `${match[1]}.${match[2]}.${match[3]}`,
  };
}

/**
 * @param {string} left
 * @param {string} right
 * @returns {number | null}
 */
export function compareSemver(left, right) {
  const parsedLeft = parseSemver(left);
  const parsedRight = parseSemver(right);
  if (parsedLeft === null || parsedRight === null) {
    return null;
  }
  if (parsedLeft.major !== parsedRight.major) {
    return parsedLeft.major < parsedRight.major ? -1 : 1;
  }
  if (parsedLeft.minor !== parsedRight.minor) {
    return parsedLeft.minor < parsedRight.minor ? -1 : 1;
  }
  if (parsedLeft.patch !== parsedRight.patch) {
    return parsedLeft.patch < parsedRight.patch ? -1 : 1;
  }
  return 0;
}

/**
 * @param {string} actual
 * @param {string} minimum
 * @returns {boolean}
 */
export function isAtLeast(actual, minimum) {
  const comparison = compareSemver(actual, minimum);
  return comparison !== null && comparison >= 0;
}

/**
 * @param {string} tool
 * @returns {string}
 */
function toolLabel(tool) {
  if (tool === 'node') {
    return 'Node.js';
  }
  if (tool === 'pnpm') {
    return 'pnpm';
  }
  return tool;
}

/**
 * @param {string} tool
 * @param {{ packageManager?: string }} [hints]
 * @returns {string}
 */
export function formatMissingToolError(tool, hints = {}) {
  const packageManager = hints.packageManager ?? DEFAULT_PNPM_PREPARE;

  if (tool === 'node') {
    return [
      'Node.js is not on PATH.',
      'Install Node.js 22 LTS from https://nodejs.org/ or with nvm:',
      '  nvm install 22',
    ].join('\n');
  }

  if (tool === 'pnpm') {
    return [
      'pnpm is not on PATH.',
      'Node.js 22 includes Corepack. Enable it, then install pnpm 10:',
      '  corepack enable',
      `  corepack prepare ${packageManager} --activate`,
    ].join('\n');
  }

  if (tool === 'docker') {
    return [
      'Docker is not on PATH.',
      'Install Docker Desktop or Docker Engine: https://docs.docker.com/get-docker/',
      'Start Docker, then rerun: pnpm run setup',
    ].join('\n');
  }

  if (tool === 'docker-compose') {
    return [
      'Docker Compose v2 is not available (`docker compose`).',
      'Update Docker Desktop or install the Compose plugin, then rerun: pnpm run setup',
    ].join('\n');
  }

  if (tool === 'docker-daemon') {
    return [
      'The Docker daemon is not running.',
      'Start Docker Desktop (or `sudo service docker start`) and rerun: pnpm run setup',
    ].join('\n');
  }

  return `${toolLabel(tool)} is required.`;
}

/**
 * @param {string} tool
 * @param {string} actual
 * @param {string} minimum
 * @param {{ packageManager?: string }} [hints]
 * @returns {string}
 */
export function formatOutdatedToolError(tool, actual, minimum, hints = {}) {
  const packageManager = hints.packageManager ?? DEFAULT_PNPM_PREPARE;
  const lines = [
    `${toolLabel(tool)} ${minimum} or newer is required (found ${actual}).`,
  ];

  if (tool === 'node') {
    lines.push(
      'Install Node.js 22 LTS from https://nodejs.org/ or: nvm install 22'
    );
  } else if (tool === 'pnpm') {
    lines.push(
      'Enable Corepack and prepare the version pinned in package.json:',
      '  corepack enable',
      `  corepack prepare ${packageManager} --activate`
    );
  }

  return lines.join('\n');
}

/**
 * @param {string | null} actual
 * @param {string} minimum
 * @param {string} tool
 * @param {{ packageManager?: string }} [hints]
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
export function checkRuntimeVersion(actual, minimum, tool, hints = {}) {
  if (actual === null) {
    return { ok: false, message: formatMissingToolError(tool, hints) };
  }
  if (!isAtLeast(actual, minimum)) {
    return {
      ok: false,
      message: formatOutdatedToolError(tool, actual, minimum, hints),
    };
  }
  return { ok: true };
}

/**
 * @param {boolean} exampleExists
 * @param {boolean} destExists
 * @returns {'copy' | 'keep-existing' | 'skip-missing-example'}
 */
export function envCopyAction(exampleExists, destExists) {
  if (!exampleExists) {
    return 'skip-missing-example';
  }
  if (destExists) {
    return 'keep-existing';
  }
  return 'copy';
}

/**
 * @param {(relativePath: string) => boolean} existsFn
 * @param {{ example: string, dest: string }[]} [envFiles]
 * @returns {{ example: string, dest: string, action: ReturnType<typeof envCopyAction> }[]}
 */
export function planEnvCopies(existsFn, envFiles = DEFAULT_ENV_FILES) {
  return envFiles.map((file) => ({
    ...file,
    action: envCopyAction(existsFn(file.example), existsFn(file.dest)),
  }));
}

/**
 * @param {string} stdout
 * @returns {Record<string, unknown>[]}
 */
export function parseComposePsJson(stdout) {
  const trimmed = stdout.trim();
  if (trimmed.length === 0) {
    return [];
  }

  if (trimmed.startsWith('[')) {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [parsed];
  }

  return trimmed.split(/\r?\n/).flatMap((line) => {
    const item = line.trim();
    if (item.length === 0) {
      return [];
    }
    return [JSON.parse(item)];
  });
}

/**
 * @param {Record<string, unknown>} service
 * @returns {boolean}
 */
export function isPostgresComposeService(service) {
  const serviceName = String(service.Service ?? service.service ?? '');
  const name = String(service.Name ?? service.Names ?? service.name ?? '');
  return serviceName === 'postgres' || name.includes('postgres');
}

/**
 * @param {Record<string, unknown> | undefined} service
 * @returns {boolean}
 */
export function isComposeServiceHealthy(service) {
  if (service === undefined) {
    return false;
  }
  const health = String(service.Health ?? service.health ?? '').toLowerCase();
  return health === 'healthy';
}

/**
 * @param {string} stdout
 * @returns {boolean}
 */
export function isPostgresHealthyFromComposePs(stdout) {
  const services = parseComposePsJson(stdout);
  const postgres = services.find((service) =>
    isPostgresComposeService(service)
  );
  return isComposeServiceHealthy(postgres);
}

/**
 * @param {{
 *   check: () => boolean | Promise<boolean>,
 *   timeoutMs: number,
 *   intervalMs: number,
 *   sleep?: (ms: number) => Promise<void>,
 *   now?: () => number,
 * }} options
 * @returns {Promise<boolean>}
 */
export async function waitUntil(options) {
  const sleep =
    options.sleep ??
    ((ms) =>
      new Promise((resolve) => {
        setTimeout(resolve, ms);
      }));
  const now = options.now ?? (() => Date.now());
  const start = now();

  for (;;) {
    if (await options.check()) {
      return true;
    }
    if (now() - start >= options.timeoutMs) {
      return false;
    }
    await sleep(options.intervalMs);
  }
}

/**
 * @param {string} packageName
 * @returns {string}
 */
export function workspaceScopeFromPackageName(packageName) {
  const match = /^(@[^/]+)\//.exec(packageName);
  return match ? match[1] : '@app';
}

/**
 * @param {{ scope?: string, renamed?: string }} [options]
 * @returns {string}
 */
export function formatNextSteps(options = {}) {
  const scope = options.scope ?? '@app';
  const lines = [
    'Setup complete.',
    '',
    'Next steps:',
    '  pnpm dev                 Web http://localhost:3000  API http://localhost:3001',
    `  pnpm --filter ${scope}/ui storybook`,
    '  OpenAPI docs:            http://localhost:3001/api/docs',
    '',
    'Git hooks: if commit-msg or pre-commit is missing, run pnpm prepare.',
  ];

  if (options.renamed) {
    lines.push(
      '',
      `Renamed placeholder packages to ${scope}/*. Review the diff and commit it before opening a PR.`
    );
  }

  return lines.join('\n');
}

/**
 * @returns {string}
 */
export function formatUsage() {
  return [
    'Usage: pnpm run setup [--rename <name>]',
    '',
    'Checks Node.js / pnpm / Docker, installs dependencies, copies .env files,',
    'starts PostgreSQL, applies Prisma migrations, seeds fake data, and runs codegen.',
    '',
    'Options:',
    '  --rename <name>  Replace placeholder project name (app / @app/*) in configs',
    '  -h, --help       Show this help',
    '',
    'Idempotent: safe to rerun. Existing .env files are kept.',
    'pnpm setup (without run) is pnpm’s own installer — use pnpm run setup.',
  ].join('\n');
}

/**
 * @param {string} name
 * @returns {boolean}
 */
function pathHasSkippedDirectory(name) {
  return name.split(/[\\/]/).some((part) => shouldSkipDirectoryName(part));
}

/**
 * @param {string} rootDir
 * @returns {string[]}
 */
export function listRenamableFiles(rootDir) {
  const entries = readdirSync(rootDir, {
    withFileTypes: true,
    recursive: true,
  });
  const files = [];

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    const parent = entry.parentPath ?? entry.path ?? rootDir;
    const absolutePath = join(parent, entry.name);
    const relativePath = relative(rootDir, absolutePath);
    if (pathHasSkippedDirectory(relativePath)) {
      continue;
    }
    if (!isRenamableSourceFile(relativePath)) {
      continue;
    }
    files.push(relativePath.split(sep).join('/'));
  }

  return files.sort();
}

/**
 * @returns {boolean}
 */
function useWindowsShell() {
  return process.platform === 'win32';
}

/**
 * @param {string} command
 * @param {string[]} args
 * @param {{ cwd?: string, stdio?: 'inherit' | 'pipe', env?: NodeJS.ProcessEnv }} [options]
 * @returns {import('node:child_process').SpawnSyncReturns<string>}
 */
function spawnCommand(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env ?? process.env,
    encoding: 'utf8',
    shell: useWindowsShell(),
    stdio: options.stdio === 'inherit' ? 'inherit' : 'pipe',
  });
}

/**
 * @param {string} command
 * @param {string[]} args
 * @returns {string | null}
 */
export function readCommandVersion(command, args) {
  const result = spawnCommand(command, args);
  if (
    result.error &&
    'code' in result.error &&
    result.error.code === 'ENOENT'
  ) {
    return null;
  }
  if (result.status !== 0) {
    return null;
  }
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
  return parseSemver(output)?.text ?? (output.length > 0 ? output : null);
}

/**
 * @param {string} command
 * @param {string[]} args
 * @param {string} cwd
 * @param {string} failureMessage
 */
function runOrThrow(command, args, cwd, failureMessage) {
  const result = spawnCommand(command, args, { cwd, stdio: 'inherit' });
  if (
    result.error &&
    'code' in result.error &&
    result.error.code === 'ENOENT'
  ) {
    throw new SetupError(failureMessage);
  }
  if (result.status !== 0) {
    throw new SetupError(failureMessage);
  }
}

/**
 * @param {string} rootDir
 */
function assertTooling(rootDir) {
  const pkg = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
  const requirements = getVersionRequirements(pkg);
  const hints = { packageManager: requirements.packageManager };

  const nodeCheck = checkRuntimeVersion(
    process.versions.node,
    requirements.node,
    'node',
    hints
  );
  if (!nodeCheck.ok) {
    throw new SetupError(nodeCheck.message);
  }

  const pnpmVersion = readCommandVersion('pnpm', ['--version']);
  const pnpmCheck = checkRuntimeVersion(
    pnpmVersion,
    requirements.pnpm,
    'pnpm',
    hints
  );
  if (!pnpmCheck.ok) {
    throw new SetupError(pnpmCheck.message);
  }

  const dockerVersion = readCommandVersion('docker', ['--version']);
  if (dockerVersion === null) {
    throw new SetupError(formatMissingToolError('docker', hints));
  }

  const daemon = spawnCommand('docker', ['info']);
  if (daemon.status !== 0) {
    throw new SetupError(formatMissingToolError('docker-daemon', hints));
  }

  const compose = spawnCommand('docker', ['compose', 'version']);
  if (compose.status !== 0) {
    throw new SetupError(formatMissingToolError('docker-compose', hints));
  }
}

/**
 * @param {string} rootDir
 * @param {string} projectName
 * @returns {number}
 */
function applyRename(rootDir, projectName) {
  const replacements = createRenameReplacements(projectName);
  const files = listRenamableFiles(rootDir);
  let changedCount = 0;

  for (const relativePath of files) {
    const absolutePath = join(rootDir, ...relativePath.split('/'));
    const original = readFileSync(absolutePath, 'utf8');
    const updated = applyReplacements(original, replacements);
    if (updated !== original) {
      writeFileSync(absolutePath, updated);
      changedCount += 1;
    }
  }

  return changedCount;
}

/**
 * @param {string} rootDir
 */
function copyEnvFiles(rootDir) {
  const plans = planEnvCopies((relativePath) =>
    existsSync(join(rootDir, relativePath))
  );

  for (const plan of plans) {
    if (plan.action === 'copy') {
      copyFileSync(join(rootDir, plan.example), join(rootDir, plan.dest));
      console.log(`  created ${plan.dest} from ${plan.example}`);
    } else if (plan.action === 'keep-existing') {
      console.log(`  kept existing ${plan.dest}`);
    }
  }
}

/**
 * @param {string} rootDir
 */
async function startPostgres(rootDir) {
  runOrThrow(
    'docker',
    ['compose', 'up', '-d'],
    rootDir,
    'Failed to start PostgreSQL with docker compose up -d.'
  );

  const healthy = await waitUntil({
    timeoutMs: POSTGRES_HEALTH_TIMEOUT_MS,
    intervalMs: POSTGRES_HEALTH_INTERVAL_MS,
    check: () => {
      const result = spawnCommand(
        'docker',
        ['compose', 'ps', '--format', 'json'],
        {
          cwd: rootDir,
        }
      );
      if (result.status !== 0) {
        return false;
      }
      try {
        return isPostgresHealthyFromComposePs(result.stdout ?? '');
      } catch {
        return false;
      }
    },
  });

  if (!healthy) {
    throw new SetupError(
      'PostgreSQL did not become healthy in time. Check `docker compose ps` and rerun: pnpm run setup'
    );
  }
}

/**
 * @param {string} rootDir
 * @returns {string}
 */
function readApiScope(rootDir) {
  const apiPkg = JSON.parse(
    readFileSync(join(rootDir, 'apps/api/package.json'), 'utf8')
  );
  return workspaceScopeFromPackageName(String(apiPkg.name ?? '@app/api'));
}

/**
 * @param {string[]} argv
 * @param {string} [rootDir]
 */
export async function runSetup(
  argv,
  rootDir = dirname(fileURLToPath(import.meta.url))
) {
  const repoRoot = basename(rootDir) === 'scripts' ? dirname(rootDir) : rootDir;
  const parsed = parseCliArgs(argv);

  if (parsed.error) {
    throw new SetupError(`${parsed.error}\n\n${formatUsage()}`);
  }

  if (parsed.help) {
    console.log(formatUsage());
    return;
  }

  let renameName;

  if (parsed.rename !== undefined) {
    const validated = validateProjectName(parsed.rename);
    if (!validated.ok) {
      throw new SetupError(validated.error);
    }
    renameName = validated.name;
  }

  console.log('==> Checking Node.js, pnpm, and Docker');
  assertTooling(repoRoot);
  console.log(
    `  Node.js ${process.versions.node}, pnpm ${readCommandVersion('pnpm', ['--version'])}`
  );

  if (renameName !== undefined) {
    console.log(
      `==> Renaming placeholder "${PLACEHOLDER_PROJECT_NAME}" → "${renameName}"`
    );
    const changedCount = applyRename(repoRoot, renameName);
    console.log(`  updated ${changedCount} file(s)`);
  }

  console.log('==> Installing dependencies');
  runOrThrow(
    'pnpm',
    ['install'],
    repoRoot,
    'pnpm install failed. Fix the error above and rerun: pnpm run setup'
  );

  console.log('==> Creating .env files');
  copyEnvFiles(repoRoot);

  console.log('==> Starting PostgreSQL');
  await startPostgres(repoRoot);
  console.log('  postgres is healthy');

  console.log('==> Applying Prisma migrations and seed');
  runOrThrow(
    'pnpm',
    ['--filter', './apps/api', 'exec', 'prisma', 'migrate', 'deploy'],
    repoRoot,
    'Prisma migrate deploy failed. See the output above.'
  );
  runOrThrow(
    'pnpm',
    ['--filter', './apps/api', 'exec', 'prisma', 'db', 'seed'],
    repoRoot,
    'Prisma seed failed. See the output above. Seeds must use fake data only.'
  );

  console.log('==> Generating OpenAPI client');
  runOrThrow(
    'pnpm',
    ['codegen'],
    repoRoot,
    'pnpm codegen failed. See the output above.'
  );

  const scope = readApiScope(repoRoot);
  console.log('');
  console.log(formatNextSteps({ scope, renamed: renameName }));
}

async function main() {
  await runSetup(process.argv.slice(2));
}

const isDirectRun =
  process.argv[1] !== undefined &&
  pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectRun) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  });
}
