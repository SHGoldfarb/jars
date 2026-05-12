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
- [ ] Client-side routing is configured with placeholder routes for: Movements, Accounts, Jars, Categories
- [ ] Global state management is set up and can reflect changes from the DAL across components
- [ ] No data is lost on page refresh
- [ ] App builds for production without errors or type errors

## Epic 2 — Accounts

Create/edit/delete accounts. Manual transaction entry (amount, date, description, type income/expense, category, jar). Account balance calculation from transactions.

## Epic 3 — Jars

Create/edit/delete jars with a target amount (optional). Allocate/deallocate money from a jar. Jar balance derived from allocations, not from moving money between accounts. Visual progress toward goal.

## Epic 4 — Categories

Create/edit/delete custom categories, scoped to income or expense. Assign a category when logging a transaction.

## Epic 5 — Dashboard

Total balance across all accounts, jar summaries, recent transactions, spending breakdown by category (chart), income vs expense overview for a selected period.

## Epic 6 — Data Management

Export data (JSON or CSV), import/restore from backup, clear all data. Since there's no backend, this is the user's only safety net.
