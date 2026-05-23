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
