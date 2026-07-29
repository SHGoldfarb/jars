import { repositories } from '../../infrastructure/repositories';
import type { FinanceRepositories } from '../../domain';
import { createAccountCommands } from './account';
import { createJarCommands } from './jar';
import { createCategoryCommands } from './category';
import { createTransactionCommands } from './transaction';

export const createFinanceCommands = (deps: FinanceRepositories) => ({
  accounts: createAccountCommands(deps),
  jars: createJarCommands(deps),
  categories: createCategoryCommands(deps),
  transactions:createTransactionCommands(deps),
});

export const financeCommands = createFinanceCommands(repositories);
