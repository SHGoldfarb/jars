# Tech Debt

Known engineering debt, roughly in priority order. Unlike `product/epics.md`, nothing here is
user-facing.

- [ ] **Move form utils out of `src/lib/`** — `movementFormUtils.ts`, `transactionFormUtils.ts` and
      `transferFormUtils.ts` import from `src/services/`, breaking the dependency direction because
      they are form-to-domain mapping rather than technical utilities.
- [ ] **Enforce the dependency direction in ESLint** — the layering in `CONTRIBUTING.md` is
      documented but unchecked, which is how it drifted in the first place.
- [ ] **Clean up `Allocation` in `entities/legacy.ts`** — an unimplemented, unvalidated hand-written
      type is exported through the public `src/services/finance` barrel.
- [ ] **Fix the 7 prettier failures** — `pnpm format:check` is failing on the shadcn `ui/*` files and
      `.vscode/mcp.json`.
