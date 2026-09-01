import { test, expect } from '@playwright/test';
import { createCacheForFunction } from 'src/lib/utils';

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
