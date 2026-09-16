# Plan — One generic `Form` for `TransactionForm`, `MovementForm` and `GenericNameForm`

**Target:** `docs/tech-debt.md` — "Abstract transactions and movements forms into a single one",
widened to take `GenericNameForm` in as well.

**Shape of this plan:** vertical slices, in the style of `docs/product/epic-7-allocations-plan.md`.
Each slice migrates one caller-facing form onto the shared component and ends green
(`pnpm exec tsc -b`, `pnpm lint`, `pnpm format:check`, `pnpm test`), so the refactor can stop after
any slice and leave the app coherent. The order is deliberate: the form whose choreography already
has Playwright coverage is migrated _before_ the one that has none.

The goal is a component that receives a **field spec** — names, labels, validators, handlers — and
owns the rest, **including the focus flow**, which today is assembled by each caller out of
`defaultOpen`, `key` and `onChange` props.

---

## What is actually shared

All three forms are the same shell: a `max-w-md` wrapper, a `<form>` with
`preventDefault`/`stopPropagation` delegating to `form.handleSubmit()`, a
`FieldGroup`/`FieldSet`/`FieldLegend` header, the fields, a `FieldSeparator`, a form-level
`FieldError`, and a horizontal Submit / Cancel / Delete row.

`TransactionForm` and `MovementForm` go further and share their whole submit orchestration — zod
parse, `await onSubmit(...)`, catch, `formApi.setErrorMap({ onSubmit: { form: message } })` — plus a
verbatim-duplicated ten-line comment explaining the amount-focus timer.

The eleven per-field components differ only in which `FormType` they are typed against.
`MovementFormFieldDate`, `MovementFormFieldAmount` and `MovementFormFieldDescription` are character
-for-character copies of their `TransactionForm*` counterparts apart from that type, and
`MovementFormFieldEndpoint` already imports `TransactionFormFieldWrapper` and
`TransactionFormFieldSelect` across the seam.

---

## Decisions made up front

These are settled here so the slices stay mechanical. Every one of them was checked against
`pnpm exec tsc -b` on a throwaway prototype before this plan was written.

### 1. Focus flow is derived from field order

This is the heart of the change. The four behaviours the callers wire by hand today are all
consequences of **where a field sits in the list**. Define a field as **active** when it is empty
and its immediate predecessor is non-empty (a first field with no predecessor counts as having one).

| wired by hand today                                                                                                        | derived rule                                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `defaultOpen={!values.kind}`, `{!!(values.kind && !values.categoryId)}`, `{!!(values.categoryId && !values.accountId)}`, … | an **active select opens**; an **active text input takes focus**                                                  |
| ``key={`category - ${values.kind}`}``                                                                                      | a select **remounts on its predecessor's value, only when that predecessor is also a select**                     |
| `handleJarChange` / `handleDestinationChange` and their 100 ms timers                                                      | a select whose **next** field is a text input focuses it after 100 ms, unless something was typed there meanwhile |
| `onEnter={() => descriptionInputRef.current?.focus()}`                                                                     | **Enter in a text input** moves to the next text input; the last one submits                                      |

The rules reproduce today's behaviour exactly, including the cases that look like exceptions:

- `kind` and `originId` carry no `key` today because the field before them is the date, not a
  select — which is precisely what the remount rule says.
- Only `jarId` and `destinationId` trigger the amount timer today, because they are the only
  selects followed by a text input.
- In **edit** mode every value is pre-filled, so no field is active and nothing opens or steals
  focus — same as today.
- `GenericNameForm`'s `autoFocus` stops being a special case: its name field is first and empty on
  create, therefore active, therefore focused.

The mount case is served by `autoFocus` on the field that is active at first render; the
select-change case keeps the existing guarded 100 ms timer, **and keeps its comment**, because the
reason it reads emptiness off the DOM input rather than off `values` is not obvious:

> the `values` of this render are the ones from before the change and always show an empty amount;
> by the time the timer fires the amount may have been typed, and stealing focus then lands the next
> keystrokes in the wrong field.

### 2. Values are raw strings; zod is the boundary

`type FormValues = Record<string, string>` — every field in all three forms is a raw string typed
into an input, and the schema is what turns it into domain types. This requires
`TransactionFormValues` and `MovementFormValues` to become **`type` aliases instead of
`interface`s** (a type alias gets an implicit index signature, an interface does not). One keyword
per file, in `src/services/transaction-form/domain/formSchema.ts` and
`src/services/movement-form/domain/formSchema.ts`. Nothing else in either context changes, and
`kind: 'income' | 'expense' | ''` keeps its union.

### 3. Generic on the props, widened inside — with no casts

The obvious signature does not compile: with `form.Field name={spec.name}` for a generic
`TValues`, TypeScript cannot reduce `DeepValue<TValues, keyof TValues & string>` to `string`, and
`field.handleChange(...)` is rejected. Two plain widening **assignments** fix it — no `any`, no
`as`, no `!`:

```ts
// The form machinery only ever moves raw strings around, so it works on the unbranded shape
// while the props keep the caller's own value type.
const widenedDefaults: FormValues = defaultValues;
// Same widening at the form.Field boundary: the name is a plain key once it reaches the form.
const name: string = spec.name;
```

Callers keep everything that matters: field names are checked against their own values type,
`defaultValues` is typed, and `TParsed` flows into `onSubmit`.

### 4. `formUtils.validateWithSchema` gets a wider schema parameter

`z.ZodType.safeParse` and `.parse` take `unknown`, so a schema whose declared _input_ is `TValues`
can be handed the widened `FormValues` with no variance trouble — verified against the real
`transactionForm.createFormSchema(...)`, `superRefine` and `transform` included.

So the helper becomes `<TInput extends object>(value: TInput, schema: z.ZodType)`, still returning
`{ fields: Partial<Record<keyof TInput, string>> } | undefined`. The value-to-schema relationship is
not lost, it **moves to where it belongs**: the `Form` prop boundary, where `defaultValues: TValues`
and `schema: z.ZodType<TParsed, TValues>` pin it down once. This also retires the
`Parameters<typeof formUtils.validateWithSchema>[0]` workaround now standing in
`useTransactionFormValidate` and `useMovementForm`.

### 5. Three spec features carry the behaviour that used to live in field components

- **`options` may be a function of the current values.** This absorbs
  `MovementFormFieldEndpoint`'s `useStore` cross-filter (`options: (values) => endpoints.filter((e)
=> e.id !== values.destinationId)`) and `TransactionFormFieldCategory`'s kind-dependent list.
  Categories then fetch both kinds and pick between them — which costs nothing, because
  `useTransactionFormValidate` already fetches both today to build the schema.
- **`clears: ['categoryId']`** on the kind select replaces its `onChange` side effect. A cleared
  field becomes empty, so it re-enters the focus flow by rule 1 with no extra wiring.
- **`required`** on a text field keeps `GenericNameForm`'s native browser validation exactly as it
  is, rather than converting it to an inline `FieldError`.

### 6. Cancel is typed more strictly than it is today

`cancel: Pick<LinkProps, 'to' | 'search'>` covers both shapes in use —
`{ to: '/movements', search: { month } }` and ``{ to: `/categories/${category.kind}` }`` — and is a
**tightening**, since `GenericNameForm` currently takes `onCancelRoute: string` and loses route
checking entirely.

### 7. No new layer

Per `CONTRIBUTING.md`, nothing here earns a service or an application layer: this is UI collapsing
into UI. No bounded context is touched beyond the two `interface` → `type` keywords in decision 2.

---

## Files

**New**

| file                                  | holds                                                                                                                                                                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/lib/formSpec.ts`                 | `FormValues`, `FormFieldOption`, the `FormFieldSpec` discriminated union, and the pure focus-flow derivation (active field, remount key, next text field). Framework-agnostic and domain-free, so `src/lib/` is its home, beside `formUtils.ts`. |
| `src/components/Form.tsx`             | the shell: `useForm`, submit orchestration, focus flow, renders the fields and the actions                                                                                                                                                       |
| `src/components/FormField.tsx`        | one field — wrapper plus the control chosen by `spec.kind`                                                                                                                                                                                       |
| `src/components/FormFieldWrapper.tsx` | renamed from `TransactionFormFieldWrapper.tsx`, unchanged                                                                                                                                                                                        |
| `src/components/FormFieldSelect.tsx`  | renamed from `TransactionFormFieldSelect.tsx`, unchanged                                                                                                                                                                                         |
| `src/components/FormActions.tsx`      | the Submit / Cancel / Delete row                                                                                                                                                                                                                 |
| `src/hooks/useTransactionFormSpec.ts` | builds the transaction spec and schema from one set of queries                                                                                                                                                                                   |
| `src/hooks/useMovementFormSpec.ts`    | the same for a configured `MovementFormUi`                                                                                                                                                                                                       |

**Rewritten thin** — each keeps its name and props so **no caller changes at all**:
`TransactionForm.tsx`, `MovementForm.tsx`, `GenericNameForm.tsx`, roughly 40 lines each instead of
125 / 139 / 101.

**Deleted (16)** — `TransactionFormField{Amount,Date,Description,Kind,Account,Jar,Category}.tsx`,
`MovementFormField{Date,Amount,Description,Endpoint}.tsx`,
`TransactionFormField{Wrapper,Select}.tsx` (renamed above), and
`src/hooks/{useTransactionForm,useMovementForm,useTransactionFormValidate}.ts`.

**Untouched** — every caller (`TransactionsNew/Edit`, `TransfersNew/Edit`, `AllocationsNew/Edit`,
`JarsNew/Edit`, `AccountsNew/Edit`, `CategoriesIncomeNew`, `CategoriesExpenseNew`,
`CategoriesEdit`), every e2e page object, and every service but the two keywords.

---

## The shape

```tsx
<Form<TransactionFormValues, ParsedTransactionFormValues>
  title="Create Transaction"
  fields={fields} // ordered — drives rendering AND focus
  defaultValues={defaultValues}
  schema={schema}
  onSubmit={handleSubmit} // receives TParsed
  defaultErrorMessage="Error creating transaction"
  cancel={{ to: '/movements', search: { month } }}
  onDelete={onDelete}
  deleteDisabled={false}
/>
```

```ts
type FormValues = Record<string, string>;
type FormFieldOption = { value: string; label: string };
type FormFieldName<TValues extends FormValues> = keyof TValues & string;

type FormFieldSpec<TValues extends FormValues> =
  | { kind: 'date'; name: FormFieldName<TValues>; label: string }
  | {
      kind: 'text';
      name: FormFieldName<TValues>;
      label: string;
      placeholder?: string;
      inputMode?: 'decimal';
      required?: boolean;
    }
  | {
      kind: 'select';
      name: FormFieldName<TValues>;
      label: string;
      placeholder: string;
      options: FormFieldOption[] | ((values: TValues) => FormFieldOption[]);
      clears?: FormFieldName<TValues>[];
    };
```

---

# Slice 1 — `Form`, and `GenericNameForm` on top of it

The simplest consumer goes first: one text field, no selects, no schema today. It exercises the
shell, the actions row, `required`, `deleteDisabled` and the mount half of the focus flow, without
any of the choreography.

1. Add `src/lib/formSpec.ts` with the types and the focus derivation.
2. Move `TransactionFormFieldWrapper.tsx` → `FormFieldWrapper.tsx` and
   `TransactionFormFieldSelect.tsx` → `FormFieldSelect.tsx` (content unchanged; update the imports
   in the eleven field components that still exist, which slices 2 and 3 then delete).
3. Add `FormActions.tsx`, `FormField.tsx` and `Form.tsx`.
4. Rewrite `GenericNameForm` as a spec: one `{ kind: 'text', name: fieldName, label: 'Name',
placeholder, required: true }`, a `z.object({ [fieldName]: z.string() })` schema that only shapes
   the value (`required` still does the work), `cancel={{ to: onCancelRoute }}`, and
   `deleteDisabled` forwarded.

**Behaviour change to accept:** on the **edit** screens the name input no longer takes focus,
because rule 1 focuses the first _empty_ field and the name is pre-filled. Create screens are
unchanged. No test asserts this — the page objects only `.fill()` — and it is the direct consequence
of handing focus to the form.

**Green when:** `jars.spec.ts`, `accounts.spec.ts` and `categories.spec.ts` pass untouched.

# Slice 2 — `MovementForm`

Second, because `transfers.spec.ts:254` and `allocations.spec.ts:228`
(_"focus flows from one field to the next as a new …"_) already assert the full choreography —
selector opens on mount, picking the origin opens the destination, picking the destination focuses
the amount, Enter moves to the description. They are the acceptance test for the derived rules, and
they must pass **unchanged**.

1. `MovementFormValues`: `interface` → `type`.
2. Add `useMovementFormSpec.ts`, folding in `useMovementFormEndpoints` and `useMovementForm`: date,
   origin select, destination select, amount, description — with the cross-filter as
   `options: (values) => …` on both endpoint selects.
3. Rewrite `MovementForm` to call it and render `<Form>`; `movementForm.toDraft(parsed)` stays in
   its `onSubmit`.
4. Delete the four `MovementFormField*.tsx` files and `useMovementForm.ts`.

**Green when:** `transfers.spec.ts` and `allocations.spec.ts` pass with no edit to either file.

# Slice 3 — `TransactionForm`

Last, because it is the only one of the three with **no focus e2e coverage**, and by now the rules
have been proven by slice 2.

1. `TransactionFormValues`: `interface` → `type`.
2. Add `useTransactionFormSpec.ts`, absorbing `useTransactionFormValidate` — it already fetches
   accounts, jars and both category lists, which is exactly what the options need. Fields: date,
   kind select with `clears: ['categoryId']`, category select with
   `options: (values) => values.kind === 'income' ? incomeOptions : expenseOptions`, account select,
   jar select, amount, description.
3. Rewrite `TransactionForm`; the `dateISO` / `description.trim()` mapping to `TransactionUnsaved`
   stays in its `onSubmit`.
4. Delete the seven `TransactionFormField*.tsx` files, `useTransactionForm.ts` and
   `useTransactionFormValidate.ts`.
5. **Add the missing test** to `transactions.spec.ts`, mirroring `transfers.spec.ts:254`: the type
   selector opens on mount, each choice opens the next selector, picking the jar focuses the amount,
   Enter moves to the description. This is a new test, so it may declare `test.slow()` if the four
   entities it has to create warrant it — a judgement about what it does, never a reaction to a
   timeout.

**Green when:** `transactions.spec.ts` and `movements.spec.ts` pass, plus the new test.

# Slice 4 — Close out

`pnpm exec tsc -b`, `pnpm lint`, `pnpm format:check` and the full `pnpm test`. Per `AGENTS.md`, a
Playwright timeout is re-run on its own with `pnpm exec playwright test -g '<title>'` before being
treated as a regression.

`docs/tech-debt.md` then carries a line this work has finished:

> - Abstract transactions and movements forms into a single one.

Removing it is a documentation edit, so it is **suggested here and left to a human**, per the
"Suggest Documentation Fixes, Never Apply Them" rule.

---

## Risks

- **TanStack Form's deep generics.** The one real obstacle, resolved by decision 3 and confirmed
  against `tsc -b` before this plan was written, on the real `transactionForm.createFormSchema`,
  the real `movementForm.transfers.createFormSchema`, and a dynamic `LinkProps['to']`.
- **The whole form re-renders on every keystroke**, because `Form` subscribes to all values through
  `useStore` to compute active fields and dynamic options. This is already true of both
  `TransactionForm` and `MovementForm` today, so it is not a regression — and per `CONTRIBUTING.md`
  it does not get a prophylactic `useMemo`.
- **A fourth form with a shape these rules do not fit** — a checkbox, a field that depends on two
  predecessors, a wizard step. The union is open to extension; the risk is someone bending the
  focus derivation instead of adding a case to it.
