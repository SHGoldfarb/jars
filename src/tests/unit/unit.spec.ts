import { test, expect } from '@playwright/test';
import { createCacheForFunction } from 'src/lib/utils';
import type { XlsxCell } from 'src/lib/xlsx';
import { dataManagement } from 'src/services/data-management';

test('unit tests', async () => {
  await test.step('createCacheForFunction', async () => {
    await test.step('returns the result of the function', () => {
      const fn = (a: number, b: number) => a + b;
      const cached = createCacheForFunction(fn);

      const result = cached({ key: 'key1', params: [1, 2] });
      expect(result).toBe(3);
    });

    await test.step('caches the result and does not call the function again', () => {
      let callCount = 0;
      const fn = (a: number) => {
        callCount++;
        return a * 2;
      };
      const cached = createCacheForFunction(fn);

      cached({ key: 'key1', params: [5] });
      cached({ key: 'key1', params: [5] });
      cached({ key: 'key1', params: [5] });

      expect(callCount).toBe(1);
    });

    await test.step('different keys produce different results', () => {
      const fn = (a: number) => a * 10;
      const cached = createCacheForFunction(fn);

      expect(cached({ key: 'a', params: [1] })).toBe(10);
      expect(cached({ key: 'b', params: [2] })).toBe(20);
    });

    await test.step('without maxSize the cache grows without limit', () => {
      // All entries should still be cached
      let callCount = 0;
      const countingFn = (a: number) => {
        callCount++;
        return a;
      };
      const cached2 = createCacheForFunction(countingFn, { maxSize: null });

      for (let i = 0; i < 500; i++) {
        cached2({ key: String(i), params: [i] });
      }
      // First 500 insertions
      for (let i = 0; i < 500; i++) {
        cached2({ key: String(i), params: [i] });
      }
      // All 500 should be cache hits
      expect(callCount).toBe(500);
    });

    await test.step('with maxSize the cache does not exceed the limit', () => {
      let callCount = 0;
      const countingFn = (a: number) => {
        callCount++;
        return a;
      };
      const cachedCounting = createCacheForFunction(countingFn, { maxSize: 2 });

      cachedCounting({ key: 'x', params: [1] });
      cachedCounting({ key: 'y', params: [2] });
      // Cache: [x, y]
      cachedCounting({ key: 'z', params: [3] });
      // Should evict 'x', cache: [y, z]

      expect(callCount).toBe(3);

      cachedCounting({ key: 'x', params: [1] });
      // 'x' was evicted, should re-compute
      expect(callCount).toBe(4);
    });

    await test.step('cache hit updates LRU order so the entry is not evicted', () => {
      let callCount = 0;
      const countingFn = (a: number) => {
        callCount++;
        return a;
      };
      const cachedCounting = createCacheForFunction(countingFn, { maxSize: 3 });

      cachedCounting({ key: 'a', params: [1] });
      cachedCounting({ key: 'b', params: [2] });
      cachedCounting({ key: 'c', params: [3] });
      // Cache: [a, b, c]

      // Re-access 'a'
      cachedCounting({ key: 'a', params: [1] });
      // Cache order: [b, c, a]

      // Insert 'd' -> evicts 'b'. Cache: [c, a, d]
      cachedCounting({ key: 'd', params: [4] });
      // Insert 'e' -> evicts 'c'. Cache: [a, d, e]
      cachedCounting({ key: 'e', params: [5] });

      // callCount == 5 for 5 unique inserts (a, b, c, d, e)
      expect(callCount).toBe(5);

      // 'b' and 'c' should have been evicted
      cachedCounting({ key: 'b', params: [2] });
      expect(callCount).toBe(6);
      cachedCounting({ key: 'c', params: [3] });
      expect(callCount).toBe(7);
    });

    await test.step('maxSize of 1 evicts on every new insert', () => {
      let callCount = 0;
      const fn = (a: number) => {
        callCount++;
        return a;
      };
      const cached = createCacheForFunction(fn, { maxSize: 1 });

      cached({ key: 'a', params: [1] });
      expect(callCount).toBe(1);

      cached({ key: 'b', params: [2] });
      expect(callCount).toBe(2);
      // 'a' was evicted

      cached({ key: 'a', params: [1] });
      expect(callCount).toBe(3);
      // 'b' was evicted, 'a' re-computed
    });

    await test.step('maxSize of 0 never caches', () => {
      let callCount = 0;
      const fn = (a: number) => {
        callCount++;
        return a;
      };
      const cached = createCacheForFunction(fn, { maxSize: 0 });

      cached({ key: 'a', params: [1] });
      cached({ key: 'a', params: [1] });
      cached({ key: 'a', params: [1] });
      expect(callCount).toBe(3);
    });
  });
});

// The Money Manager mapping is exercised over rows rather than over workbooks: every rejection
// case would otherwise need its own binary fixture, and six hand-authored `.xlsx` files assert
// nothing that six literal rows do not. The real file is proven end to end in
// `moneyManagerImport.spec.ts`; the per-row rules are proven here.
test('Money Manager rows to a finance snapshot', async () => {
  const HEADER: XlsxCell[] = [
    'Date',
    'Account',
    'Category',
    'Note',
    'Amount',
    'Income/Expense',
    'Transfer account',
  ];

  const snapshotOf = (...rows: XlsxCell[][]) => {
    const result = dataManagement.moneyManager.toFinanceSnapshot([HEADER, ...rows]);
    if (!result.ok) {
      throw new Error(`Expected the rows to map, got: ${result.error}`);
    }
    return result.value;
  };

  const rejectionOf = (rows: XlsxCell[][]) => {
    const result = dataManagement.moneyManager.toFinanceSnapshot(rows);
    return result.ok ? null : result.error;
  };

  await test.step('a repeated account or category is created once', () => {
    const snapshot = snapshotOf(
      ['2026-02-10 09:00', 'Wallet', 'Groceries', 'Weekly shop', 2500, 'Expense', null],
      ['2026-02-11 10:30', 'Wallet', 'Groceries', 'Snacks', 500, 'Expense', null]
    );

    expect(snapshot.jars.map(({ name }) => name)).toEqual(['Wallet']);
    expect(snapshot.categories.map(({ name }) => name)).toEqual(['Groceries']);
    expect(snapshot.accounts.map(({ name }) => name)).toEqual(['Cash']);
    expect(snapshot.transactions).toHaveLength(2);
  });

  await test.step('a category name used by both kinds yields one category per kind', () => {
    const snapshot = snapshotOf(
      ['2026-02-10 09:00', 'Wallet', 'Gifts', 'Received', 1000, 'Income', null],
      ['2026-02-11 10:30', 'Wallet', 'Gifts', 'Given', 800, 'Expense', null]
    );

    expect(snapshot.categories.map(({ name, kind }) => `${name} (${kind})`)).toEqual([
      'Gifts (income)',
      'Gifts (expense)',
    ]);
    // Each transaction points at the category of its own kind.
    const [income, expense] = snapshot.transactions;
    expect(income.categoryId).not.toBe(expense.categoryId);
  });

  await test.step('a date cell and a text date reach the same stored value', () => {
    const snapshot = snapshotOf(
      [
        new Date(Date.UTC(2026, 1, 10, 9, 0)),
        'Wallet',
        'Groceries',
        'From a date cell',
        1,
        'Expense',
        null,
      ],
      ['2026-02-10 09:00', 'Wallet', 'Groceries', 'From text', 1, 'Expense', null],
      ['2026-02-10', 'Wallet', 'Groceries', 'From a date without a time', 1, 'Expense', null]
    );

    const [fromCell, fromText, dateOnly] = snapshot.transactions;
    expect(fromCell.dateISO).toBe('2026-02-10T09:00:00.000Z');
    expect(fromText.dateISO).toBe('2026-02-10T09:00:00.000Z');
    expect(dateOnly.dateISO).toBe('2026-02-10T00:00:00.000Z');
  });

  await test.step('a date serial that lands just short of the minute is stored as that minute', () => {
    // A spreadsheet date is a floating point serial, so a cell showing 11:45 really does arrive
    // as 11:44:59.999 - this is the value the sample fixture round-trips to.
    const snapshot = snapshotOf([
      new Date(Date.UTC(2026, 1, 12, 11, 44, 59, 999)),
      'Wallet',
      'Groceries',
      'Just short of the minute',
      1,
      'Expense',
      null,
    ]);

    expect(snapshot.transactions[0].dateISO).toBe('2026-02-12T11:45:00.000Z');
  });

  await test.step('amounts are read from number and text cells, without their sign', () => {
    const snapshot = snapshotOf(
      ['2026-02-10 09:00', 'Wallet', 'Groceries', 'A number cell', 10000, 'Expense', null],
      [
        '2026-02-10 09:00',
        'Wallet',
        'Groceries',
        'A grouped text cell',
        '2,500.5',
        'Expense',
        null,
      ],
      ['2026-02-10 09:00', 'Wallet', 'Groceries', 'A negative number cell', -750, 'Expense', null],
      [
        '2026-02-10 09:00',
        'Wallet',
        'Groceries',
        'A signed text cell',
        '-1,234.00',
        'Expense',
        null,
      ]
    );

    // Hardcoded: the direction lives in the movement's kind, so the stored amount never carries
    // a sign, and the decimals the cell holds are the decimals that are stored.
    expect(snapshot.transactions.map(({ amount }) => amount)).toEqual([
      { currency: 'CLP', amountDecimal: { value: '10000', decimalPlaces: 0 } },
      { currency: 'CLP', amountDecimal: { value: '25005', decimalPlaces: 1 } },
      { currency: 'CLP', amountDecimal: { value: '750', decimalPlaces: 0 } },
      { currency: 'CLP', amountDecimal: { value: '123400', decimalPlaces: 2 } },
    ]);
  });

  await test.step('a missing column is named', () => {
    const withoutKind: XlsxCell[] = [
      'Date',
      'Account',
      'Category',
      'Note',
      'Amount',
      'Transfer account',
    ];

    expect(
      rejectionOf([
        withoutKind,
        ['2026-02-10 09:00', 'Wallet', 'Groceries', 'Weekly shop', 2500, null],
      ])
    ).toBe('Missing column: Income/Expense.');
  });

  await test.step('an amount that cannot be read names its row', () => {
    expect(
      rejectionOf([
        HEADER,
        ['2026-02-10 09:00', 'Wallet', 'Groceries', 'Weekly shop', 'about ten', 'Expense', null],
      ])
    ).toBe('Row 2: Amount is not an amount ("about ten").');
  });

  await test.step('a date that cannot be read names its row', () => {
    expect(
      rejectionOf([
        HEADER,
        ['2026-02-10 09:00', 'Wallet', 'Groceries', 'Weekly shop', 2500, 'Expense', null],
        ['10/02/2026', 'Wallet', 'Groceries', 'Snacks', 500, 'Expense', null],
      ])
    ).toBe('Row 3: Date is not a date ("10/02/2026").');
  });

  await test.step('a row kind the mapping does not know names its row', () => {
    expect(
      rejectionOf([
        HEADER,
        ['2026-02-10 09:00', 'Wallet', 'Groceries', 'Weekly shop', 2500, 'Refund', null],
      ])
    ).toBe(
      'Row 2: Income/Expense is not one of Income, Expense, Transfer-Out, Transfer-In ("Refund").'
    );
  });
});
