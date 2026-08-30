# Agent Rules For This Repository

## Read CONTRIBUTING.md Before Making Code Changes

Before making any code changes, agents must read `/Users/samuelgoldfarb/jars/CONTRIBUTING.md` and follow the guidance in it.

## Type Safety Is Mandatory

When editing code in this repository, agents must prefer type-safe solutions over quick fixes.

Required behavior:

1. Preserve strict TypeScript guarantees and keep types as narrow as possible.
2. Prefer validated domain types, discriminated unions, generic constraints, and explicit return types where useful.
3. Prefer runtime schema validation (for external/untrusted input) over unsafe assumptions.
4. Refactor code structure when needed to keep type safety intact.

Forbidden behavior unless explicitly requested by a user:

1. `any` (explicit or inferred by workaround).
2. Non-null assertions (`!`) used to silence errors.
3. Broad casts that bypass checking (for example `as unknown as T`).
4. "Type guard" predicates that only satisfy TypeScript without trustworthy runtime checks.
5. Disabling or weakening compiler/lint rules to hide type issues.

When resolving type errors, agents should:

1. Fix the model or control flow first.
2. Use narrowing that is justified by data shape and runtime behavior.
3. Add or reuse validation/parsing at boundaries.
4. Verify with project typecheck (`pnpm exec tsc -b`) and relevant tests.

If a fully type-safe fix is impossible, agents must clearly explain the tradeoff and propose the safest available alternative.
