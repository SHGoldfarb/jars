# Contributing to Jars

Thanks for contributing. This project is built with a strict TypeScript and Domain-Driven Design mindset, so changes should preserve clear boundaries and strong types.

## Local Setup

### Prerequisites

- Node.js `24.15.0` or compatible with the repo engine requirement
- `pnpm` `11.x`
- A recent version of Chrome for Playwright tests

### Install dependencies

```bash
pnpm install
```

### Run the app locally

```bash
pnpm dev
```

### Common checks

```bash
pnpm exec tsc -b
pnpm lint
pnpm format:check
pnpm test
```

Use `pnpm test:chromium` when you only want the Chromium Playwright project.

## Working Style

- Prefer small, focused changes.
- Prefer arrow functions over function declarations and object method shorthand for consistency.
- Don't reach for `useMemo`, `useCallback`, or `React.memo` prophylactically. Add them only for a
  measured need — a real referential-identity consumer or a genuinely expensive computation — and
  match how neighbouring components derive their data.
- Keep TypeScript strict and type-safe.
- Avoid `any`, unsafe casts, and non-null assertions unless there is no safer alternative and the tradeoff is clearly explained.
- Update or add tests when behavior changes.
- Run the relevant checks before opening a PR.

## Domain-Driven Design

This repo follows DDD principles as closely as practical for a frontend application.

- The finance code is organized around a bounded context.
- Domain concepts should stay in the model and application layers, not leak into UI components.
- UI components and hooks should talk to application services, not persistence details.
- Infrastructure should stay behind repository or adapter boundaries.
- Validation belongs at boundaries, while domain rules should be enforced as close to the model as possible.
- Don't add a service or application layer that only forwards to another layer. A form-specific
  command module earns its place only when it holds real orchestration (cross-entity validation,
  restore-on-edit, and so on); a plain create flow calls the finance application commands directly
  from its hook or component (see `AccountsNew`, `JarsNew`).

When adding new behavior, prefer changes that preserve these boundaries instead of introducing direct cross-layer coupling.

## Folder Structure

The main application code lives under `src/` and is grouped by responsibility:

- `src/components/` - React UI components
  - `ui/` - shadcn primitives
- `src/hooks/` - React hooks that bridge UI and application services
- `src/routes/` - TanStack Router route files
- `src/presentation/` - view-layer presentation logic
  - `formatters/` - currency and date formatting
- `src/lib/` - framework-agnostic technical utilities with no domain or business knowledge (`cn`, `generateId`, memoization,
  `Decimal` arithmetic, generic form helpers, `datetime-local` input conversion)
- `src/services/` - bounded contexts
  - `finance/` - the core finance context
    - `application/` - command/query orchestration (`commands/`)
    - `domain/` - repository contracts and domain commands (`commands/`)
    - `infrastructure/` - Dexie and other persistence adapters
    - `model/` - domain entities (`entities/`)
  - `balances/` - account and jar balances derived from finance (`application/`, `domain/`)
  - `transaction-form/` - transaction form orchestration (`application/`, `domain/`)
  - `transfer-form/` - transfer form orchestration (`application/`, `domain/`)
  - `allocation-form/` - allocation form orchestration (`application/`, `domain/`)
  - `shared/` - shared kernel: value objects used by more than one context (`CurrencyAmount`)
    and the boundary parsing that produces them (`currencyInput`)
- `src/tests/unit/` - unit tests
- `src/tests/e2e/` - Playwright end-to-end tests
  - `pages/` - page objects
  - `setup/` - shared fixtures and actions

Keep new files aligned with the existing layer they belong to. If a change crosses layers, prefer adding a boundary or adapter instead of moving the responsibility into the wrong folder.

### Dependency Direction

Imports point downward through these tiers, never back up:

```
components / hooks / routes    UI
        ↓
presentation                   formatting and view mapping
        ↓
services/{finance,balances,*-form}   bounded contexts
        ↓
services/shared                shared kernel - domain value objects
        ↓
lib                            technical primitives, no domain knowledge
```

### Context Barrels

Every bounded context exposes one public surface from its `index.ts`, and consumers import that
barrel rather than reaching into `application/` or `domain/`. This keeps a context free to move
things between its own layers without touching the UI. Name the exports explicitly
(`export const transactionForm = { commands, queries, ... }`) instead of `export *`, so nothing
becomes public by accident.

## Testing

- Default to end-to-end (Playwright) tests that exercise real user-visible flows. Reserve unit
  tests for logic that is both hard to exercise through behavior and critical to get exactly right
  (for example, the LRU cache in `unit.spec.ts`). A domain rule already covered by an e2e flow does
  not also need a unit test.
- Never compute an expected value with the same code that produces it in the app. Pure programming
  utilities (e.g. `runInOrder`) are fine to reuse; anything that encodes a business rule or
  behavior — formatters, parsers, domain and application logic — is not, because recomputing with
  it means the test only re-derives the app's own result and cannot catch a regression in that
  code. When the input is hardcoded, hardcode the expected output too, and pin `locale` /
  `timezoneId` when needed for determinism.
- Locate elements by user-visible content or ARIA role, never by implementation-detail selectors
  (`data-slot`, CSS classes, test-only attributes).
- Navigate by interacting with the UI (click nav links and buttons), not `page.goto(url)`. A full
  URL load re-boots the app and slows the suite; the app is loaded once by the root fixture.
- Keep e2e tests separated per use case. Multiple behavior assertions in the same test is allowed as long as they belong to the same use case.

## Pull Requests

- Summarize what changed and why.
- Call out any boundary changes or DDD-related refactors.
- Mention the checks you ran.
- If a change intentionally trades off strict type safety, explain why and what the safest available alternative is.
