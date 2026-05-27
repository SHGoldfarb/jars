import type { CurrencyAmount } from '../currency';
import type { Archivable } from './shared';

// ---------------------------------------------------------
// ----------- OLD TYPES - NOT YET IMPLEMENTED -------------
// ---------------------------------------------------------

export type Transfer = Archivable & {
  id: string;
  dateISO: string;
  originAccountId: string;
  destinationAccountId: string;
  description: string;
  amount: CurrencyAmount; // Always positive.
};

export type Allocation = Archivable & {
  id: string;
  dateISO: string;
  originJarId: string;
  destinationJarId: string;
  description: string;
  amount: CurrencyAmount; // Always positive.
};
