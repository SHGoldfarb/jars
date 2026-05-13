# Epics

## Epic 1 — Project Setup

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

## Epic 2 — Accounts

Create/edit/delete accounts.

### Acceptance Criteria

- [ ] User can create an account with a name
- [ ] User can edit an account's name
- [ ] User can delete an account
- [ ] All accounts are listed on the Accounts screen
- [ ] Each account displays its name
- [ ] Accounts persist across page refreshes

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

WIP

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

Export data (JSON or CSV), import/restore from backup. Clear all data.

### Acceptance Criteria

WIP

## Epic 10 — Statistics

View incomes/expenses breakdown, evolution, etc.

### Acceptance Criteria

WIP
