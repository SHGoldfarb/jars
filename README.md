# Jars

Personal finance manager that allows you to track your goals and budgets.

Your cash sits in real accounts — your wallet, your bank, your savings account — but it simultaneously belongs to a purpose: monthly expenses, a holiday fund, an emergency cushion. Jars tracks both dimensions in parallel, so you always know not just _how much you have_, but _what it's for_.

### What Jars does

#### Key features

- **Accounts** — Define your real-world money containers (bank accounts, cash, etc.) and log transactions manually.
- **Jars** — Create budget envelopes or savings goals, then pour money into them. A jar labeled "Holidays" or "Monthly Expenses" holds a portion of your real account balances — no transfers needed. When you receive money, you decide which jar it goes into.
- **Categories** — Tag every transaction with a category (groceries, rent, salary, freelance, etc.) to see where your money is actually coming from and going. Categories can have subcategories (Groceries → Fruit) for finer detail.
- **Bookmarks** — Save a movement you repeat (rent, a salary allocation, a monthly transfer) as a bookmark, then start new movements from it with every field pre-filled except the date.
- **Stats** - of your income and expenses.
- **Google Drive backup** — Connect once; when a backup is due, Settings asks you to reconnect, and one click saves a copy of your data to a `jars` folder in your Drive.

#### Other functionality

- **Offline support**

### Development

- **Key technologies**: react, typescript, vite-pwa, Dexie, Tailwind CSS, shadcn, zod, tanstack router, tanstack form, tanstack query.
- **Key development technologies**: eslint, prettier, playwright.
- **Modeling**:
  - Entities:
    - `accounts`.
    - `jars`.
    - `transfers`: between `accounts`.
    - `allocations`: transfer between `jars`.
    - `category`: kind `income` or `expense`.
    - `subcategory`: belongs to exactly one `category` and inherits its kind.
    - `transactions`: kind `income` or `expense`.
    - `bookmarks`: a saved copy of a transaction, transfer or allocation, without its date.
  - Modeling:
    - `transactions` have 1 `account`, 1 `category`, optionally 1 `subcategory` of that category, and 1 `jar`.
