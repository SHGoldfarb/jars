import { test, expect } from '@playwright/test';
import { createCacheForFunction } from 'src/lib/utils';
import type { XlsxCell } from 'src/lib/xlsx';
import { dataManagement } from 'src/services/data-management';

test('unit tests', async () => {
  await test.step('createCacheForFunction', async () => {
    await test.step('returns the result of the function', async () => {
      const fn = (a: number, b: number) => a + b;
      const cached = createCacheForFunction(fn);

      const result = await cached.computeWithCache({ key: 'key1', params: [1, 2] });
      expect(result).toBe(3);
    });

    await test.step('caches the result and does not call the function again', async () => {
      let callCount = 0;
      const fn = (a: number) => {
        callCount++;
        return a * 2;
      };
      const cached = createCacheForFunction(fn);

      await cached.computeWithCache({ key: 'key1', params: [5] });
      await cached.computeWithCache({ key: 'key1', params: [5] });
      await cached.computeWithCache({ key: 'key1', params: [5] });

      expect(callCount).toBe(1);
    });

    await test.step('different keys produce different results', async () => {
      const fn = (a: number) => a * 10;
      const cached = createCacheForFunction(fn);

      expect(await cached.computeWithCache({ key: 'a', params: [1] })).toBe(10);
      expect(await cached.computeWithCache({ key: 'b', params: [2] })).toBe(20);
    });

    await test.step('without maxSize the cache grows without limit', async () => {
      // All entries should still be cached
      let callCount = 0;
      const countingFn = (a: number) => {
        callCount++;
        return a;
      };
      const cached2 = createCacheForFunction(countingFn, { maxSize: null });

      for (let i = 0; i < 500; i++) {
        await cached2.computeWithCache({ key: String(i), params: [i] });
      }
      // First 500 insertions
      for (let i = 0; i < 500; i++) {
        await cached2.computeWithCache({ key: String(i), params: [i] });
      }
      // All 500 should be cache hits
      expect(callCount).toBe(500);
    });

    await test.step('with maxSize the cache does not exceed the limit', async () => {
      let callCount = 0;
      const countingFn = (a: number) => {
        callCount++;
        return a;
      };
      const cachedCounting = createCacheForFunction(countingFn, { maxSize: 2 });

      await cachedCounting.computeWithCache({ key: 'x', params: [1] });
      await cachedCounting.computeWithCache({ key: 'y', params: [2] });
      // Cache: [x, y]
      await cachedCounting.computeWithCache({ key: 'z', params: [3] });
      // Should evict 'x', cache: [y, z]

      expect(callCount).toBe(3);

      await cachedCounting.computeWithCache({ key: 'x', params: [1] });
      // 'x' was evicted, should re-compute
      expect(callCount).toBe(4);
    });

    await test.step('cache hit updates LRU order so the entry is not evicted', async () => {
      let callCount = 0;
      const countingFn = (a: number) => {
        callCount++;
        return a;
      };
      const cachedCounting = createCacheForFunction(countingFn, { maxSize: 3 });

      await cachedCounting.computeWithCache({ key: 'a', params: [1] });
      await cachedCounting.computeWithCache({ key: 'b', params: [2] });
      await cachedCounting.computeWithCache({ key: 'c', params: [3] });
      // Cache: [a, b, c]

      // Re-access 'a'
      await cachedCounting.computeWithCache({ key: 'a', params: [1] });
      // Cache order: [b, c, a]

      // Insert 'd' -> evicts 'b'. Cache: [c, a, d]
      await cachedCounting.computeWithCache({ key: 'd', params: [4] });
      // Insert 'e' -> evicts 'c'. Cache: [a, d, e]
      await cachedCounting.computeWithCache({ key: 'e', params: [5] });

      // callCount == 5 for 5 unique inserts (a, b, c, d, e)
      expect(callCount).toBe(5);

      // 'b' and 'c' should have been evicted
      await cachedCounting.computeWithCache({ key: 'b', params: [2] });
      expect(callCount).toBe(6);
      await cachedCounting.computeWithCache({ key: 'c', params: [3] });
      expect(callCount).toBe(7);
    });

    await test.step('maxSize of 1 evicts on every new insert', async () => {
      let callCount = 0;
      const fn = (a: number) => {
        callCount++;
        return a;
      };
      const cached = createCacheForFunction(fn, { maxSize: 1 });

      await cached.computeWithCache({ key: 'a', params: [1] });
      expect(callCount).toBe(1);

      await cached.computeWithCache({ key: 'b', params: [2] });
      expect(callCount).toBe(2);
      // 'a' was evicted

      await cached.computeWithCache({ key: 'a', params: [1] });
      expect(callCount).toBe(3);
      // 'b' was evicted, 'a' re-computed
    });

    await test.step('a rejected async result is not cached', async () => {
      let callCount = 0;
      const fn = (shouldFail: boolean) => {
        callCount++;
        return shouldFail ? Promise.reject(new Error('boom')) : Promise.resolve('value');
      };
      const cached = createCacheForFunction(fn);

      await expect(cached.computeWithCache({ key: 'a', params: [true] })).rejects.toThrow('boom');
      expect(callCount).toBe(1);

      // The failed attempt left nothing behind, so the same key is computed again.
      expect(await cached.computeWithCache({ key: 'a', params: [false] })).toBe('value');
      expect(callCount).toBe(2);

      // The successful result is cached as usual.
      expect(await cached.computeWithCache({ key: 'a', params: [false] })).toBe('value');
      expect(callCount).toBe(2);
    });

    await test.step('maxSize of 0 never caches', async () => {
      let callCount = 0;
      const fn = (a: number) => {
        callCount++;
        return a;
      };
      const cached = createCacheForFunction(fn, { maxSize: 0 });

      await cached.computeWithCache({ key: 'a', params: [1] });
      await cached.computeWithCache({ key: 'a', params: [1] });
      await cached.computeWithCache({ key: 'a', params: [1] });
      expect(callCount).toBe(3);
    });
  });
});
// The Money Manager mapping is exercised over rows rather than over workbooks: every rejection
// case would otherwise need its own binary fixture, and hand-authored `.xlsx` files assert
// nothing that literal rows do not. The real file is proven end to end in
// `moneyManagerImport.spec.ts`; the per-row rules are proven here.
test('Money Manager rows to a finance snapshot', async () => {
  // The columns the mapping reads, in the order a real export writes them. The export writes
  // four more (`Description`, `Amount`, `Currency` and a second `Account`) that it never reads;
  // those are covered by the workbook the e2e fixture writes.
  const HEADER: XlsxCell[] = [
    'Date',
    'Account',
    'Category',
    'Subcategory',
    'Note',
    'CLP',
    'Income/Expense',
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
      ['2026-02-10 09:00', 'Wallet', 'Needs', 'Groceries', 'Weekly shop', 2500, 'Expense'],
      ['2026-02-11 10:30', 'Wallet', 'Needs', 'Groceries', 'Snacks', 500, 'Expense']
    );

    expect(snapshot.jars.map(({ name }) => name)).toEqual(['Wallet']);
    expect(snapshot.categories.map(({ name }) => name)).toEqual(['Needs / Groceries']);
    expect(snapshot.accounts.map(({ name }) => name)).toEqual(['Cash']);
    expect(snapshot.transactions).toHaveLength(2);
  });

  await test.step('a category and its subcategory are one category', () => {
    const snapshot = snapshotOf(
      ['2026-02-10 09:00', 'Wallet', 'Needs', 'Groceries', 'Weekly shop', 2500, 'Expense'],
      ['2026-02-11 10:30', 'Wallet', 'Needs', 'Health', 'Dentist', 3000, 'Expense'],
      // No subcategory: the category stands on its own, and is not the same category as any of
      // the ones it heads.
      ['2026-02-12 11:00', 'Wallet', 'Needs', '', 'Uncategorised', 400, 'Expense']
    );

    expect(snapshot.categories.map(({ name }) => name)).toEqual([
      'Needs / Groceries',
      'Needs / Health',
      'Needs',
    ]);
  });

  await test.step('a category name used by both kinds yields one category per kind', () => {
    const snapshot = snapshotOf(
      ['2026-02-10 09:00', 'Wallet', 'Gifts', '', 'Received', 1000, 'Income'],
      ['2026-02-11 10:30', 'Wallet', 'Gifts', '', 'Given', 800, 'Expense']
    );

    expect(snapshot.categories.map(({ name, kind }) => `${name} (${kind})`)).toEqual([
      'Gifts (income)',
      'Gifts (expense)',
    ]);
    // Each transaction points at the category of its own kind.
    const [income, expense] = snapshot.transactions;
    expect(income.categoryId).not.toBe(expense.categoryId);
  });

  await test.step('a transfer moves between the jar it is written in and the one it names', () => {
    const snapshot = snapshotOf([
      '2026-02-12 11:45',
      'Wallet',
      // A transfer row has no category: the column holds the account the money went to.
      'Holidays',
      '',
      'Holiday saving',
      3000,
      'Transfer-Out',
    ]);

    expect(snapshot.allocations).toHaveLength(1);
    expect(snapshot.transactions).toHaveLength(0);
    expect(snapshot.transfers).toHaveLength(0);
    expect(snapshot.categories).toEqual([]);

    const [allocation] = snapshot.allocations;
    const jarNamed = (name: string) => snapshot.jars.find((jar) => jar.name === name)?.id;
    expect(allocation.originJarId).toBe(jarNamed('Wallet'));
    expect(allocation.destinationJarId).toBe(jarNamed('Holidays'));
    expect(allocation.description).toBe('Holiday saving');
  });

  await test.step('a date cell and a text date reach the same stored value', () => {
    const snapshot = snapshotOf(
      [
        new Date(Date.UTC(2026, 1, 10, 9, 0)),
        'Wallet',
        'Needs',
        'Groceries',
        'From a date cell',
        1,
        'Expense',
      ],
      ['2026-02-10 09:00', 'Wallet', 'Needs', 'Groceries', 'From text', 1, 'Expense'],
      ['2026-02-10', 'Wallet', 'Needs', 'Groceries', 'From a date without a time', 1, 'Expense']
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
      'Needs',
      'Groceries',
      'Just short of the minute',
      1,
      'Expense',
    ]);

    expect(snapshot.transactions[0].dateISO).toBe('2026-02-12T11:45:00.000Z');
  });

  await test.step('amounts are read from number and text cells, without their sign', () => {
    const snapshot = snapshotOf(
      ['2026-02-10 09:00', 'Wallet', 'Needs', 'Groceries', 'A number cell', 10000, 'Expense'],
      [
        '2026-02-10 09:00',
        'Wallet',
        'Needs',
        'Groceries',
        'A grouped text cell',
        '2,500.5',
        'Expense',
      ],
      [
        '2026-02-10 09:00',
        'Wallet',
        'Needs',
        'Groceries',
        'A negative number cell',
        -750,
        'Expense',
      ],
      [
        '2026-02-10 09:00',
        'Wallet',
        'Needs',
        'Groceries',
        'A signed text cell',
        '-1,234.00',
        'Expense',
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

  await test.step('the `Account` column the export repeats at the end is not the account', () => {
    // A real export ends with the `CLP` amount under a second `Account` heading, so a title has
    // to be found by its first column or a jar would be named after an amount.
    const exportHeader: XlsxCell[] = [...HEADER, 'Description', 'Amount', 'Currency', 'Account'];
    const result = dataManagement.moneyManager.toFinanceSnapshot([
      exportHeader,
      [
        '2026-02-10 09:00',
        'Wallet',
        'Needs',
        'Groceries',
        'Weekly shop',
        2500,
        'Expense',
        null,
        '2.5',
        'USD',
        2500,
      ],
    ]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.jars.map(({ name }) => name)).toEqual(['Wallet']);
    }
  });

  await test.step('a missing column is named', () => {
    const withoutSubcategory: XlsxCell[] = [
      'Date',
      'Account',
      'Category',
      'Note',
      'CLP',
      'Income/Expense',
    ];

    expect(
      rejectionOf([
        withoutSubcategory,
        ['2026-02-10 09:00', 'Wallet', 'Groceries', 'Weekly shop', 2500, 'Expense'],
      ])
    ).toBe('Missing column: Subcategory.');
  });

  await test.step('an amount that cannot be read names its row', () => {
    expect(
      rejectionOf([
        HEADER,
        ['2026-02-10 09:00', 'Wallet', 'Needs', 'Groceries', 'Weekly shop', 'about ten', 'Expense'],
      ])
    ).toBe('Row 2: CLP is not an amount ("about ten").');
  });

  await test.step('a date that cannot be read names its row', () => {
    expect(
      rejectionOf([
        HEADER,
        ['2026-02-10 09:00', 'Wallet', 'Needs', 'Groceries', 'Weekly shop', 2500, 'Expense'],
        ['10/02/2026', 'Wallet', 'Needs', 'Groceries', 'Snacks', 500, 'Expense'],
      ])
    ).toBe('Row 3: Date is not a date ("10/02/2026").');
  });

  await test.step('a row kind the mapping does not know names its row', () => {
    expect(
      rejectionOf([
        HEADER,
        ['2026-02-10 09:00', 'Wallet', 'Needs', 'Groceries', 'Weekly shop', 2500, 'Refund'],
      ])
    ).toBe('Row 2: Income/Expense is not one of Income, Expense, Transfer-Out ("Refund").');

    // The export writes a transfer once, from the paying side. A `Transfer-In` row would be a
    // file this mapping has never seen, and reporting it is what keeps the money it carries from
    // being silently dropped.
    expect(
      rejectionOf([
        HEADER,
        ['2026-02-10 09:00', 'Holidays', 'Wallet', '', 'Holiday saving', 3000, 'Transfer-In'],
      ])
    ).toBe('Row 2: Income/Expense is not one of Income, Expense, Transfer-Out ("Transfer-In").');
  });
});
