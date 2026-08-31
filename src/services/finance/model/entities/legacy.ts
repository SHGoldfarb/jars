import type { CurrencyAmount } from 'src/services/shared';
import type { Archivable } from './shared';

// ---------------------------------------------------------
// ----------- OLD TYPES - NOT YET IMPLEMENTED -------------
// ---------------------------------------------------------

export type Allocation = Archivable & {
  id: string;
  dateISO: string;
  originJarId: string;
  destinationJarId: string;
  description: string;
  amount: CurrencyAmount; // Always positive.
};
