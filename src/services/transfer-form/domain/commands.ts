import { decimal } from 'src/lib/decimal';
import type { CurrencyAmount } from 'src/services/shared';

interface Archivable {
  archivedAtISO?: string;
}

interface HasAccountEndpoints {
  originAccountId: string;
  destinationAccountId: string;
}

interface Dependencies<T extends HasAccountEndpoints> {
  restoreAccount: (accountId: string) => Promise<void>;
  updateTransfer: (transfer: T) => Promise<void>;
  getAccountBalance: (accountId: string) => Promise<CurrencyAmount>;
  getAccount: (accountId: string) => Promise<Archivable>;
}

const restoreAccountIfItHoldsMoney = async <T extends HasAccountEndpoints>(
  accountId: string,
  deps: Dependencies<T>
) => {
  const balance = await deps.getAccountBalance(accountId);
  if (decimal.toNumber(balance.amountDecimal) === 0) {
    return;
  }

  const account = await deps.getAccount(accountId);
  if (!account.archivedAtISO) {
    return;
  }

  await deps.restoreAccount(accountId);
};

const submitEditTransfer = async <T extends HasAccountEndpoints>(
  transfer: T,
  deps: Dependencies<T>
) => {
  await deps.updateTransfer(transfer);

  // Restore each endpoint whose balance the edit moved away from zero, so no
  // archived account is left silently holding money.
  await restoreAccountIfItHoldsMoney(transfer.originAccountId, deps);
  await restoreAccountIfItHoldsMoney(transfer.destinationAccountId, deps);
};

export const TransferFormDomainCommands = {
  submitEditTransfer,
};
