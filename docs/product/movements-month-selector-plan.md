# Plan — Movements month selector

**Goal:** the Movements view shows one calendar month at a time. A selector sits between the navbar
and the creation buttons: `‹ September 2026 ▾ ›`. The label opens a dropdown of months to pick from,
the arrows step one month back or forward, and the default is the current month.

**Shape of this plan:** one slice that carries the whole capability from `src/lib` up to Playwright,
then two small follow-ups. Slice 1 is not splittable in a way that leaves the suite green — the
moment the list starts hiding rows, every spec that asserts a movement row is affected — so it lands
as one vertical slice, described below as ordered steps.

---

## Decisions taken up front

1. **Selector shape: label + arrows, label opens a dropdown.** `‹ [September 2026 ▾] ›` using the
   vendored shadcn `Select` for the dropdown and two icon `Button`s for the arrows.
2. **The selected month lives in the URL**: `/movements?month=2026-09`, validated at the route
   boundary with zod via TanStack Router's `validateSearch`. It survives a reload, back/forward walks
   the months, and — decision 5 — a form can send the user back to the month it just wrote into.
   The app has no search params today, so this is the first `validateSearch` in `src/routes/`.
3. **Months are UTC.** Movement dates are stored as UTC instants and rendered with `timeZone: 'UTC'`
   (`presentation/formatters/dateFormatters.ts:2`), and `dateInput.parseToISO` reads the
   `datetime-local` value as UTC. Bucketing by local time would put a movement in a month whose own
   row shows a different date. Every boundary computed here is therefore `Date.UTC`-based.
4. **Filtering belongs to the finance domain query, not the component.** `listMovementsOfType`
   already owns "which movements are in this list"; the month is one more `MovementListParams` field
   next to `includeArchived` and `orderBy`. The UI decides _which_ month, never _how_ to filter.
5. **Saving or deleting a movement returns to that movement's month**, not to today. Without this,
   a transaction dated in May, saved while browsing May, lands the user back on September and looks
   like it vanished. This is also what keeps the e2e suite from needing a month selection at ~50
   call sites (see "What this does to the test suite").
6. **The dropdown lists the months that actually have movements**, plus the current month and the
   selected one. No arbitrary rolling window; the arrows already reach any month, including empty ones.

---

# Slice 1 — Movements are scoped to one month

### Step 1 — `src/lib/yearMonth.ts` (new)

A calendar-month primitive. No domain knowledge, so it belongs in `lib` next to `dateInput.ts`.

```ts
import * as z from 'zod';

// A calendar month as the 'YYYY-MM' key the Movements URL carries. Months are UTC: movement
// dates are stored as UTC instants and rendered with timeZone: 'UTC', so bucketing by anything
// else would file a movement under a month its own row does not show.
export const YearMonthKey = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be formatted as YYYY-MM')
  .brand<'YearMonthKey'>();

export type YearMonthKey = z.infer<typeof YearMonthKey>;
```

Helpers, all built on `Date.UTC` so year rollover and month overflow are the platform's problem:

| function             | returns                                                                               |
| -------------------- | ------------------------------------------------------------------------------------- |
| `current()`          | the month of "now", UTC                                                               |
| `fromISO(dateISO)`   | the month an ISO instant falls in                                                     |
| `shift(key, months)` | `shift(k, -1)` / `shift(k, 1)` for the arrows                                         |
| `toParts(key)`       | `{ year: number; month: number }` (month 1-12), for the label formatter               |
| `toRangeISO(key)`    | `{ fromISO, untilISO }` — **half-open**, `untilISO` is the next month's first instant |

`toRangeISO` is half-open on purpose: no `23:59:59.999` end boundary to get wrong, and no dependence
on the millisecond precision of stored dates.

Exported as `export const yearMonth = { schema: YearMonthKey, current, fromISO, shift, toParts, toRangeISO }`,
matching how `dateInput` exports its group.

### Step 2 — the label formatter

**Edit `src/presentation/formatters/dateFormatters.ts`** — formatting is presentation, not `lib`:

```ts
export const formatYearMonth = (key: YearMonthKey) => {
  const { year, month } = yearMonth.toParts(key);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
};
```

Same `undefined` locale + UTC pairing as `formatDateISO`, so the selector and the rows agree.

### Step 3 — finance domain query

**Edit `src/services/finance/domain/queries.ts`:**

- `MovementListParams` gains `month?: YearMonthKey`.
- `listMovementsOfType` resolves the range once per call and filters on it:

  ```ts
  // ISO instants are all produced by toISOString(), so they are the same length, same offset
  // and compare lexicographically — the same property orderMovements already relies on.
  const range = month ? yearMonth.toRangeISO(month) : undefined;
  const isInMonth = (item: Movement) =>
    !range || (item.dateISO >= range.fromISO && item.dateISO < range.untilISO);
  ```

  Putting it in `listMovementsOfType` gives all three kinds and the interleaved `listMovements` the
  filter for free — no change to `listMovements` itself beyond passing `params` through, which it
  already does.

- **New `listMovementMonths({ transactions, transfers, allocations }, params)`** → `YearMonthKey[]`,
  descending, distinct, archived excluded by the same rule as the lists. Reuses `yearMonth.fromISO`.
  Registered under `financeDomainQueries.movements.months`.

### Step 4 — finance application query

**Edit `src/services/finance/application/queries.ts`** — `movements.list` accepts `month` in its
params object and forwards it; new `movements.months()` reads the three repositories and calls the
domain query. Both keep the existing shape, so `finance/index.ts` needs no new export beyond the
`YearMonthKey` type flowing through `MovementListParams`.

### Step 5 — the route boundary

**Edit `src/routes/movements.tsx`:**

```ts
const movementsSearchSchema = z.object({
  // A hand-edited or stale URL degrades to "no month", which the view reads as the current
  // month — better than an error boundary on a bookmarked link.
  month: YearMonthKey.optional().catch(undefined),
});

export const Route = createFileRoute('/movements')({
  component: Movements,
  validateSearch: movementsSearchSchema,
});
```

This is the untrusted boundary the rest of the feature trusts: below it, a `YearMonthKey` is always
a real month.

### Step 6 — hooks

- **New `src/hooks/useSelectedMonth.ts`** — reads `Route.useSearch()` (`from: '/movements'`) and
  returns `{ month, selectMonth }`; `month` falls back to `yearMonth.current()` when the param is
  absent, and `selectMonth` navigates with `search: { month }`. Month changes push history entries,
  so back/forward walks the months the user looked at.
- **Edit `src/hooks/useMovements.ts`** — takes `month: YearMonthKey`, query key
  `['financeQueries.listMovements', month]`, passes `{ month }` to the query.
- **New `src/hooks/useMovementMonths.ts`** — `['financeQueries.listMovementMonths']` →
  `financeQueries.movements.months()`.

### Step 7 — components

**New `src/components/MonthSelector.tsx`** — one component, no state of its own:

```tsx
export const MonthSelector = ({
  month,
  monthsWithMovements,
  onSelectMonth,
}: {
  month: YearMonthKey;
  monthsWithMovements: YearMonthKey[];
  onSelectMonth: (month: YearMonthKey) => void;
}) => { ... }
```

- `‹` — `Button variant="ghost" size="icon"`, `aria-label="Previous month"`, `ChevronLeftIcon`,
  `onClick` → `onSelectMonth(yearMonth.shift(month, -1))`. `›` is the mirror with `+1`.
- The middle is a `Select` whose `SelectTrigger` carries `aria-label="Month"` and whose options come
  from `SelectOptions` — `{ value: key, label: formatYearMonth(key) }`.
- The option list is `monthsWithMovements` unioned with the selected month and `yearMonth.current()`,
  deduplicated and sorted descending. The union is what keeps the trigger from rendering blank when
  the user arrows into an empty month: radix reads the trigger's text from the matching option.

**Edit `src/components/Movements.tsx`** — wire the three hooks and render the selector above the
list, in a `max-w-lg mx-auto` wrapper so it lines up with `GenericList`'s `ItemGroup`. The
`movementUrl` mapping and the three `actions` are untouched.

### Step 8 — save and delete return to the movement's month

The six components that call `navigate({ to: '/movements' })` pass the month of the movement they
just wrote:

| file                   | month source                                             |
| ---------------------- | -------------------------------------------------------- |
| `TransactionsNew.tsx`  | `yearMonth.fromISO(value.dateISO)` (the submitted value) |
| `TransactionsEdit.tsx` | submitted value on save, `transaction.dateISO` on delete |
| `TransfersNew.tsx`     | `movementForm.transfers.toUnsaved(draft).dateISO`        |
| `TransfersEdit.tsx`    | submitted draft on save, `transfer.dateISO` on delete    |
| `AllocationsNew.tsx`   | as `TransfersNew`                                        |
| `AllocationsEdit.tsx`  | as `TransfersEdit`                                       |

`onCancelRoute="/movements"` stays as it is in this slice — cancelling lands on the current month.
Slice 2 makes cancel return to where the user came from.

### What this does to the test suite

Today `DEFAULT_MOVEMENT_DATE` is `'2026-02-10T09:00'` (`setup/actions.ts:5`), the Money Manager
import and backup/restore fixtures are all February 2026, and 44 sites navigate to Movements.
Against a real clock, every one of those rows would be filtered out — not a broken feature, a
suite that has no opinion about "today".

**Pin the clock instead of rewriting the fixtures.** In the `rootLayoutPage` fixture
(`setup/pages.ts:36`), before `page.goto('/')`:

```ts
// The Movements list defaults to the current month, so "now" is part of the fixture. Pinned
// inside February 2026, the month every dateless fixture and every import file already uses.
export const TEST_NOW = new Date('2026-02-15T12:00:00.000Z');
await page.clock.setFixedTime(TEST_NOW);
```

`setFixedTime` fixes `Date.now()`/`new Date()` and leaves timers running, so the PWA update check
and React Query are unaffected (unlike `clock.install`, which pauses them — do not use it here).

That one change keeps every February-dated test green as-is: the whole of `settings.spec.ts`,
`moneyManagerImport.spec.ts`, and every spec that uses the dateless create fixtures. What still
needs work:

- **`pages/movements.page.ts`** — add `monthSelect` (`combobox`, name `Month`),
  `previousMonthButton`, `nextMonthButton` and `selectMonth(label)`.
- **`movements.spec.ts`** — both ordering tests spread their movements across May/June/July. Move
  them to `2026-02-01/02/03` so they keep testing ordering rather than filtering; cross-month
  behaviour gets its own tests below.
- **`transfers.spec.ts` / `allocations.spec.ts`** — the create (`2026-05-20`) and edit
  (`2026-06-15` → `2026-07-11`) tests assert rows right after submitting, so step 8 lands them on
  the right month already. Re-run and only add `selectMonth` where a test reaches Movements through
  the navbar between creating and asserting.
- **Determinism won on the side:** `settings.spec.ts:62`'s `todayInUTC()` and the two
  "date defaults to today" assertions (`transfers.spec.ts:70`, `allocations.spec.ts:70`) currently
  compare a Node-side `new Date()` against a browser-side one. Replace all three with `TEST_NOW`.

### New tests — `movements.spec.ts`, `describe('movements month selector')`

One use case per test, every expected string hardcoded (`test.use({ locale: 'en-US', timezoneId: 'UTC' })`):

| test                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| the list opens on the current month — a February movement is listed, the selector reads `February 2026`                                                                 |
| only the selected month is listed — one February and one March movement; March's row is absent                                                                          |
| the next button moves forward a month — `March 2026`, the March row appears, the February one is gone                                                                   |
| the previous button moves back a month — back to `February 2026` from March                                                                                             |
| a month can be picked from the dropdown — create in February and April, open the dropdown, pick `April 2026`                                                            |
| the dropdown offers the months that have movements — February and April are offered, March is not                                                                       |
| the selected month survives a reload — arrow to `March 2026`, `page.reload()`, still `March 2026`                                                                       |
| saving a movement dated in another month lands on that month — edit a February movement to a March date, assert the list shows `March 2026` with that row (pins step 8) |

**Done when:** Movements shows exactly one month, defaulting to the current one; both arrows and the
dropdown change it; the month is in the URL; and saving into another month follows the movement there.

Checks: `pnpm exec tsc -b && pnpm lint && pnpm format:check && pnpm test:chromium`, then `pnpm test`.

---

# Slice 2 — The month follows the user into the forms

Small, and only worth doing once slice 1 is in a user's hands.

- **Edit `GenericList.tsx`** — `GenericListAction` gains an optional `search`, passed to `Link`.
  `Movements.tsx` then sends the selected month to `/transactions/new`, `/transfers/new` and
  `/allocations/new`.
- **Edit the three form routes** — the same `validateSearch` shape, so `onCancelRoute` can carry the
  month back. Cancelling from a form opened while browsing May returns to May.
- **Optionally**: default the new movement's date to the selected month rather than today when the
  user is browsing a past month. **Recommendation: don't** — a date field that silently disagrees
  with "today" is a worse surprise than a two-click correction. Raise it with the user instead.
- **Test**: cancel from "Add transaction" while browsing March returns to March.

---

# Slice 3 — Empty month

- **Edit `Movements.tsx`** — when the selected month has no movements, render a quiet
  `ItemDescription`-styled line ("No movements in February 2026") under the action row, so an empty
  month reads as empty rather than broken.
- **Test**: arrow into a month with no movements and assert the message.

---

## File summary

**New (5):**

```
src/lib/yearMonth.ts
src/hooks/useSelectedMonth.ts
src/hooks/useMovementMonths.ts
src/components/MonthSelector.tsx
src/tests/e2e/... (no new spec file; the tests join movements.spec.ts)
```

**Edited:**

```
src/presentation/formatters/dateFormatters.ts    formatYearMonth
src/services/finance/domain/queries.ts           month in MovementListParams, listMovementMonths
src/services/finance/application/queries.ts      movements.list({ month }), movements.months()
src/routes/movements.tsx                         validateSearch
src/hooks/useMovements.ts                        month parameter and query key
src/components/Movements.tsx                     renders MonthSelector
src/components/TransactionsNew.tsx, TransactionsEdit.tsx
src/components/TransfersNew.tsx, TransfersEdit.tsx
src/components/AllocationsNew.tsx, AllocationsEdit.tsx
src/components/GenericList.tsx                   action search params        (slice 2)
src/tests/e2e/setup/pages.ts                     TEST_NOW clock pin
src/tests/e2e/pages/movements.page.ts            month selector locators
src/tests/e2e/movements.spec.ts                  same-month ordering dates + the new describe block
src/tests/e2e/settings.spec.ts                   todayInUTC → TEST_NOW
src/tests/e2e/transfers.spec.ts, allocations.spec.ts   "defaults to today" → TEST_NOW
src/routeTree.gen.ts                             regenerated
```

**Unchanged, deliberately:** `src/services/finance/infrastructure/` — the filter is a predicate over
an already-loaded array, exactly like `includeArchived`. Indexing `dateISO` in Dexie is a
performance change to make against a measurement, not while adding a feature.

## Out of scope

- **A date-range filter, a "whole year" or "all movements" view.** The ask is a month selector;
  `MovementListParams.month` is a month, and widening it to an arbitrary range is a different
  feature with a different UI.
- **Balances and jars.** They stay all-time. A month-scoped balance is Epic 9 (Statistics) material,
  not a side effect of a list filter.
- **Reading the month back from `/accounts`, `/jars` or exports.** Data management still exports
  everything.

## Documentation drift to report, not fix

Nothing to report from this pass: `CONTRIBUTING.md`'s folder list matches the tree (including
`movement-form/`), and `docs/tech-debt.md`'s open items are still open. Once slice 1 lands, the
Movements behaviour is not described anywhere in `docs/product/epics.md` — it is not one of the
listed epics. Worth an acceptance criterion there, but that is the user's edit to make.
