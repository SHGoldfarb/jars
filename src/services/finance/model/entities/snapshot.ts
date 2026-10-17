import * as z from 'zod';
import { Account } from './account';
import { Allocation } from './allocation';
import { Bookmark } from './bookmark';
import { Category } from './category';
import { Jar } from './jar';
import { Subcategory } from './subcategory';
import { Transaction } from './transaction';
import { Transfer } from './transfer';

// The whole database in one value: what a backup carries and what a restore writes back.
// Built from the entity schemas themselves, so it always covers every persisted field.
export const FinanceSnapshot = z.object({
  accounts: z.array(Account),
  jars: z.array(Jar),
  categories: z.array(Category),
  subcategories: z.array(Subcategory),
  transactions: z.array(Transaction),
  transfers: z.array(Transfer),
  allocations: z.array(Allocation),
  bookmarks: z.array(Bookmark),
});

export type FinanceSnapshot = z.infer<typeof FinanceSnapshot>;
