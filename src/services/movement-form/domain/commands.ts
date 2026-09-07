import { decimal } from 'src/lib/decimal';
import type { CurrencyAmount } from 'src/services/shared';

interface Archivable {
  archivedAtISO?: string;
}

interface MovementEndpoints {
  originId: string;
  destinationId: string;
}

interface Dependencies<T> {
  restoreEndpoint: (endpointId: string) => Promise<void>;
  updateMovement: (movement: T) => Promise<void>;
  getEndpointBalance: (endpointId: string) => Promise<CurrencyAmount>;
  getEndpointById: (endpointId: string) => Promise<Archivable>;
  endpointsOf: (movement: T) => MovementEndpoints;
}

const restoreEndpointIfItHoldsMoney = async <T>(endpointId: string, deps: Dependencies<T>) => {
  const balance = await deps.getEndpointBalance(endpointId);
  if (decimal.toNumber(balance.amountDecimal) === 0) {
    return;
  }

  const endpoint = await deps.getEndpointById(endpointId);
  if (!endpoint.archivedAtISO) {
    return;
  }

  await deps.restoreEndpoint(endpointId);
};

const submitEditMovement = async <T>(movement: T, deps: Dependencies<T>) => {
  await deps.updateMovement(movement);

  // Restore each endpoint whose balance the edit moved away from zero, so no
  // archived account or jar is left silently holding money.
  const { originId, destinationId } = deps.endpointsOf(movement);
  await restoreEndpointIfItHoldsMoney(originId, deps);
  await restoreEndpointIfItHoldsMoney(destinationId, deps);
};

export const MovementFormDomainCommands = {
  submitEditMovement,
};

export type { MovementEndpoints };
