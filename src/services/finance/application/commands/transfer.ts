import { generateId } from 'src/lib/utils';
import { financeDomainCommands } from '../../domain';
import type { Transfer } from '../../model';
import type { CurrencyAmount } from 'src/services/shared';
import type { FinanceRepositories } from '../../domain';

interface CreateTransferInput {
  originAccountId: string;
  destinationAccountId: string;
  amount: CurrencyAmount;
  dateISO: string;
  description: string;
}

export const createTransferCommands = (deps: FinanceRepositories) => ({
  create: async (input: CreateTransferInput) => {
    const transfer = financeDomainCommands.transfers.create({
      id: generateId(),
      ...input,
    });
    return deps.transfers.save(transfer);
  },

  update: async (transfer: Transfer) => {
    const parsedTransfer = financeDomainCommands.transfers.update(transfer);
    return deps.transfers.save(parsedTransfer);
  },

  archive: async ({ transferId }: { transferId: string }) => {
    const current = await deps.transfers.getById(transferId);
    return deps.transfers.save(financeDomainCommands.transfers.archive(current));
  },
});
