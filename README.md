# monorepo-pwa-template

Reusable GitHub template for a bilingual Progressive Web App monorepo.

Use it when you want a ready foundation: pnpm workspaces, Turborepo, a React 19
PWA, a NestJS API, shared Zod contracts, and an atomic UI package — without any
product-specific domain.

## Use this template

1. On GitHub, open this repository and click **Use this template** →
   **Create a new repository**.
2. Clone the new repository. The default branch is `master`.
3. Rename placeholders (see [Rename](#rename)).
4. Set GitHub Actions secrets and variables as listed in
   [docs/deployment.md](docs/deployment.md).
5. Apply the `master` ruleset from
   [docs/branch-protection.md](docs/branch-protection.md).
6. Copy `.env` examples, start Postgres, and run the apps locally.

This skeleton ships a health-check example (API + database + persisted query
cache), not a product. Replace the home copy, PWA name, theme tokens, and
Prisma models with your own.

## Architecture

pnpm workspaces + Turborepo:

- **`apps/web`**: React 19 + Vite + TypeScript + Mantine UI PWA, mobile-first,
  Hebrew RTL / English LTR
- **`apps/api`**: NestJS + TypeScript + Prisma REST API, OpenAPI/Swagger at
  `/api/docs`
- **`packages/shared`**: Shared TypeScript types and Zod schemas
- **`packages/ui`**: Atomic design component library on Mantine, documented in
  Storybook

### Tech stack

- **Frontend**: React 19, Vite 6, Mantine UI 9, react-i18next, Zustand,
  TanStack Query (`persistQueryClient`), vite-plugin-pwa, Sentry
- **Backend**: NestJS 11, Prisma 6, PostgreSQL 16, @nestjs/swagger, Sentry
- **Shared**: Zod schemas, Orval-generated React Query clients
- **Tooling**: TypeScript 5.7, ESLint 9 (flat config), Prettier, Vitest,
  Playwright, Storybook
- **Package management**: pnpm 10+ workspaces
- **Task runner**: Turborepo 2 (`lint`, `typecheck`, `test`, `build`)
- **CI/CD**: GitHub Actions, Dependabot, CodeQL, Release Please, Cloudflare
  Pages, Render, Neon
- **Observability**: Sentry EU (`@sentry/react`, `@sentry/nestjs`), disabled
  when the DSN is unset. Events pass a PII scrubber (`sendDefaultPii: false`)

## Rename

After **Use this template**, replace these placeholders to match your product:

| Placeholder                                      | Where                                                      |
| ------------------------------------------------ | ---------------------------------------------------------- |
| `app` (root package name)                        | `package.json`, `release-please-config.json`               |
| `@app/web`, `@app/api`, `@app/shared`, `@app/ui` | workspace `package.json` files, scripts, CI, `render.yaml` |
| `app-api`                                        | `render.yaml`, Sentry project names in docs                |
| `app` / `app_dev` Postgres names                 | `docker-compose.yml`, `apps/api/.env.example`              |
| `app-ui`, `app-example-query-cache`              | storage keys in `packages/shared` and `apps/web`           |
| i18n `app_name` / `document_title`               | `apps/web/src/i18n/locales/{he,en}/common.json`            |
| PWA `name` / `short_name`                        | `apps/web/vite.config.ts`, `apps/web/index.html`           |
| Theme tokens                                     | `packages/ui/src/theme/colors.ts`                          |
| OpenAPI title                                    | `apps/api/src/configure-app.ts` (then `pnpm codegen`)      |
| Issue template docs URL                          | `.github/ISSUE_TEMPLATE/config.yml`                        |

Search the repo for `@app/` and `app-api` to catch remaining references. Run
`pnpm install` after renaming packages so `pnpm-lock.yaml` stays in sync.

## Prerequisites

- Node.js >= 22.0.0 (LTS)
- pnpm >= 10.0.0
- Docker and Docker Compose (for local PostgreSQL)

## Getting started

### 1. Clone and install

```bash
git clone <repository-url>
cd <repository-directory>
pnpm install
```

`pnpm install` generates the Prisma Client (`apps/api` postinstall) and sets up
Husky git hooks. If hooks are missing, run `pnpm prepare`. You can also run
`pnpm db:generate` yourself.

### 2. Environment files

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

**API**

- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: API server port (default: `3001`)
- `CORS_ORIGINS`: comma-separated origins (default: `http://localhost:3000`)
- `SENTRY_DSN`: optional EU Sentry DSN. Empty disables Sentry

**Web**

- `VITE_API_URL`: API origin (Vite proxy target in development; fetch prefix in
  production)
- `VITE_SENTRY_DSN`: optional EU Sentry DSN. Empty disables Sentry

Hosted setup (Cloudflare Pages, Render, Neon, Sentry EU) is in
[docs/deployment.md](docs/deployment.md).

### 3. Database

```bash
docker compose up -d
```

PostgreSQL 16 listens on `localhost:5432`.

### 4. Development servers

```bash
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:3001

The web app uses relative `/api` URLs, proxied to the API in development.

## Scripts

From the repository root:

- `pnpm dev` — start web and API in parallel
- `pnpm build` — build all packages (Turborepo, cached)
- `pnpm lint` — ESLint via Turborepo
- `pnpm typecheck` — TypeScript via Turborepo
- `pnpm format` / `pnpm format:check` — Prettier
- `pnpm db:generate` — generate Prisma Client
- `pnpm test` — unit and integration tests
- `pnpm test:ci` — tests with coverage
- `pnpm test:e2e` — Playwright
- `pnpm codegen` — OpenAPI spec + Orval clients
- `pnpm codegen:check` — fail if generated clients are stale
- `pnpm --filter @app/ui storybook` — UI Storybook

API (`apps/api`): `pnpm prisma:generate`, `pnpm prisma:migrate`,
`pnpm prisma:studio`, `pnpm test`.

Web (`apps/web`): `pnpm test`.

## Project structure

```
.
├── apps/
│   ├── web/          # React + Vite PWA
│   └── api/          # NestJS API + Prisma
├── packages/
│   ├── shared/       # Zod schemas and shared types
│   └── ui/           # Atomic design system + Storybook
├── .github/
│   ├── workflows/    # CI, deploy, keep-awake, CodeQL, Release Please, commitlint
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── .cursor/
│   ├── rules/        # Agent rules (quality, i18n, tests, commits, no PII)
│   └── skills/       # Agent skills for working in this monorepo
├── docs/
│   ├── deployment.md
│   ├── branch-protection.md
│   ├── PRD.md        # Replace with your product requirements
│   ├── adr/          # Architecture Decision Records
│   └── roles/
├── render.yaml
├── turbo.json
├── docker-compose.yml
├── pnpm-workspace.yaml
└── package.json
```

## Ports

- **3000**: web (Vite)
- **3001**: API (NestJS)
- **5432**: PostgreSQL

## CI/CD

Workflows on pull requests to `master`:

1. **CI** (`.github/workflows/ci.yml`): lint, typecheck, codegen check,
   Prettier, Prisma migrate, build, Storybook build, unit/integration tests,
   Playwright e2e
2. **Commit Lint** — Conventional Commits on every commit in the PR
3. **PR Title Check** — Conventional Commits PR title (squash merges)
4. **CodeQL** — JavaScript/TypeScript on PRs, pushes to `master`, and weekly

Also:

- **Dependabot** — weekly npm and GitHub Actions updates (ADR 0016)
- **Release Please** — version and changelog PR after merge to `master`
  (ADR 0017)
- **Deploy API** — `prisma migrate deploy` then Render deploy hook (ADR 0018)
- **Deploy Web** — build and upload to Cloudflare Pages
- **Keep awake** — ping `/health` every 10 minutes inside the configured
  daytime window

Recommended `master` protection is in
[docs/branch-protection.md](docs/branch-protection.md). Hosted free-tier
setup is in [docs/deployment.md](docs/deployment.md).

## PWA

- Service worker (offline)
- Web app manifest
- Mobile-first layout
- RTL/Hebrew via Mantine `DirectionProvider`
- Placeholder icons (192, 512, 512 maskable)

Replace the placeholder icons and manifest name before production.

## Database

PostgreSQL via Docker Compose and Prisma. The schema ships a placeholder table
only. Add models with `pnpm --filter @app/api prisma migrate dev --name <description>`
and commit the migration folder.

```bash
cd apps/api
pnpm prisma:studio
```

## Commits

Conventional Commits: `<type>(<scope>): <description>`

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
`build`, `ci`, `chore`, `revert`

**Scopes**: `web`, `api`, `shared`, `ui`, `ci`, `docs`, `deps`

Husky:

- **commit-msg**: commitlint
- **pre-commit**: lint-staged (Prettier + ESLint)

See [AGENTS.md](AGENTS.md) and
[docs/adr/0008-conventional-commits.md](docs/adr/0008-conventional-commits.md).

## Security and data policy

Do not commit real personal data (names, phone numbers, addresses) in seeds,
fixtures, tests, or screenshots. Use obviously fake data only (ADR 0007).
Sentry is configured with PII scrubbing; leave DSNs empty to disable it.

## API

CORS uses `CORS_ORIGINS` (default `http://localhost:3000`).

OpenAPI UI: http://localhost:3001/api/docs. After changing controllers or DTOs,
run `pnpm codegen` and commit the spec and generated client.

Web requests to `/api/*` are proxied in development and prefixed with
`VITE_API_URL` in production.

## License

MIT
