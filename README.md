# monorepo-pwa-template

Reusable GitHub template for a **bilingual Progressive Web App monorepo**. It is
not a product. It is a starter you copy, rename, and fill with your own domain.

Use it when you want a ready foundation: pnpm workspaces, Turborepo, a React 19
PWA, a NestJS API, shared Zod contracts, and an atomic UI package — without any
product-specific domain.

The skeleton ships a health-check example (API + PostgreSQL + a persisted `items`
query cache), not a real feature. Replace the home copy, PWA name, theme tokens,
and Prisma models with your own. **Languages and the default theme are
configurable.**

## Contents

- [Tech stack](#tech-stack)
- [Repository structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Scripts](#scripts)
- [Development workflow](#development-workflow)
- [Testing](#testing)
- [Internationalization and RTL](#internationalization-and-rtl)
- [Theming tokens](#theming-tokens)
- [API client codegen (Orval)](#api-client-codegen-orval)
- [Deployment](#deployment)
- [Starting a new project from this template](#starting-a-new-project-from-this-template)
- [Troubleshooting](#troubleshooting)

## Tech stack

Each tool is here for a specific job. Architecture Decision Records in
[`docs/adr/`](docs/adr/) explain the choices in more detail.

| Tool                    | Role                      | Why this template uses it                                                                                    |
| ----------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Node.js 22**          | Runtime                   | LTS, matches Render/`engines`, ships Corepack                                                                |
| **pnpm 10**             | Workspaces                | Fast installs, strict workspace protocol ([ADR 0002](docs/adr/0002-pnpm-monorepo.md))                        |
| **Turborepo 2**         | Task runner               | Cached `lint` / `typecheck` / `test` / `build` ([ADR 0015](docs/adr/0015-turborepo-task-caching.md))         |
| **TypeScript 5.7**      | Language                  | `strict: true` across apps and packages                                                                      |
| **React 19**            | Web UI                    | Standard component model for the PWA ([ADR 0003](docs/adr/0003-react-vite-mantine.md))                       |
| **Vite 6**              | Dev server + bundler      | Fast HMR, production build, PWA plugin host                                                                  |
| **vite-plugin-pwa**     | Service worker + manifest | Offline shell, installable home-screen app ([ADR 0001](docs/adr/0001-pwa-instead-of-native.md))              |
| **Mantine 9**           | UI primitives             | Accessible components with first-class RTL                                                                   |
| **react-i18next**       | Translations              | Hebrew default (RTL) + English (LTR) ([ADR 0006](docs/adr/0006-bilingual-i18n-rtl-ltr.md))                   |
| **Zustand**             | Client UI state           | Color scheme (and similar session UI) ([ADR 0012](docs/adr/0012-zustand-tanstack-query.md))                  |
| **TanStack Query**      | Server state              | Health polling, `persistQueryClient` for example details                                                     |
| **NestJS 11**           | REST API                  | Typed modules, ValidationPipe, Swagger ([ADR 0004](docs/adr/0004-nestjs-prisma-postgresql.md))               |
| **Prisma 6**            | ORM + migrations          | Committed SQL, `migrate deploy` in CI ([ADR 0010](docs/adr/0010-db-migrations-prisma-github-actions.md))     |
| **PostgreSQL 16**       | Database                  | Local Docker Compose; Neon in production                                                                     |
| **Zod**                 | Shared contracts          | One schema in `@app/shared` for API + web ([ADR 0013](docs/adr/0013-zod-schemas-in-shared.md))               |
| **@nestjs/swagger**     | OpenAPI document          | Browsable contract at `/api/docs`                                                                            |
| **Orval**               | API client codegen        | TanStack Query hooks from the spec ([ADR 0014](docs/adr/0014-openapi-orval.md))                              |
| **Vitest**              | Unit / component tests    | Vite-native, used in web, API, shared, and UI                                                                |
| **Supertest**           | API HTTP tests            | NestJS integration tests against `/api`                                                                      |
| **Playwright**          | End-to-end tests          | Chromium smoke: RTL/LTR, health, theme                                                                       |
| **Storybook 8**         | UI catalog                | Atoms / molecules / organisms in isolation ([ADR 0011](docs/adr/0011-ui-package-atomic-design-storybook.md)) |
| **ESLint 9 + Prettier** | Quality                   | Flat config; lint-staged on commit                                                                           |
| **Husky + commitlint**  | Git hooks                 | Conventional Commits locally ([ADR 0008](docs/adr/0008-conventional-commits.md))                             |
| **GitHub Actions**      | CI/CD                     | Lint, tests, CodeQL, deploy, keep-awake                                                                      |
| **Dependabot**          | Dependency PRs            | Weekly npm and Actions updates ([ADR 0016](docs/adr/0016-dependabot-dependency-updates.md))                  |
| **Release Please**      | Versions + changelog      | Reviewable release PR from commits ([ADR 0017](docs/adr/0017-release-please.md))                             |
| **Sentry EU**           | Error reporting           | Optional; DSN empty = no-op, PII scrubbed ([ADR 0018](docs/adr/0018-free-tier-deploy-sentry.md))             |
| **Cloudflare Pages**    | Web host                  | Free-tier PWA CDN                                                                                            |
| **Render**              | API host                  | Free-tier web service (Frankfurt)                                                                            |
| **Neon**                | Hosted Postgres           | Free-tier, Frankfurt, scale-to-zero                                                                          |
| **Docker Compose**      | Local Postgres            | `postgres:16-alpine` with a healthcheck                                                                      |

## Repository structure

```
.
├── apps/
│   ├── web/                 # React 19 + Vite PWA (port 3000)
│   └── api/                 # NestJS + Prisma REST API (port 3001)
├── packages/
│   ├── shared/              # Zod schemas, types, Sentry PII scrubber
│   └── ui/                  # Atomic design + Mantine theme + Storybook
├── scripts/
│   ├── setup.mjs            # One-command local bootstrap
│   ├── keep-awake.mjs       # Render free-tier ping window
│   └── check-generated.sh   # Fail CI when Orval output is stale
├── e2e/                     # Playwright smoke tests
├── test/                    # Root Node test files (setup, keep-awake, …)
├── docs/
│   ├── PRD.md               # Replace with your product requirements
│   ├── deployment.md        # Cloudflare / Render / Neon / Sentry
│   ├── branch-protection.md # Recommended master ruleset
│   ├── adr/                 # Architecture Decision Records
│   └── roles/               # Role-specific guides
├── .cursor/
│   ├── rules/               # Always-on agent rules
│   └── skills/              # Agent skills for this monorepo
├── .github/
│   ├── workflows/           # CI, CodeQL, Release Please, deploy, keep-awake
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── docker-compose.yml       # Local PostgreSQL 16
├── render.yaml              # Render Blueprint (API, Frankfurt, free)
├── turbo.json
├── pnpm-workspace.yaml
├── AGENTS.md                # Guide for AI agents working in this repo
└── package.json
```

| Path                                                 | What lives there                      |
| ---------------------------------------------------- | ------------------------------------- |
| `apps/web/src/i18n/locales/{he,en}/`                 | Translation namespaces                |
| `apps/web/src/api/generated/`                        | Orval output (committed, do not edit) |
| `apps/api/prisma/`                                   | Schema, migrations, fake seed         |
| `packages/ui/src/{atoms,molecules,organisms,theme}/` | Design system                         |
| `apps/web/public/`                                   | PWA icons and `_redirects`            |

## Prerequisites

| Tool                        | Version           | Notes                                                             |
| --------------------------- | ----------------- | ----------------------------------------------------------------- |
| **Node.js**                 | `>= 22.0.0` (LTS) | See `engines.node` in the root `package.json`                     |
| **pnpm**                    | `>= 10.0.0`       | Pinned as `packageManager` (`pnpm@10.33.4`). Enable with Corepack |
| **Docker** + **Compose v2** | Current stable    | Required for local PostgreSQL (`docker compose`)                  |

Enable pnpm (once per machine):

```bash
corepack enable
corepack prepare pnpm@10.33.4 --activate
```

## Quick start

From a clone of this repository (or a repository created with **Use this
template**):

```bash
pnpm run setup
pnpm dev
```

`pnpm run setup` is the one-command bootstrap. It is idempotent (safe to rerun)
and will:

1. Check Node.js, pnpm, and Docker versions (friendly errors if something is
   missing or too old)
2. Run `pnpm install`
3. Copy `apps/*/.env.example` → `apps/*/.env` **only when `.env` is missing**
4. Start PostgreSQL with `docker compose up -d` and wait until it is healthy
5. Apply Prisma migrations and seed **fake** placeholder rows (ADR 0007)
6. Run `pnpm codegen` (OpenAPI spec + Orval client)
7. Print next steps

Optional rename of the `app` / `@app/*` placeholders:

```bash
pnpm run setup --rename my-product
```

- Web: http://localhost:3000
- API: http://localhost:3001
- OpenAPI UI: http://localhost:3001/api/docs
- Storybook: `pnpm --filter @app/ui storybook` (port 6006)

pnpm’s CLI already has a global `setup` command (it installs pnpm itself). Always
use **`pnpm run setup`** for this repository’s bootstrap.

`pnpm install` generates the Prisma Client (`apps/api` postinstall) and sets up
Husky git hooks. If hooks are missing later, run `pnpm prepare`.

### Environment files

Created by `pnpm run setup` when missing. Do not commit `.env` files.

**API** (`apps/api/.env`)

- `DATABASE_URL` — PostgreSQL connection string
- `PORT` — API server port (default `3001`)
- `CORS_ORIGINS` — comma-separated origins (default `http://localhost:3000`)
- `SENTRY_DSN` — optional EU Sentry DSN; empty disables Sentry
- `SENTRY_ENVIRONMENT` — default `development`

**Web** (`apps/web/.env`)

- `VITE_API_URL` — API origin (Vite proxy target in development; fetch prefix in
  production)
- `VITE_SENTRY_DSN` — optional EU Sentry DSN; empty disables Sentry

In development the web app uses relative `/api` URLs, proxied to the API.

### Ports

| Port     | Service      |
| -------- | ------------ |
| **3000** | Web (Vite)   |
| **3001** | API (NestJS) |
| **5432** | PostgreSQL   |
| **6006** | Storybook    |

## Scripts

Root scripts (run from the repository root):

| Script               | What it does                                                  |
| -------------------- | ------------------------------------------------------------- |
| `pnpm run setup`     | One-command local bootstrap (see [Quick start](#quick-start)) |
| `pnpm dev`           | Start web and API in parallel via Turborepo                   |
| `pnpm build`         | Build all workspaces (`^build` for package deps, cached)      |
| `pnpm lint`          | ESLint via Turborepo                                          |
| `pnpm typecheck`     | TypeScript via Turborepo                                      |
| `pnpm format`        | Prettier write across TS/JS/JSON/MD                           |
| `pnpm format:check`  | Prettier check (CI)                                           |
| `pnpm db:generate`   | Generate Prisma Client                                        |
| `pnpm db:seed`       | Seed fake placeholder rows (skips if rows already exist)      |
| `pnpm test`          | Workspace Vitest once (`--run`) plus root `test/*.test.mjs`   |
| `pnpm test:ci`       | Coverage Vitest plus root tests                               |
| `pnpm test:e2e`      | Playwright (Chromium)                                         |
| `pnpm test:e2e:ui`   | Playwright UI mode                                            |
| `pnpm codegen`       | Build `@app/shared`, write OpenAPI spec, run Orval            |
| `pnpm codegen:check` | Fail if spec/client differ from git                           |
| `pnpm prepare`       | Install Husky hooks (`commit-msg`, `pre-commit`)              |

Workspace scripts (via `pnpm --filter <name>`):

| Workspace     | Script                          | What it does                                           |
| ------------- | ------------------------------- | ------------------------------------------------------ |
| `@app/web`    | `dev` / `build` / `preview`     | Vite dev, production build, preview server             |
| `@app/web`    | `test` / `test:ci` / `test:ui`  | Vitest watch, coverage, Vitest UI                      |
| `@app/web`    | `codegen`                       | Orval (`orval.config.ts`)                              |
| `@app/api`    | `dev` / `build` / `start`       | Nest watch, compile, `node dist/main`                  |
| `@app/api`    | `test` / `test:ci` / `test:ui`  | Vitest (Supertest integration in `test/*.int.spec.ts`) |
| `@app/api`    | `openapi:generate`              | Write `apps/api/openapi.json` (`SKIP_DB_CONNECT`)      |
| `@app/api`    | `prisma:generate`               | Prisma Client                                          |
| `@app/api`    | `prisma:migrate`                | `prisma migrate dev` (creates a migration)             |
| `@app/api`    | `prisma:studio`                 | Browse local data                                      |
| `@app/ui`     | `storybook` / `build-storybook` | Storybook on port 6006 / static build                  |
| `@app/ui`     | `test` / `test:ci`              | Component tests + WCAG contrast checks                 |
| `@app/shared` | `build` / `test`                | Compile Zod contracts; unit tests                      |

Examples:

```bash
pnpm --filter @app/web dev
pnpm --filter @app/api prisma:studio
pnpm --filter @app/ui storybook
```

## Development workflow

Default branch is **`master`**. Do not push to it. Authors do not merge their
own pull requests.

### Conventional Commits

Format: `<type>(<scope>): <description>`

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`,
`ci`, `chore`, `revert`

**Scopes**: `web`, `api`, `shared`, `ui`, `ci`, `docs`, `deps` (scope may be
omitted when a change spans several areas)

Examples: `feat(web): add items details screen`,
`fix(api): handle missing database connection`,
`docs: update setup instructions in README`.

Imperative mood, lowercase subject, no trailing period, header ≤ 72 characters.
See [ADR 0008](docs/adr/0008-conventional-commits.md).

### Husky

| Hook         | Tool        | What it checks                       |
| ------------ | ----------- | ------------------------------------ |
| `commit-msg` | commitlint  | Message matches Conventional Commits |
| `pre-commit` | lint-staged | Prettier + ESLint on staged files    |

If hooks do not run, `pnpm prepare`. Do not `--no-verify` to skip a broken check.

### Pull request flow

1. Branch from `master`.
2. Make a focused change. Add tests for behavior.
3. Run `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, and `pnpm test`.
4. Open a PR **into `master`**. The title must be a Conventional Commit (squash
   merge uses the title as the `master` commit).
5. CI on PRs to `master`:
   - **CI** — lint, typecheck, codegen check, Prettier, Prisma migrate, build,
     Storybook build, unit/integration tests, Playwright
   - **Commit Lint** — every commit in the PR
   - **PR Title Check** — squash-merge title
   - **CodeQL** — JavaScript/TypeScript
6. Address review. The owner squash-merges when checks are green.

Use [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md).
Recommended `master` rules are in
[docs/branch-protection.md](docs/branch-protection.md).

### Release Please

After a squash-merge to `master`, Release Please opens a version/changelog PR
from Conventional Commits (`feat` → minor while pre-1.0, `fix` → patch). Do not
require that workflow as a status check on feature PRs (it runs after merge).
Details: [ADR 0017](docs/adr/0017-release-please.md).

Dependabot sends weekly `chore(deps)` / `ci(deps)` PRs
([ADR 0016](docs/adr/0016-dependabot-dependency-updates.md)).

## Testing

Strategy: [ADR 0009](docs/adr/0009-testing-strategy.md). Prefer role and
`data-testid` queries — do not assert hardcoded copy that i18n will change.

### Vitest (unit and component)

| Workspace              | Runner                                 | What to cover                                                                                                                          |
| ---------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `@app/web`             | Vitest + React Testing Library + jsdom | Health card, i18n, query persistence, Sentry no-op. Mock `fetch` with `vi.stubGlobal` / `vi.unstubAllGlobals`. Fake timers for polling |
| `@app/ui`              | Vitest + Testing Library               | Atoms/molecules/organisms, WCAG contrast of theme tokens                                                                               |
| `@app/shared`          | Vitest                                 | Zod schemas, PII scrubber                                                                                                              |
| Root `test/*.test.mjs` | `node --test`                          | Setup helpers, keep-awake window, repo/deploy foundation                                                                               |

```bash
pnpm test
pnpm test:ci
```

### Supertest (API)

`apps/api` uses Vitest + **Supertest** + unplugin-swc (decorator metadata):

- Controller unit tests with mocked dependencies
- Integration tests in `apps/api/test/*.int.spec.ts`
- Connected case against Postgres; disconnected case with overridden providers
- Full NestJS app with the global `/api` prefix

```bash
pnpm --filter @app/api test:ci
```

### Playwright (e2e)

`e2e/smoke.spec.ts` runs against Chromium:

- Homepage loads in Hebrew RTL by default
- Language switch to English LTR (and persists after reload)
- Color scheme toggle persists
- Health badges after `GET :3001/api/health`

CI applies Prisma migrations, builds apps, then runs `api start` + `web preview`.
Locally, Playwright reuses `pnpm dev` when those servers are already up.

```bash
pnpm exec playwright install   # once per machine
pnpm test:e2e
pnpm test:e2e:ui
```

### Storybook

Visual catalog for `@app/ui` (default light theme and dark scheme). The package
is i18n-agnostic: stories pass already-translated strings as props.

```bash
pnpm --filter @app/ui storybook
pnpm --filter @app/ui build-storybook
```

CI builds Storybook to catch broken stories.

## Internationalization and RTL

Hebrew (`he`, RTL) and English (`en`, LTR) ship as the starter pair.
**Languages are configurable**: add a locale folder under
`apps/web/src/i18n/locales/`, register it in `resources.ts`, and extend
`SUPPORTED_LANGUAGES`. Never hardcode user-facing strings — use `t('key')`.
[ADR 0006](docs/adr/0006-bilingual-i18n-rtl-ltr.md).

Namespaces under `apps/web/src/i18n/locales/{he,en}/`:

| File              | Use                                                           |
| ----------------- | ------------------------------------------------------------- |
| `common.json`     | Shared chrome, health card, errors, language and theme labels |
| `items.json`      | Sample `items` feature namespace (replace with your features) |
| `auth.json`       | Authentication copy                                           |
| `validation.json` | Form validation messages                                      |

```typescript
const { t } = useTranslation('items');
<Button>{t('placeholder')}</Button>
```

`apps/web/index.html` ships `lang="he"` `dir="rtl"` so the first paint is RTL.
`DirectionProvider` (Mantine) plus `document.documentElement.dir` / `lang` stay
in sync when the user switches language. The choice is stored in `localStorage`
as `i18nextLng`.

`packages/ui` does not load i18n: pass translated strings in. Test both
directions (Playwright already covers the language switch).

## Theming tokens

The starter ships a **default** theme. **Theme tokens are configurable**: edit
[`packages/ui/src/theme/colors.ts`](packages/ui/src/theme/colors.ts) (and the
matching palettes) to rebrand. Keep WCAG AA contrast (4.5:1 text, 3:1 UI) —
`contrast.test.ts` enforces it.

| Token            | Light                      | Dark                              |
| ---------------- | -------------------------- | --------------------------------- |
| Primary / accent | `brand` `#A99BE0`          | Brightened `brand`                |
| Success          | `success` `#A8E6CF`        | `success` on a deep green surface |
| Body / paper     | Light `brand` wash / white | Neutral `#1E1A2E`                 |

Mantine `createTheme` (`defaultTheme` in `app-theme.ts`) maps those palettes to
CSS variables (`--app-brand`, `--app-success`, `--app-neutral`, plus Mantine
body/text/paper). Color scheme defaults to the OS preference (`auto`) and is
persisted in Zustand under `COLOR_SCHEME_STORAGE_KEY` (`app-ui` until you
rename).

Storybook’s theme toolbar switches light vs dark. PWA `theme_color` in
`apps/web/vite.config.ts` should stay aligned with the primary token.

## API client codegen (Orval)

The web app must not drift from the NestJS HTTP contract.

1. Change controllers or DTOs on the API.
2. Run `pnpm codegen` (or `pnpm --filter @app/api openapi:generate` then
   `pnpm --filter @app/web codegen`).
3. Commit **both** `apps/api/openapi.json` and `apps/web/src/api/generated/`.
4. CI runs `pnpm codegen:check` and fails if git is dirty.

Orval reads the spec and writes TanStack Query hooks. The custom fetch mutator
is `apps/web/src/api/mutator.ts`. Keep OpenAPI operation IDs stable (`getHealth`)
so hook names do not churn. Spec generation sets `SKIP_DB_CONNECT=true` so it
does not need Postgres.

Browse the live contract at http://localhost:3001/api/docs while `pnpm dev` is
running. [ADR 0014](docs/adr/0014-openapi-orval.md).

## Deployment

Free tiers only (Cloudflare Pages + Render + Neon + Sentry EU). Do not enable
paid plans or paid Sentry products.

Full walkthrough, secret **names**, and first-time order:
**[docs/deployment.md](docs/deployment.md)**.

Recommended `master` ruleset (PR required, squash only, required checks):
**[docs/branch-protection.md](docs/branch-protection.md)**. Agents cannot turn
those rules on; a repository owner must apply them in GitHub.

| Piece    | Service                    | Notes                                                        |
| -------- | -------------------------- | ------------------------------------------------------------ |
| Web PWA  | Cloudflare Pages           | Direct-upload from GitHub Actions (not Git-connected builds) |
| API      | Render free web service    | Frankfurt, `healthCheckPath: /health`                        |
| Postgres | Neon free                  | Frankfurt, direct (non-pooled) URL for Prisma Migrate        |
| Errors   | Sentry EU (`de.sentry.io`) | Optional; empty DSN disables the SDK                         |

Workflows after merge to `master`:

- **Deploy API** — `prisma migrate deploy`, then Render deploy hook
- **Deploy Web** — build with `VITE_API_URL` / `VITE_SENTRY_DSN`, upload Pages
- **Keep awake** — ping `/health` every 10 minutes inside the Jerusalem daytime
  window and `KEEPAWAKE_START`–`KEEPAWAKE_END` (stays under Render’s 750 hours)
- **Release Please** — version and changelog PR

Health endpoints: `GET /health` (Render / keep-awake) and `GET /api/health`
(web + OpenAPI). Both return the same payload.

## Starting a new project from this template

Use this template rather than forking, so your repository starts without this
project’s git history.

1. **Create the repository**
   - On GitHub, click **Use this template** → **Create a new repository**.
   - Default branch is `master`.
   - The **source** repo can stay marked as a **Template repository**
     (Settings → General → Template repository). The new repo is a normal
     repository; do not mark it as a template unless you are publishing another
     starter.
2. **Clone and bootstrap**
   ```bash
   git clone <your-new-repo-url>
   cd <your-new-repo>
   pnpm run setup --rename my-product
   ```
   `--rename` replaces `app` / `@app/*`, `app-api`, Docker/Postgres names,
   storage keys (`app-ui`, `app-items-query-cache`), the root package name,
   and the OpenAPI title across package names and configs. It does **not**
   rewrite Hebrew/English marketing copy, theme hex tokens, or PWA icon PNGs —
   do those by hand.
3. **Product copy and schema**
   - i18n `app_name` / `document_title` in
     `apps/web/src/i18n/locales/{he,en}/common.json`
   - PWA `name` / `short_name` in `apps/web/vite.config.ts` and `index.html`
   - Theme tokens in `packages/ui/src/theme/colors.ts`
   - Prisma models (`apps/api/prisma/schema.prisma`) + a committed migration
   - Replace [`docs/PRD.md`](docs/PRD.md) with real requirements
   - Point `.github/ISSUE_TEMPLATE/config.yml` at your docs URL
4. **Secrets and variables**
   - GitHub **Settings → Secrets and variables → Actions**
   - Names and first-time order: [docs/deployment.md](docs/deployment.md)
   - Never commit values. `.env` stays gitignored.
5. **Protect `master`**
   - Apply the ruleset in [docs/branch-protection.md](docs/branch-protection.md)
   - Required checks: `lint-and-build`, `e2e-tests`, `commitlint`, `pr-title`,
     `Analyze`
6. **Search for leftovers**
   - Grep for `@app/`, `app-api`, and `app_dev`
   - Run `pnpm install` after a manual rename so `pnpm-lock.yaml` matches
     (the setup script already does this)

No real personal data in seeds, fixtures, tests, or screenshots
([ADR 0007](docs/adr/0007-no-personal-data-in-repo.md)). The Prisma seed only
inserts empty `_prisma_placeholder` rows.

## Troubleshooting

**`pnpm setup` does something unrelated (installs pnpm globally)**  
Use `pnpm run setup`. `pnpm setup` is Corepack/pnpm’s own installer.

**Node.js version error**  
Install Node 22+. With nvm: `nvm install 22`. Confirm with `node -v`.

**pnpm is missing or too old**

```bash
corepack enable
corepack prepare pnpm@10.33.4 --activate
pnpm -v
```

**Docker is missing / daemon is not running**  
Install [Docker](https://docs.docker.com/get-docker/), start Docker Desktop (or
the Engine service), then rerun `pnpm run setup`. The script waits on the
Compose healthcheck (`pg_isready`).

**Port 5432 is already in use**  
Stop the other Postgres (or change the host port in `docker-compose.yml` and
`DATABASE_URL`). Then `docker compose up -d` and `pnpm run setup`.

**Ports 3000 or 3001 are in use**  
Stop the other process, or change Vite/Nest ports and `CORS_ORIGINS` /
`VITE_API_URL` to match.

**`.env` was not updated after `--rename`**  
Setup never overwrites an existing `.env`. Delete `apps/api/.env` and
`apps/web/.env` (not the `.example` files) and rerun `pnpm run setup`, or edit
`DATABASE_URL` by hand.

**Husky hooks did not run**  
`pnpm prepare`. Confirm `.husky/commit-msg` and `.husky/pre-commit` exist.

**Prisma Client is missing after a fresh clone**  
`pnpm install` (postinstall) or `pnpm db:generate`.

**`prisma migrate` fails on a database that was created with `db push`**  
Baseline once (see [docs/deployment.md](docs/deployment.md)):

```bash
pnpm --filter @app/api exec prisma migrate resolve --applied 20261014120000_init
```

**Generated API client is stale in CI**  
Run `pnpm codegen` and commit `apps/api/openapi.json` plus
`apps/web/src/api/generated/`.

**Playwright cannot find the browser**  
`pnpm exec playwright install` (CI uses `install --with-deps chromium`).

**Commit rejected by commitlint**  
Fix the message to `<type>(<scope>): <description>`. Scope must be one of
`web`, `api`, `shared`, `ui`, `ci`, `docs`, `deps` when present.

**Rerunning setup**  
Safe. Install is incremental, existing `.env` files are kept, Compose `up -d`
is a no-op when the container is healthy, migrations already applied are
skipped, and the seed skips when placeholder rows exist.

## License

MIT
