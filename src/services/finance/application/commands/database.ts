import { financeDomainCommands } from '../../domain';
import type { FinanceRepositories } from '../../domain';

export const createDatabaseCommands = (deps: FinanceRepositories) => ({
  replaceAll: (snapshot: unknown) =>
    deps.database.replaceAll(financeDomainCommands.database.replaceAll(snapshot)),

  clear: () => deps.database.clear(),
});
