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

When adding new behavior, prefer changes that preserve these boundaries instead of introducing direct cross-layer coupling.

## Folder Structure

The main application code lives under `src/` and is grouped by responsibility:

- `src/components/` - React UI components
- `src/hooks/` - React hooks that bridge UI and application services
- `src/routes/` - TanStack Router route files
- `src/services/finance/` - finance bounded context and domain code
  - `application/` - command/query orchestration
  - `domain/` - repository contracts and domain-facing abstractions
  - `infrastructure/` - Dexie and other persistence adapters
  - `model/` - domain entities and value objects
  - `policies/` - business validation and rules
- `src/services/shared/` - shared value objects and utilities
- `src/tests/unit/` - unit tests
- `src/tests/e2e/` - Playwright end-to-end tests

Keep new files aligned with the existing layer they belong to. If a change crosses layers, prefer adding a boundary or adapter instead of moving the responsibility into the wrong folder.

## Testing

- Add or update unit tests for domain and application behavior.
- Keep Playwright tests focused on user-visible flows.
- Prefer verifying behavior through public contracts rather than internal implementation details.

## Pull Requests

- Summarize what changed and why.
- Call out any boundary changes or DDD-related refactors.
- Mention the checks you ran.
- If a change intentionally trades off strict type safety, explain why and what the safest available alternative is.
