# Jars

Personal finance manager that allows you to track your goals and budgets.

Your cash sits in real accounts — your wallet, your bank, your savings account — but it simultaneously belongs to a purpose: monthly expenses, a holiday fund, an emergency cushion. Jars tracks both dimensions in parallel, so you always know not just _how much you have_, but _what it's for_.

### What Jars does

#### Key features

- **Accounts** — Define your real-world money containers (bank accounts, cash, etc.) and log transactions manually.
- **Jars** — Create budget envelopes or savings goals, then pour money into them. A jar labeled "Holidays" or "Monthly Expenses" holds a portion of your real account balances — no transfers needed. When you receive money, you decide which jar it goes into.
- **Categories** — Tag every transaction with a category (groceries, rent, salary, freelance, etc.) to see where your money is actually coming from and going.

#### Other functionality

- **Offline support**

### Development

- **Key technologies**: react, typescript, vite-pwa, Dexie, Tailwind CSS, shadcn.
- **Key devexp technologies**: eslint, prettier. Developed with vscode.
- **Modeling**:
  - Entities:
    - `accounts`.
    - `jars`.
    - `transactions`: kind `income` or `expense`.
    - `transfers`: between `accounts`.
    - `allocations`: transfer between `jars`.
    - `category`: kind `income` or `expense`.
