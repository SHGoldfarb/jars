import { FinanceSnapshot } from '../../model';

// Only a fully valid snapshot may reach persistence: a restore writes every table at once,
// so a single bad record has to stop the whole write rather than land beside good ones.
export const database = {
  replaceAll: (snapshot: unknown) => FinanceSnapshot.parse(snapshot),
};
