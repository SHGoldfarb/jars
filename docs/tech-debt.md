# Tech Debt

Known engineering debt, roughly in priority order. Unlike `product/epics.md`, nothing here is
user-facing.

- [ ] **Import `finance` through its barrel** — 16 files (for example `src/hooks/useAccounts.ts` and
      `src/components/TransfersNew.tsx`) reach into `src/services/finance/application` instead of the
      context barrel. Worth doing together with the `Allocation` cleanup below: `finance/index.ts` is
      still `export *`, so pointing more call sites at it spreads a surface nobody chose.
- [ ] **Enforce the dependency direction in ESLint** — the layering in `CONTRIBUTING.md` is
      documented but unchecked, which is how it drifted in the first place. Now that every context
      has a barrel, a `no-restricted-imports` rule banning `src/services/*/*/**` covers most of it.
- [ ] **Clean up `Allocation` in `entities/legacy.ts`** — an unimplemented, unvalidated hand-written
      type is exported through the public `src/services/finance` barrel.
- [ ] **Fix the 7 prettier failures** — `pnpm format:check` is failing on the shadcn `ui/*` files and
      `.vscode/mcp.json`.

<!--
Keep this example when the list empties out, so the next entry follows the same shape:

- [ ] **Imperative title naming the fix** — what is wrong, and why it is debt rather than a bug.
      May name the files or commands for a reader to check. Keep the list roughly in priority order.
      Don't go into much detail: this is about the max size.
-->
