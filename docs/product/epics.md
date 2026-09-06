# Epics

## Epic 1 — Project Setup [DONE]

React + TypeScript scaffold, IndexedDB schema design (accounts, transactions, jars, categories), offline PWA config, routing, and global state management.

### Acceptance criteria

- [x] React + TypeScript project is scaffolded and runs locally without errors
- [x] IndexedDB is initialized on first load with object stores for all entities
- [x] All object stores have defined schemas with typed fields and indexes.
- [x] A data access layer (DAL) abstracts all IndexedDB reads and writes behind async functions — no raw IndexedDB calls outside of it
- [x] App is registered as a PWA with a service worker that enables full offline functionality
- [x] App can be installed on mobile
- [x] Client-side routing is configured with placeholder routes for: Movements, Accounts, Jars, Categories
- [x] Global state management is set up and can reflect changes from the DAL across components
- [x] No data is lost on page refresh
- [x] App builds for production without errors or type errors

## Epic 2 — Accounts [DONE]

Create/edit/delete accounts.

### Original acceptance criteria

- [x] User can create an account with a name
- [x] User can edit an account's name
- [x] User can delete an account
- [x] All accounts are listed on the Accounts screen
- [x] Each account displays its name
- [x] Accounts persist across page refreshes

### Unplanned work

- [x] Refactor to use tanstack form

## Epic 3 — Jars [DONE]

Create/edit/delete jars.

### Acceptance criteria

- [x] User can create a jar with a name
- [x] User can edit a jar's name
- [x] User can delete a jar
- [x] All jars are listed on the Jars screen
- [x] Each jar displays its name
- [x] Jars persist across page refreshes

## Epic 4 — Categories [DONE]

Create/edit/delete categories, scoped to income or expense.

### Acceptance criteria

- [x] User can create a category with a name and a kind (`income` or `expense`)
- [x] User can edit a category's name
- [x] User can delete a category
- [x] All categories are listed on the Categories screen
- [x] Income and expense categories are visually grouped and labeled
- [x] Each category displays its name
- [x] Categories persist across page refreshes

### Unplanned work

- [x] Refactor delete -> archive
- [x] Add tests framework
- [x] Add accounts tests
- [x] Add jars tests
- [x] Add categories tests

## Epic 5 — Transactions [DONE]

Manual transaction entry (amount, date, description, type income/expense, category, jar).

### Acceptance criteria

**Transaction entry**

- [x] User can create a transaction with: amount, date, description, type (`income` or `expense`), category, account, and jar.
- [x] App validates amount is a positive number.
- [x] Date defaults to today but can be changed.
- [x] Category picker is filtered by transaction type (only income categories for income, only expense categories for expense).
- [x] Only active accounts, jars and categories are available for selection when creating or editing a transaction.
- [x] User can edit any field of an existing transaction.
- [x] User can delete a transaction.

**Listing**

- [x] All transactions are listed on the Movements screen.
- [x] Each transaction displays: amount, date, description, type, category, account, and jar.
- [x] Transactions are sorted by date descending by default.

**Validation**

- [x] Amount, date, type, account, jar, and category are required fields.
- [x] Description is optional.

**Persistence**

- [x] Transactions persist across page refreshes.

**Account/jar integrity**

- [x] Accounts and jars show current balance
- [x] User cannot delete an account that has a non-zero balance
- [x] User cannot delete a jar that has a non-zero balance
- [x] If a deleted account acquires a non-zero balance (e.g. via transaction edit), it is automatically restored
- [x] If a deleted jar acquires a non-zero balance (e.g. via transaction edit), it is automatically restored

### Unplanned work

- [x] Add DAL level cache and useQuery
- [x] Refactor to follow Domain Driven Design more closely
- [x] Auto open select fields and auto move to the next one
- [x] Move date field to the start of the form, "enter" key on amount field moves focus to description.
- [x] Transaction form selectors include current entity, even if it is deleted (account, jar, category)

## Epic 6 — Transfers [IN PROGRESS]

Move money between accounts.

### Acceptance criteria

**Transfer entry**

- [x] User can create a transfer specifying: origin account, destination account, amount, date, and description
- [x] App validates amount is a non-negative number
- [x] Date defaults to today but can be changed
- [x] Origin and destination accounts must be different
- [x] Only active accounts are available for selection when creating or editing a transfer
- [x] User can edit any field of an existing transfer
- [x] User can delete a transfer

**Listing**

- [x] All transfers are listed on the Movements screen, interleaved with transactions and sorted by date descending
- [x] Each transfer displays: amount, date, description, origin account, and destination account
- [x] Transfers are visually distinguishable from transactions on the Movements screen

**Validation**

- [x] Origin account, destination account, amount, and date are required fields
- [x] Description is optional
- [x] Origin and destination accounts cannot be the same
- [x] Amount must be a non-negative number

**Account integrity**

- [x] Transfers are included in the accounts balance calculation.
- [x] Transfer form selectors include archived accounts when editing a transfer that references them (same pattern as transactions)

## Epic 7 — Allocations

Move money between jars.

### Acceptance criteria

**Allocation entry**

- [x] User can create an allocation specifying: origin jar, destination jar, amount, date, and description
- [x] App validates amount is a non-negative number
- [x] Date defaults to today but can be changed
- [x] Origin and destination jars must be different
- [ ] Only active jars are available for selection when creating or editing an allocation
- [ ] User can edit any field of an existing allocation
- [ ] User can delete an allocation

**Listing**

- [x] All allocations are listed on the Movements screen, interleaved with transactions, transfers, and sorted by date descending
- [x] Each allocation displays: amount, date, description, origin jar, and destination jar
- [ ] Allocations are visually distinguishable from transactions and transfers on the Movements screen

**Validation**

- [x] Origin jar, destination jar, amount, and date are required fields
- [x] Description is optional
- [x] Origin and destination jars cannot be the same
- [x] Amount must be a non-negative number

**Persistence**

- [x] Allocations persist across page refreshes

**Jar integrity**

- [ ] Allocations are included in the jars balance calculation.
- [ ] Allocation form selectors include archived jars when editing an allocation that references them (same pattern as transactions)

## Epic 8 — Data Management

Create backup, restore from backup (JSON). Export data (CSV). Configure automatic backup to cloud (Google Drive?). Clear all data.

### Acceptance criteria

WIP

## Epic 9 — Statistics

View incomes/expenses breakdown, evolution, etc.

### Acceptance criteria

WIP

## Backlog

- Desktop support
- Sync support (open in desktop browser and keep synced with phone)
- switch between dark/light modes
- multi currency
- localization (language, money amount format)
- Bookmarks (favorites - auto populate)
- Auto recurring transactions
