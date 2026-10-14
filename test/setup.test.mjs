import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  applyReplacements,
  checkRuntimeVersion,
  compareSemver,
  createRenameReplacements,
  envCopyAction,
  formatMissingToolError,
  formatNextSteps,
  formatOutdatedToolError,
  formatUsage,
  getVersionRequirements,
  isAtLeast,
  isComposeServiceHealthy,
  isPostgresComposeService,
  isPostgresHealthyFromComposePs,
  isRenamableSourceFile,
  parseCliArgs,
  parseComposePsJson,
  parseEngineMinimum,
  parseSemver,
  planEnvCopies,
  renameFileContents,
  shouldSkipDirectoryName,
  toTitleCase,
  validateProjectName,
  waitUntil,
  workspaceScopeFromPackageName,
} from '../scripts/setup.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('setup CLI args', () => {
  it('parses help, --rename, and --rename=', () => {
    assert.deepEqual(parseCliArgs(['--help']), { help: true });
    assert.deepEqual(parseCliArgs(['-h']), { help: true });
    assert.deepEqual(parseCliArgs(['--rename', 'acme']), { rename: 'acme' });
    assert.deepEqual(parseCliArgs(['--rename=acme-pwa']), {
      rename: 'acme-pwa',
    });
  });

  it('rejects missing values and unknown flags', () => {
    assert.equal(
      parseCliArgs(['--rename']).error,
      'Expected a project name after --rename.'
    );
    assert.equal(
      parseCliArgs(['--rename', '--help']).error,
      'Expected a project name after --rename.'
    );
    assert.equal(
      parseCliArgs(['--rename=']).error,
      'Expected a project name after --rename='
    );
    assert.equal(parseCliArgs(['--force']).error, 'Unknown argument: --force');
  });
});

describe('project name validation', () => {
  it('accepts npm-safe slugs and title-cases them', () => {
    assert.deepEqual(validateProjectName('acme'), { ok: true, name: 'acme' });
    assert.deepEqual(validateProjectName('acme-pwa'), {
      ok: true,
      name: 'acme-pwa',
    });
    assert.equal(toTitleCase('acme-pwa'), 'Acme Pwa');
  });

  it('rejects empty, reserved, scoped, and invalid names', () => {
    assert.equal(validateProjectName('').ok, false);
    assert.equal(validateProjectName('app').ok, false);
    assert.equal(validateProjectName('api').ok, false);
    assert.equal(validateProjectName('MyApp').ok, false);
    assert.equal(validateProjectName('acme_pwa').ok, false);
    assert.equal(validateProjectName('-acme').ok, false);
    assert.equal(validateProjectName('@acme').ok, false);
    assert.equal(validateProjectName('acme/web').ok, false);
    assert.equal(validateProjectName('a').ok, false);
  });
});

describe('semver helpers', () => {
  it('parses engine ranges and command output', () => {
    assert.equal(parseEngineMinimum('>=22.0.0'), '22.0.0');
    assert.equal(parseSemver('v22.14.0')?.text, '22.14.0');
    assert.equal(parseSemver('10.33.4')?.text, '10.33.4');
    assert.equal(
      parseSemver('Docker version 27.3.1, build abc')?.text,
      '27.3.1'
    );
    assert.equal(parseSemver('not a version'), null);
  });

  it('compares versions and enforces minimums', () => {
    assert.equal(compareSemver('22.14.0', '22.0.0'), 1);
    assert.equal(compareSemver('22.0.0', '22.0.0'), 0);
    assert.equal(compareSemver('18.20.0', '22.0.0'), -1);
    assert.equal(isAtLeast('22.0.0', '22.0.0'), true);
    assert.equal(isAtLeast('21.9.0', '22.0.0'), false);
    assert.equal(isAtLeast('not-a-version', '22.0.0'), false);
  });

  it('reads engines from package.json with fallbacks', () => {
    const requirements = getVersionRequirements({
      engines: { node: '>=22.0.0', pnpm: '>=10.0.0' },
      packageManager: 'pnpm@10.33.4',
    });
    assert.deepEqual(requirements, {
      node: '22.0.0',
      pnpm: '10.0.0',
      packageManager: 'pnpm@10.33.4',
    });
    assert.equal(getVersionRequirements({}).node, '22.0.0');
  });

  it('builds friendly missing and outdated errors', () => {
    const missingNode = formatMissingToolError('node');
    assert.match(missingNode, /Node\.js is not on PATH/);
    assert.match(missingNode, /nvm install 22/);

    const missingPnpm = formatMissingToolError('pnpm', {
      packageManager: 'pnpm@10.33.4',
    });
    assert.match(missingPnpm, /corepack enable/);
    assert.match(missingPnpm, /pnpm@10.33.4/);

    const missingDocker = formatMissingToolError('docker');
    assert.match(missingDocker, /pnpm run setup/);
    assert.match(
      formatMissingToolError('docker-daemon'),
      /daemon is not running/
    );
    assert.match(formatMissingToolError('docker-compose'), /docker compose/);

    const outdated = formatOutdatedToolError('node', '18.20.0', '22.0.0');
    assert.match(outdated, /found 18\.20\.0/);
    assert.match(outdated, /22\.0\.0 or newer/);

    assert.equal(checkRuntimeVersion(null, '22.0.0', 'node').ok, false);
    assert.equal(checkRuntimeVersion('18.0.0', '22.0.0', 'node').ok, false);
    assert.equal(checkRuntimeVersion('22.14.0', '22.0.0', 'node').ok, true);
  });
});

describe('env copy plan', () => {
  it('copies only when the dest is missing', () => {
    assert.equal(envCopyAction(true, false), 'copy');
    assert.equal(envCopyAction(true, true), 'keep-existing');
    assert.equal(envCopyAction(false, false), 'skip-missing-example');
  });

  it('plans both workspace env files', () => {
    const exists = new Set([
      'apps/api/.env.example',
      'apps/web/.env.example',
      'apps/api/.env',
    ]);
    const plan = planEnvCopies((relativePath) => exists.has(relativePath));
    assert.deepEqual(
      plan.map((item) => `${item.dest}:${item.action}`),
      ['apps/api/.env:keep-existing', 'apps/web/.env:copy']
    );
  });
});

describe('rename replacements', () => {
  it('rewrites package names, docker, storage keys, and OpenAPI title', () => {
    const replacements = createRenameReplacements('acme');
    const files = {
      'package.json': JSON.stringify(
        {
          name: 'app',
          scripts: {
            dev: 'turbo run dev --filter @app/web --filter @app/api',
          },
        },
        null,
        2
      ),
      'docker-compose.yml': [
        'container_name: app-postgres',
        'POSTGRES_USER: app',
        'POSTGRES_PASSWORD: app_dev',
        'POSTGRES_DB: app',
        "test: ['CMD-SHELL', 'pg_isready -U app']",
      ].join('\n'),
      'apps/api/.env.example':
        'DATABASE_URL="postgresql://app:app_dev@localhost:5432/app?schema=public"',
      'color-scheme.ts': "export const COLOR_SCHEME_STORAGE_KEY = 'app-ui';",
      'query-persistence.ts':
        "export const QUERY_CACHE_STORAGE_KEY = 'app-example-query-cache';",
      'configure-app.ts': ".setTitle('App API')",
      'release-please-config.json': '"package-name": "app"',
    };

    const renamed = renameFileContents(files, replacements);
    const byPath = Object.fromEntries(
      renamed.map((item) => [item.path, item.updated])
    );

    assert.equal(
      renamed.every((item) => item.changed),
      true
    );
    assert.match(byPath['package.json'], /"name": "acme"/);
    assert.match(byPath['package.json'], /@acme\/web/);
    assert.doesNotMatch(byPath['package.json'], /@app\//);
    assert.match(byPath['docker-compose.yml'], /acme-postgres/);
    assert.match(byPath['docker-compose.yml'], /POSTGRES_USER: acme/);
    assert.match(byPath['docker-compose.yml'], /pg_isready -U acme/);
    assert.match(
      byPath['apps/api/.env.example'],
      /postgresql:\/\/acme:acme_dev@localhost:5432\/acme/
    );
    assert.match(byPath['color-scheme.ts'], /'acme-ui'/);
    assert.match(byPath['query-persistence.ts'], /acme-example-query-cache/);
    assert.match(byPath['configure-app.ts'], /setTitle\('Acme API'\)/);
    assert.match(
      byPath['release-please-config.json'],
      /"package-name": "acme"/
    );
  });

  it('does not double-replace when already renamed', () => {
    const replacements = createRenameReplacements('acme');
    const first = applyReplacements(
      'pnpm --filter @app/api start',
      replacements
    );
    const second = applyReplacements(first, replacements);
    assert.equal(first, 'pnpm --filter @acme/api start');
    assert.equal(second, first);
  });

  it('classifies files and skip directories without touching lockfiles', () => {
    assert.equal(shouldSkipDirectoryName('node_modules'), true);
    assert.equal(shouldSkipDirectoryName('apps'), false);
    assert.equal(isRenamableSourceFile('package.json'), true);
    assert.equal(isRenamableSourceFile('apps/api/.env.example'), true);
    assert.equal(isRenamableSourceFile('apps/api/.env'), false);
    assert.equal(isRenamableSourceFile('pnpm-lock.yaml'), false);
    assert.equal(isRenamableSourceFile('apps/web/public/icon-192.png'), false);
  });
});

describe('compose health parsing', () => {
  it('parses JSON-lines and array output', () => {
    const line = JSON.stringify({
      Service: 'postgres',
      Name: 'app-postgres',
      Health: 'healthy',
      State: 'running',
    });
    const array = JSON.stringify([{ Service: 'postgres', Health: 'starting' }]);

    assert.equal(parseComposePsJson(line).length, 1);
    assert.equal(isPostgresHealthyFromComposePs(line), true);
    assert.equal(isPostgresHealthyFromComposePs(array), false);
    assert.equal(isPostgresHealthyFromComposePs(''), false);
    assert.equal(
      isPostgresComposeService({ Name: 'acme-postgres', Service: 'web' }),
      true
    );
    assert.equal(isComposeServiceHealthy({ Health: 'starting' }), false);
  });
});

describe('waitUntil', () => {
  it('resolves when the check passes before timeout', async () => {
    let current = 0;
    let calls = 0;
    const ok = await waitUntil({
      timeoutMs: 1000,
      intervalMs: 100,
      now: () => current,
      sleep: async (ms) => {
        current += ms;
      },
      check: async () => {
        calls += 1;
        return calls >= 3;
      },
    });
    assert.equal(ok, true);
    assert.equal(calls, 3);
  });

  it('returns false when the timeout elapses', async () => {
    let current = 0;
    const ok = await waitUntil({
      timeoutMs: 300,
      intervalMs: 100,
      now: () => current,
      sleep: async (ms) => {
        current += ms;
      },
      check: async () => false,
    });
    assert.equal(ok, false);
  });
});

describe('next steps and usage', () => {
  it('prints local URLs, storybook filter, and rename note', () => {
    const steps = formatNextSteps({ scope: '@acme', renamed: 'acme' });
    assert.match(steps, /pnpm dev/);
    assert.match(steps, /localhost:3000/);
    assert.match(steps, /localhost:3001/);
    assert.match(steps, /@acme\/ui storybook/);
    assert.match(steps, /Renamed placeholder packages/);
    assert.equal(workspaceScopeFromPackageName('@acme/api'), '@acme');
    assert.equal(workspaceScopeFromPackageName('app'), '@app');
  });

  it('documents pnpm run setup and --rename', () => {
    const usage = formatUsage();
    assert.match(usage, /pnpm run setup/);
    assert.match(usage, /--rename/);
    assert.match(usage, /Idempotent/);
  });

  it('is wired as the package setup script', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    assert.equal(pkg.scripts.setup, 'node scripts/setup.mjs');
    assert.match(pkg.scripts['db:seed'], /prisma db seed/);
  });
});
