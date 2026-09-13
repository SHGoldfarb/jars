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

## Epic 6 — Transfers [DONE]

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

## Epic 7 — Allocations [DONE]

Move money between jars.

### Acceptance criteria

**Allocation entry**

- [x] User can create an allocation specifying: origin jar, destination jar, amount, date, and description
- [x] App validates amount is a non-negative number
- [x] Date defaults to today but can be changed
- [x] Origin and destination jars must be different
- [x] Only active jars are available for selection when creating or editing an allocation
- [x] User can edit any field of an existing allocation
- [x] User can delete an allocation

**Listing**

- [x] All allocations are listed on the Movements screen, interleaved with transactions, transfers, and sorted by date descending
- [x] Each allocation displays: amount, date, description, origin jar, and destination jar
- [x] Allocations are visually distinguishable from transactions and transfers on the Movements screen

**Validation**

- [x] Origin jar, destination jar, amount, and date are required fields
- [x] Description is optional
- [x] Origin and destination jars cannot be the same
- [x] Amount must be a non-negative number

**Persistence**

- [x] Allocations persist across page refreshes

**Jar integrity**

- [x] Allocations are included in the jars balance calculation.
- [x] Allocation form selectors include archived jars when editing an allocation that references them (same pattern as transactions)

## Epic 8 — Data Management [DONE]

Create backup, restore from backup (JSON). Export data (CSV). Import from Money Manager. Clear all data.

### Acceptance criteria

**Settings screen**

- [x] A `Settings` entry is available in the main navigation, alongside Movements, Accounts, Jars and Categories
- [x] The Settings screen offers all five actions directly, with no subpages: `Create backup`, `Load from backup`, `Export to CSV`, `Import from Money Manager Excel` and `Clear all data`
- [x] Each action states what it does before the user commits to it, and the three destructive actions (`Load from backup`, `Import from Money Manager Excel`, `Clear all data`) warn that current data is permanently lost

**Create backup (JSON)**

- [x] `Create backup` downloads a JSON file containing the full database state: accounts, jars, categories, transactions, transfers and allocations
- [x] The backup preserves every persisted field of every record, including internal ids, archived markers and amounts, so a restore reproduces the database exactly
- [x] The backup carries the schema version it was taken from, so a restore can tell whether it understands the file
- [x] The downloaded file has a recognizable name that includes the date it was taken
- [x] Creating a backup does not modify any data

**Load from backup (JSON)**

- [x] `Load from backup` lets the user pick a JSON file previously produced by `Create backup`
- [x] The user must confirm before the restore runs, and the confirmation states that all current data is replaced and cannot be recovered
- [x] The file is validated against the domain schemas before anything is written; a file that is not valid JSON, is missing entities, has records that fail validation, or carries an unsupported schema version is rejected with an explanatory error
- [x] A rejected file leaves the existing data untouched
- [x] A valid file replaces the entire database: every record from the backup is present afterwards and no record that was there before the restore survives
- [x] The restore is atomic — a failure part way through leaves the database in its pre-restore state, not a partial mix
- [x] After a successful restore the app reflects the restored data without a manual page refresh
- [x] Restored data persists across page refreshes
- [x] A backup created from the app and then restored into it produces the same balances, movements and listings as before

**Export to CSV**

- [x] `Export to CSV` downloads a CSV file containing the movements only, with no internal ids
- [x] Every movement is exported — transactions, transfers and allocations — with its kind, amount, date, description, and the accounts, jars and categories it references named rather than referenced by id
- [x] Accounts, jars and categories have no rows of their own in the export: they are inferred from the movements that name them
- [x] An account, jar or category that no movement references therefore does not appear in the export, archived ones included
- [x] Amounts are written as plain decimal numbers alongside a currency column, and dates as `YYYY-MM-DD HH:mm`, so the file is unambiguous in a spreadsheet whatever the reader's locale; no internal representation (ISO timestamps, decimal objects, ids) appears in the file
- [x] Values containing separators, quotes or newlines are escaped so the file opens correctly in a spreadsheet
- [x] The downloaded file has a recognizable name that includes the export date
- [x] Exporting does not modify any data
- [x] The CSV export is one-way: it is not accepted by `Load from backup`

**Import from Money Manager Excel**

- [x] `Import from Money Manager Excel` lets the user pick an `.xlsx` file exported by the Money Manager app
- [x] The user must confirm before the import runs, and the confirmation states that all current data is replaced and cannot be recovered
- [x] The file is validated before anything is written: a file that is not a readable `.xlsx` workbook, does not carry the columns a Money Manager export has, or contains rows that cannot be mapped is rejected with an explanatory error naming what failed
- [x] A rejected file leaves the existing data untouched
- [x] A valid file replaces the entire database, and the import is atomic — a failure part way through leaves the pre-import state
- [x] Money Manager accounts become jars, and each jar is created once regardless of how many rows mention the account
- [x] Money Manager has no accounts in the Jars sense, so the import creates a single default account named `Cash` and assigns every imported movement to it
- [x] Money Manager categories become categories with the kind (`income` or `expense`) implied by the rows that use them, and each category is created once
- [x] Money Manager income and expense rows become transactions with their amount, date, description, kind and category, the jar mapped from their Money Manager account, and the default `Cash` account
- [x] Money Manager transfer rows become allocations with their amount, date and description, with origin and destination jars mapped from their origin and destination Money Manager accounts
- [x] No transfers are created by the import, since every movement lives in the single default account
- [x] Imported amounts and dates match the values in the source file
- [x] After a successful import the app reflects the imported data without a manual page refresh, and it persists across page refreshes
- [x] The default `Cash` account and the imported jars show balances consistent with the imported movements

**Clear all data**

- [x] `Clear all data` states what it removes before the user commits to it: accounts, jars, categories, transactions, transfers and allocations
- [x] The user must confirm before the clear runs, and the confirmation states that all current data is permanently lost and cannot be recovered
- [x] Cancelling the confirmation leaves all data untouched
- [x] Confirming empties the database: no accounts, jars, categories, transactions, transfers or allocations remain afterwards
- [x] The clear is atomic — a failure part way through leaves the database in its pre-clear state, not a partial mix
- [x] After a successful clear the app reflects the empty database without a manual page refresh
- [x] The database stays empty across page refreshes

## Epic 9 — Statistics

View incomes/expenses breakdown, evolution, etc.

### Acceptance criteria

WIP

## Small features backlog

- [ ] Better UI on month selector: arrows currently change position depending of the length of the month name, makes it difficult to move multiple times.

## Epics Backlog

- Configure automatic backup to cloud (Google Drive?)
- Desktop support
- Sync support (open in desktop browser and keep synced with phone)
- switch between dark/light modes
- multi currency
- localization (language, money amount format)
- Bookmarks (favorites - auto populate)
- Auto recurring transactions
