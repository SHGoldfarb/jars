import { balanceQueries } from './application/queries';
import { balancesFromMovements } from './domain/queries';

export const balances = { queries: balanceQueries, fromMovements: balancesFromMovements };
