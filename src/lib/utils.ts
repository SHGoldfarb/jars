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

// WARNING: No size limiter
export const memoize = <T extends unknown[], U>(f: (...params: T) => U) => {
  const cache: Record<string, U> = {};

  const memoizedFunction = (...params: T) => {
    const key = JSON.stringify(params);
    if (key in cache) {
      return cache[key];
    }
    const result = f(...params);
    cache[key] = result;
    return result;
  };

  return memoizedFunction;
};
