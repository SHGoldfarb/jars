import { repositories } from '../../infrastructure/repositories';
import type { FinanceRepositories } from '../../domain';
import { createAccountCommands } from './account';
import { createJarCommands } from './jar';
import { createCategoryCommands } from './category';
import { createTransactionCommands } from './transaction';
import { createTransferCommands } from './transfer';
import { createAllocationCommands } from './allocation';
import { createDatabaseCommands } from './database';

const createFinanceCommands = (deps: FinanceRepositories) => ({
  accounts: createAccountCommands(deps),
  jars: createJarCommands(deps),
  categories: createCategoryCommands(deps),
  transactions: createTransactionCommands(deps),
  transfers: createTransferCommands(deps),
  allocations: createAllocationCommands(deps),
  database: createDatabaseCommands(deps),
});

export const financeCommands = createFinanceCommands(repositories);
