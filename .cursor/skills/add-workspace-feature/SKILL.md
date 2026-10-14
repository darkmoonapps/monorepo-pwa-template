---
name: add-workspace-feature
description: Add a feature across the pnpm/Turborepo PWA monorepo (shared Zod, NestJS, Orval, web i18n, UI). Use when creating a new domain module or end-to-end vertical slice.
---

# Add a workspace feature

Work top-down so types stay the source of truth.

1. **Contract** — add a Zod schema in `packages/shared/src/schemas/`, export it from `packages/shared/src/schemas/index.ts` and `types.ts`. Add a unit test.
2. **API** — NestJS module under `apps/api/src/<feature>/` with DTO, controller, service. Register in `app.module.ts`. Prisma model + committed migration if persistence is needed.
3. **OpenAPI** — run `pnpm codegen` and commit `apps/api/openapi.json` plus `apps/web/src/api/generated/`.
4. **Web** — wire Orval hooks or a small query helper. Persist to `localStorage` only if the query key is allowlisted in `apps/web/src/api/query-persistence.ts` (the example key is `example-resource-details`).
5. **i18n** — add keys to both `he` and `en` JSON. Never hardcode copy. Add a namespace rather than overloading `example.json` once the product has a real feature.
6. **UI** — presentational pieces in `packages/ui` (atom → molecule → organism) with Storybook stories. Pass translated strings as props.
7. **Tests** — web RTL tests, API unit + Supertest, Playwright only for the user-visible flow.
8. **Name** — keep package scope `@app/*` unless the repo has already been renamed.

Do not invent product domain from this template's old examples. The shipped vertical slice is health status plus an example persisted query key.
