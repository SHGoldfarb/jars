import { financeCommands, financeQueries, Transfer } from 'src/services/finance';
import { TransferFormDomainCommands } from '../domain/commands';
import { transformFinanceApiToDeps, type Dependencies } from './interfaces';

const createTransferFormCommands = (deps: Dependencies) => {
  return {
    submitEditTransfer: async (params: Transfer) => {
      await TransferFormDomainCommands.submitEditTransfer(params, deps);
    },
  };
};

export const transferFormCommands = createTransferFormCommands(
  transformFinanceApiToDeps(financeCommands, financeQueries)
);
