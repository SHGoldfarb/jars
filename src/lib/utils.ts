import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

  const computeWithCache = (key: string, params: T) => {
    // TODO: use named parameters ({ key, params }) for better
    // readability when calling computeWithCache
    const { success, value } = typedGet(key);
    if (success) {
      // Move to the end to mark as most recently used
      cache.delete(key);
      cache.set(key, value);
      return value;
    }
    const result = f(...params);
    cache.set(key, result);
    if (maxSize !== null && cache.size > maxSize) {
      // Delete the first (least recently used) entry
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }
    return result;
  };

  return computeWithCache;
};

export const memoize = <T extends unknown[], U>(
  f: (...params: T) => U,
  options: {
    maxSize?: number | null;
  } = {}
) => {
  const { maxSize } = { maxSize: 256, ...options };
  const computeWithCache = createCacheForFunction(f, { maxSize });

  const memoizedFunction = (...params: T) => {
    const key = JSON.stringify(params);
    return computeWithCache(key, params);
  };

  return memoizedFunction;
};

export const makeVersionedMemoize = (options: { maxSize?: number | null } = {}) => {
  const { maxSize } = { maxSize: 256, ...options };
  let version = 0;

  const versionedMemoize = <T extends unknown[], U>(f: (...args: T) => U) => {
    const memoized = memoize((_version: number, ...args: T) => f(...args), { maxSize });
    return (...args: T) => memoized(version, ...args);
  };

  const upVersion = () => {
    version++;
  };

  const versionInvalidator =
    <T extends unknown[], U>(f: (...args: T) => U) =>
    async (...args: T) => {
      const result = await f(...args);
      upVersion();
      return result;
    };

  const getCurrentVersion = () => version;

  return { versionedMemoize, upVersion, versionInvalidator, getCurrentVersion };
};
