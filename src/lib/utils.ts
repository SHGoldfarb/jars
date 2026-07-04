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

export const createCacheForFunction = <T extends unknown[], U>(f: (...params: T) => U) => {
  const cache: Record<string, U> = {};

  const computeWithCache = (key: string, params: T) => {
    if (key in cache) {
      return cache[key];
    }
    const result = f(...params);
    cache[key] = result;
    return result;
  };

  return computeWithCache;
};

// WARNING: No size limiter
export const memoize = <T extends unknown[], U>(f: (...params: T) => U) => {
  const computeWithCache = createCacheForFunction(f);

  const memoizedFunction = (...params: T) => {
    const key = JSON.stringify(params);
    return computeWithCache(key, params);
  };

  return memoizedFunction;
};

// WARNING: Can easily grow in size to the point of causing memory issues
export const makeVersionedMemoize = () => {
  let version = 0;

  const versionedMemoize = <T, U>(f: (...args: T[]) => U) => {
    const memoized = memoize((_version: number, ...args: T[]) => f(...args));
    return (...args: T[]) => memoized(version, ...args);
  };

  const upVersion = () => {
    version++;
  };

  const versionInvalidator =
    <T, U>(f: (...args: T[]) => U) =>
    async (...args: T[]) => {
      const result = await f(...args);
      upVersion();
      return result;
    };

  return { versionedMemoize, upVersion, versionInvalidator };
};
