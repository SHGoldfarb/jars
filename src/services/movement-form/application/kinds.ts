import { balances } from 'src/services/balances';
import {
  financeCommands,
  financeQueries,
  type Allocation,
  type AllocationUnsaved,
  type Transfer,
  type TransferUnsaved,
} from 'src/services/finance';
import type { CurrencyAmount } from 'src/services/shared';
import type { MovementEndpoints } from '../domain/commands';
import type { MovementDraft, MovementEndpointNoun } from '../domain/formSchema';

// The shape every movement shares, which is all the form itself reads off the entity.
interface MovementLike {
  amount: CurrencyAmount;
  dateISO: string;
  description: string;
}

interface MovementEndpointOption {
  id: string;
  name: string;
  archivedAtISO?: string;
}

// Everything that differs between transfers and allocations, and nothing else: the endpoint
// entity they move money between, and the entity field names their endpoints are stored under.
interface MovementKind<TMovement extends MovementLike, TUnsaved> {
  endpointNoun: MovementEndpointNoun;
  listEndpoints: () => Promise<MovementEndpointOption[]>;
  getEndpointById: (endpointId: string) => Promise<MovementEndpointOption>;
  getEndpointBalance: (endpointId: string) => Promise<CurrencyAmount>;
  restoreEndpoint: (endpointId: string) => Promise<void>;
  getMovementById: (movementId: string) => Promise<TMovement>;
  updateMovement: (movement: TMovement) => Promise<void>;
  endpointsOf: (movement: TMovement) => MovementEndpoints;
  toUnsaved: (draft: MovementDraft) => TUnsaved;
}

export const transferKind: MovementKind<Transfer, TransferUnsaved> = {
  endpointNoun: { singular: 'account', plural: 'accounts' },
  listEndpoints: () => financeQueries.accounts.list(),
  getEndpointById: (accountId) => financeQueries.accounts.getById(accountId),
  getEndpointBalance: (accountId) => balances.queries.accounts(accountId),
  restoreEndpoint: async (accountId) => {
    await financeCommands.accounts.restore({ accountId });
  },
  getMovementById: (transferId) => financeQueries.transfers.getById(transferId),
  updateMovement: async (transfer) => {
    await financeCommands.transfers.update(transfer);
  },
  endpointsOf: ({ originAccountId, destinationAccountId }) => ({
    originId: originAccountId,
    destinationId: destinationAccountId,
  }),
  toUnsaved: ({ amount, dateISO, description, originId, destinationId }) => ({
    amount,
    dateISO,
    description,
    originAccountId: originId,
    destinationAccountId: destinationId,
  }),
};

export const allocationKind: MovementKind<Allocation, AllocationUnsaved> = {
  endpointNoun: { singular: 'jar', plural: 'jars' },
  listEndpoints: () => financeQueries.jars.list(),
  getEndpointById: (jarId) => financeQueries.jars.getById(jarId),
  getEndpointBalance: (jarId) => balances.queries.jars(jarId),
  restoreEndpoint: async (jarId) => {
    await financeCommands.jars.restore({ jarId });
  },
  getMovementById: (allocationId) => financeQueries.allocations.getById(allocationId),
  updateMovement: async (allocation) => {
    await financeCommands.allocations.update(allocation);
  },
  endpointsOf: ({ originJarId, destinationJarId }) => ({
    originId: originJarId,
    destinationId: destinationJarId,
  }),
  toUnsaved: ({ amount, dateISO, description, originId, destinationId }) => ({
    amount,
    dateISO,
    description,
    originJarId: originId,
    destinationJarId: destinationId,
  }),
};

export type { MovementEndpointOption, MovementKind, MovementLike };
