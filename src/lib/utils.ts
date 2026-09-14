import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { withLock } from './asyncUtils';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const generateId = () => crypto.randomUUID();

export const runInOrder = async (fns: (() => Promise<void>)[]) => {
  await fns.reduce(async (prevPromise, fn) => {
    await prevPromise;
    await fn();
  }, Promise.resolve());
};

export const createCacheForFunction = <T extends unknown[], U>(
  f: (...params: T) => U,
  options: {
    maxSize?: number | null;
  } = {}
) => {
  const { maxSize } = { maxSize: 256, ...options };
  const typedCache = () => {
    const cache = new Map<string, U>();

    const typedGet = (key: string) => {
      if (cache.has(key)) {
        const value = cache.get(key) as U;
        return { success: true as const, value };
      }
      return { success: false as const };
    };

    return { cache, typedGet };
  };

  const { cache, typedGet } = typedCache();

  // Looking a key up is a read, and a read counts as a use for the LRU order.
  const getCached = (key: string) => {
    const cached = typedGet(key);
    if (cached.success) {
      // Move to the end to mark as most recently used
      cache.delete(key);
      cache.set(key, cached.value);
    }
    return cached;
  };

  // Every cached function is protected by a lock by default: memoizing is useless
  // if we allow multiple concurrent calls since they won't hit the cache that one of them creates.
  const computeWithCache = withLock(({ key, params }: { key: string; params: T }) => {
    const cached = getCached(key);
    if (cached.success) {
      return cached.value;
    }
    const result = f(...params);
    cache.set(key, result);
    // A computation that failed is not a result: an async function's rejection is dropped from
    // the cache, so the next caller for that key retries instead of replaying the same failure.
    if (result instanceof Promise) {
      void result.catch(() => cache.delete(key));
    }
    if (maxSize !== null && cache.size > maxSize) {
      // Delete the first (least recently used) entry
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }
    return result;
  });

  return { computeWithCache };
};

export const memoize = <T extends unknown[], U>(
  f: (...params: T) => U,
  options: {
    maxSize?: number | null;
  } = {}
) => {
  const { maxSize } = { maxSize: 256, ...options };
  const { computeWithCache } = createCacheForFunction(f, { maxSize });

  const memoizedFunction = (...params: T) => {
    const key = JSON.stringify(params);
    return computeWithCache({ key, params });
  };

  return memoizedFunction;
};

export const makeVersionedMemoize = (options: { maxSize?: number | null } = {}) => {
  const { maxSize } = { maxSize: 256, ...options };
  let version: string = generateId();

  const setVersion = (newVersion: string) => {
    version = newVersion;
  };

  const invalidateVersion = () => {
    setVersion(generateId());
  };

  const versionedMemoize = <T extends unknown[], U>(f: (...args: T) => U) => {
    const memoized = memoize((_version: string, ...args: T) => f(...args), { maxSize });
    return (...args: T) => memoized(version, ...args);
  };

  const getCurrentVersion = () => version;

  return {
    memoize: versionedMemoize,
    version: {
      invalidate: invalidateVersion,
      current: getCurrentVersion,
      set: setVersion,
    },
  };
};
