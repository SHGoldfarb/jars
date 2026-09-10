# Agent Rules For This Repository

## Read README.md For Project Context

Before doing anything, agents must read `/Users/samuelgoldfarb/jars/README.md` for context on what this project is about.

## Read CONTRIBUTING.md Before Making Code Changes

Before making any code changes, agents must read `/Users/samuelgoldfarb/jars/CONTRIBUTING.md` and follow the guidance in it.

## Suggest Documentation Fixes, Never Apply Them

Documentation in this repository (`README.md`, `CONTRIBUTING.md`, `AGENTS.md`, and any other
docs) is maintained by humans. Agents must never edit it on their own initiative.

When an agent notices documentation that is wrong, stale, or has drifted from the actual state of
the code — a folder that is documented but does not exist, a described structure that no longer
matches the tree, an outdated command, a rule the codebase no longer follows — it must:

1. Finish the task it was asked to do.
2. Report the drift to the user, quoting the specific documentation text and what the code
   actually does.
3. Suggest the correction, and stop there.

Agents must not apply the fix unless the user explicitly asks for that documentation change.
Noticing drift is never on its own permission to edit the docs.

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

## A Failing Test Is Not Automatically A Broken Test

The Playwright timeouts are deliberately tight: the suite normally finishes just under them.
That is intentional and is not to be "fixed". A consequence is that a test can exceed its
timeout purely because the machine was busy — running the full suite, several projects at once,
or anything else competing for CPU — with nothing actually wrong.

So before reporting a test as broken, or changing code to make it pass:

1. Re-run that test on its own (`pnpm exec playwright test -g '<test title>'`), and re-run it a
   few times if the first result is ambiguous.
2. If it passes in isolation, it was load, not a regression. Say so, and leave it alone.
3. Only treat it as a real failure once it fails in isolation too.

Forbidden as a response to a timeout:

1. Adding `test.slow()` to a test that already exists. Its budget is the one it was written
   with, and widening it hides whatever actually changed.
2. Raising `timeout`, `expect.timeout` or any other timeout in the Playwright config.
3. Lowering `workers` or otherwise reducing parallelism to buy time.

A **new** test may declare `test.slow()` when the work it does warrants it — it creates several
entities, walks through many screens, and so on. That is a judgement made when writing the test,
about what the test does; it is never a reaction to seeing it time out.

If a test genuinely cannot fit in the configured budget, report that and propose making the test
do less work — not making the budget bigger.
