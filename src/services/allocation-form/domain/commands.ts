import { decimal } from 'src/lib/decimal';
import type { CurrencyAmount } from 'src/services/shared';

interface Archivable {
  archivedAtISO?: string;
}

interface HasJarEndpoints {
  originJarId: string;
  destinationJarId: string;
}

interface Dependencies<T extends HasJarEndpoints> {
  restoreJar: (jarId: string) => Promise<void>;
  updateAllocation: (allocation: T) => Promise<void>;
  getJarBalance: (jarId: string) => Promise<CurrencyAmount>;
  getJar: (jarId: string) => Promise<Archivable>;
}

const restoreJarIfItHoldsMoney = async <T extends HasJarEndpoints>(
  jarId: string,
  deps: Dependencies<T>
) => {
  const balance = await deps.getJarBalance(jarId);
  if (decimal.toNumber(balance.amountDecimal) === 0) {
    return;
  }

  const jar = await deps.getJar(jarId);
  if (!jar.archivedAtISO) {
    return;
  }

  await deps.restoreJar(jarId);
};

const submitEditAllocation = async <T extends HasJarEndpoints>(
  allocation: T,
  deps: Dependencies<T>
) => {
  await deps.updateAllocation(allocation);

  // Restore each endpoint whose balance the edit moved away from zero, so no
  // archived jar is left silently holding money.
  await restoreJarIfItHoldsMoney(allocation.originJarId, deps);
  await restoreJarIfItHoldsMoney(allocation.destinationJarId, deps);
};

export const AllocationFormDomainCommands = {
  submitEditAllocation,
};
