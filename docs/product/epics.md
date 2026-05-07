# Jars — Offline PWA Expense Tracker

## Product constraints (MVP)

- **Single device only**: no accounts/logins.
- **Offline-first**: the app works fully without network access.
- **Backup required**: users can export/restore all local data.

## Core money model

- **Accounts**: where money is actually held (wallet, checking, savings). Account balance is the sum of account's transactions.
- **Jars**: a labeled allocation of your total net worth. A jar’s “balance” is the sum of allocations assigned to it.

## Epics

### Epic 1: Offline-first foundation (single-device)

- **Local-only datastore**: IndexedDB schema + migrations for transactions, accounts, jars, allocation events, imports, settings.
- **PWA + offline**: service worker caching strategy, installability, offline/online UX states.
- **Core calculations**: account balances, total net worth, jar balances, unallocated amount.

### Epic 2: Accounts & transfers (where money lives)

- **Account management**: create/edit/archive, opening balances.
- **Account ledger**: income/expense applied to an account; running balance view.
- **Account ↔ account transfers**: linked transfer entries; preserves net worth.

### Epic 3: Transactions (income/expense) + categorization

- **Manual entry**: income/expense with date, amount, payee, notes, category, account.
- **Category system**: manage categories; “uncategorized” queue; bulk recategorize.
- **Search & filters**: payee/category/account/date/amount.

### Epic 4: Jars (allocation overlay)

- **Jar setup**: name, targets (amount/date), priority, visibility.
- **Allocation workflow**: after any income/expense/import, assign deltas to jars; support partial splits.
- **Reallocation (jar ↔ jar)**: move allocation between jars (no account movement).
- **Integrity UX**: show “Unallocated” and prevent/flag over-allocation (configurable strictness).

### Epic 5: Import from spreadsheet (CSV/XLSX)

- **Import pipeline**: CSV/XLSX parsing, column mapping, normalization.
- **Review stage**: match to accounts/categories, detect duplicates, batch edit.
- **Allocation step**: allocate imported net changes to jars (with sensible defaults).
- **Audit & rollback**: import batches with undo.

### Epic 6: Statistics & insights

- **Spending analytics**: by category/time, cashflow, trends.
- **Account analytics**: balances over time, transfer volume.
- **Jar analytics**: progress to targets, allocation over time, “where my money is assigned.”

### Epic 7: Backup & restore (no logins)

- **One-click export**: app backup file containing full local data + metadata (optionally encrypted).
- **Restore flow**: import backup, validate schema version, migrate if needed.
- **Portability**: CSV export of transactions and a human-readable summary.

### Epic 8: Quality, accessibility, and performance

- **Speed**: instant offline startup, large-ledger performance.
- **Accessibility**: keyboard-first entry, screen reader support.
- **Tests**: calculation invariants (net worth vs allocations), import parsing, transfer linkage.

