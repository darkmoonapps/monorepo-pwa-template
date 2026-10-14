# AGENTS.md — Guide for AI agents

## Project overview

This repository is a **reusable PWA monorepo template**. It is not a product.
Replace placeholder names (`app`, `@app/*`) and the home-screen copy with the
product you are building.

**Tech stack**:

- **Frontend**: React 19 + Vite + Mantine (PWA)
- **Backend**: NestJS + Prisma + PostgreSQL
- **Language**: TypeScript throughout
- **Internationalization**: Hebrew (RTL) + English (LTR) via react-i18next
- **Infrastructure**: pnpm monorepo + Turborepo, Docker for local development

## Repository structure

```
.
├── apps/
│   ├── web/              # React PWA frontend
│   └── api/              # NestJS backend
├── packages/
│   ├── shared/           # Shared TypeScript types, Zod schemas, and utilities
│   └── ui/               # Atomic design component library (Mantine + Storybook)
├── docs/
│   ├── PRD.md            # Replace with product requirements
│   ├── adr/              # Architecture Decision Records
│   └── roles/            # Role-specific guides
├── .cursor/
│   ├── rules/            # Always-on agent rules
│   └── skills/           # Agent skills for this monorepo
├── .github/
│   ├── workflows/        # CI, CodeQL, Release Please, commitlint, deploy
│   ├── ISSUE_TEMPLATE/   # Bug and feature issue forms
│   └── PULL_REQUEST_TEMPLATE.md
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Getting started

### Prerequisites

- Node.js 22+
- pnpm 10+
- Docker and Docker Compose (for PostgreSQL)

### Installation

```bash
pnpm install
docker compose up -d
pnpm db:generate
pnpm --filter @app/api prisma migrate dev
pnpm dev
```

Frontend: http://localhost:3000  
Backend: http://localhost:3001

### Common commands

```bash
pnpm dev
pnpm --filter @app/web dev
pnpm --filter @app/api dev

pnpm build
pnpm --filter @app/web build

pnpm lint
pnpm format
pnpm format:check
pnpm typecheck

pnpm db:generate
pnpm --filter @app/api prisma migrate dev
pnpm --filter @app/api prisma studio

pnpm test
pnpm test:e2e
pnpm test:ci

pnpm codegen
pnpm codegen:check
```

## Testing

### Unit and integration tests

**Web** (Vitest + React Testing Library):

- Role and `data-testid` queries (do not hardcode copy that i18n will change)
- `vi.stubGlobal` / `vi.unstubAllGlobals` for `fetch`
- Fake-timer tests for polling
- Healthy and unhealthy API states

```bash
cd apps/web
pnpm test
pnpm test:ci
```

**API** (Vitest + Supertest):

- Controller unit tests with mocked dependencies
- Integration tests in `test/*.int.spec.ts`
- unplugin-swc for decorator metadata
- Connected case against CI Postgres; disconnected case with overridden providers
- Full NestJS app with global `/api` prefix

```bash
cd apps/api
pnpm test
pnpm test:ci
```

### End-to-end tests

Playwright:

- Role and test-id queries
- CI applies Prisma migrations, builds apps, then runs `api start` + `web preview`
- Waits for `GET :3001/api/health` before UI assertions
- Browsers: `pnpm exec playwright install`

```bash
pnpm test:e2e
pnpm test:e2e:ui
```

See [ADR 0009](docs/adr/0009-testing-strategy.md).

## Quality standards — must follow

### 1. TypeScript strictness

- `strict: true`
- Never use `any` — use `unknown` and narrow
- Never use `@ts-ignore` or `@ts-expect-error` unless unavoidable, with a comment
- Explicit return types and parameter types

```typescript
interface ExampleItem {
  name: string;
  id: string;
}

function formatItemName(data: ExampleItem): string {
  return data.name.toUpperCase();
}
```

### 2. Testing

- Every feature needs tests (unit, component, or integration as appropriate)
- No PR without tests for behavior changes
- Test behavior, not implementation details

### 3. Lint, format, typecheck

Before opening a PR:

- `pnpm lint`
- `pnpm format:check`
- `pnpm typecheck`

### 4. Internationalization

- Never hardcode UI strings — use `t('key')`
- Support Hebrew (RTL) and English (LTR)
- Namespaces:

  - `common.json` — shared UI
  - `example.json` — sample feature namespace (replace with your features)
  - `auth.json` — authentication
  - `validation.json` — form validation

```typescript
const { t } = useTranslation('example');
<Button>{t('placeholder')}</Button>
```

### 5. Code quality

- Small, focused PRs
- Single responsibility
- No circular dependencies
- Meaningful names
- Comments only when necessary
- Handle errors

### 6. Security and validation

- Validate input (class-validator on the API)
- Never commit secrets
- HTTPS in production

### 7. Accessibility

- Semantic HTML
- ARIA where needed
- Keyboard access and visible focus
- WCAG AA contrast
- Responsive layout

### 8. No personal data in the repository

- Never commit real personal data — ADR 0007
- Fake data only in tests and seeds
- Commit `.env.example`, never `.env`

### 9. Commits and PRs

Format: `<type>(<scope>): <description>`

Examples:

- `feat(web): add example resource details screen`
- `fix(api): handle missing database connection`
- `docs: update setup instructions in README`
- `test(web): add health card tests`

**Scopes**: `web`, `api`, `shared`, `ui`, `ci`, `docs`, `deps`

Husky: commit-msg (commitlint) and pre-commit (lint-staged). If hooks fail,
`pnpm prepare`.

CI on PRs to `master`: lint/typecheck/build/test, commitlint, PR title, CodeQL.

### 10. Database

- Prisma migrations only — commit the SQL
- Test locally before pushing
- Safe patterns — ADR 0010

### 11. Performance

- Lazy-load routes
- Index common lookups
- Avoid N+1 queries (`include`)

## What not to do

1. Push directly to `master`
2. Merge your own PRs
3. Skip tests
4. Use `any`
5. Hardcode UI strings
6. Commit secrets or personal data
7. Ignore CI failures
8. Open huge PRs
9. Change files outside the task scope
10. Introduce breaking changes without discussion

## PR review checklist

- [ ] Conventional Commits title
- [ ] `pnpm test` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm format:check` passes
- [ ] No hardcoded UI strings
- [ ] No `any` or `@ts-ignore`
- [ ] Works in Hebrew (RTL) and English (LTR)
- [ ] No personal data or secrets
- [ ] Docs/ADRs updated when needed

## Understanding the project

1. Read `docs/PRD.md` (replace it with real product requirements)
2. Read relevant ADRs in `docs/adr/`
3. Follow existing code patterns
4. Read `docs/roles/` for role responsibilities

## Definition of done

1. Feature works as specified
2. Tests written and passing
3. Reviewed and approved by the owner
4. CI green
5. Documentation updated
6. No regressions
7. Hebrew and English both work
8. Accessibility considered
9. Security considered
10. Merged to `master` by the owner
