# Epics

## Epic 1 — Project Setup [DONE]

React + TypeScript scaffold, IndexedDB schema design (accounts, transactions, jars, categories), offline PWA config, routing, and global state management.

### Acceptance Criteria

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

## Epic 2 — Accounts [IN PROGRESS]

Create/edit/delete accounts.

### Acceptance Criteria

- [x] User can create an account with a name
- [ ] User can edit an account's name
- [x] User can delete an account
- [x] All accounts are listed on the Accounts screen
- [x] Each account displays its name
- [x] Accounts persist across page refreshes

## Epic 3 — Jars

Create/edit/delete jars.

### Acceptance Criteria

WIP

## Epic 4 — Categories

Create/edit/delete categories, scoped to income or expense.

### Acceptance Criteria

WIP

## Epic 5 — Transactions

Manual transaction entry (amount, date, description, type income/expense, category, jar).

### Acceptance Criteria

- [ ] ...
- [ ] Can't delete accounts when they have balance.
- [ ] Can't delete jars when they have balance.
- [ ] If a deleted account acquires balance (e.g. by editing transaction) it is magically restored.
- [ ] If a deleted jar acquires balance (e.g. by editing transaction) it is magically restored.

## Epic 6 — Transfers

Move money between accounts.

### Acceptance Criteria

WIP

## Epic 7 — Allocations

Move money between jars.

### Acceptance Criteria

WIP

## Epic 8 — Balances

Account balance is shown, derived from transactions and transfers. Jar balance is shown, derived from transactions and allocations.

### Acceptance Criteria

WIP

## Epic 9 — Data Management

Create backup, restore from backup (JSON). Export data (CSV). Configure automatic backup to cloud (Google Drive?). Clear all data.

### Acceptance Criteria

WIP

## Epic 10 — Statistics

View incomes/expenses breakdown, evolution, etc.

### Acceptance Criteria

WIP

## Backlog

- Desktop support
- Sync support (open in desktop browser and keep synced with phone)
- switch between dark/light modes
- multi currency
- localization (language, money amount format)
