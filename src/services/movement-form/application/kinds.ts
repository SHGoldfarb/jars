import { balances } from 'src/services/balances';
import {
  financeCommands,
  financeQueries,
  type Allocation,
  type AllocationUnsaved,
  type Bookmark,
  type BookmarkUnsaved,
  type Transfer,
  type TransferUnsaved,
} from 'src/services/finance';
import type { CurrencyAmount } from 'src/services/shared';
import type { MovementEndpoints } from '../domain/commands';
import type {
  MovementBookmarkDraft,
  MovementDraft,
  MovementEndpointNoun,
} from '../domain/formSchema';

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
  listDescriptions: () => Promise<string[]>;
  updateMovement: (movement: TMovement) => Promise<void>;
  endpointsOf: (movement: TMovement) => MovementEndpoints;
  toUnsaved: (draft: MovementDraft) => TUnsaved;
  // A bookmark is the draft minus its date, so it maps the same way, both directions. Reading
  // one gives nothing when the bookmark is another kind's.
  toBookmark: (draft: MovementBookmarkDraft) => BookmarkUnsaved;
  fromBookmark: (bookmark: Bookmark) => MovementBookmarkDraft | undefined;
}

// The endpoint fields alone, so a movement and its bookmark are read by the same function.
const transferEndpoints = ({
  originAccountId,
  destinationAccountId,
}: Pick<Transfer, 'originAccountId' | 'destinationAccountId'>): MovementEndpoints => ({
  originId: originAccountId,
  destinationId: destinationAccountId,
});

const allocationEndpoints = ({
  originJarId,
  destinationJarId,
}: Pick<Allocation, 'originJarId' | 'destinationJarId'>): MovementEndpoints => ({
  originId: originJarId,
  destinationId: destinationJarId,
});

export const transferKind: MovementKind<Transfer, TransferUnsaved> = {
  endpointNoun: { singular: 'account', plural: 'accounts' },
  listEndpoints: () => financeQueries.accounts.list(),
  getEndpointById: (accountId) => financeQueries.accounts.getById(accountId),
  getEndpointBalance: (accountId) => balances.queries.accounts(accountId),
  restoreEndpoint: async (accountId) => {
    await financeCommands.accounts.restore({ accountId });
  },
  getMovementById: (transferId) => financeQueries.transfers.getById(transferId),
  listDescriptions: () => financeQueries.transfers.descriptions(),
  updateMovement: async (transfer) => {
    await financeCommands.transfers.update(transfer);
  },
  endpointsOf: transferEndpoints,
  toUnsaved: ({ amount, dateISO, description, originId, destinationId }) => ({
    amount,
    dateISO,
    description,
    originAccountId: originId,
    destinationAccountId: destinationId,
  }),
  toBookmark: ({ amount, description, originId, destinationId }) => ({
    movementType: 'transfer',
    amount,
    description,
    originAccountId: originId,
    destinationAccountId: destinationId,
  }),
  fromBookmark: (bookmark) =>
    bookmark.movementType === 'transfer'
      ? {
          amount: bookmark.amount,
          description: bookmark.description,
          ...transferEndpoints(bookmark),
        }
      : undefined,
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
  listDescriptions: () => financeQueries.allocations.descriptions(),
  updateMovement: async (allocation) => {
    await financeCommands.allocations.update(allocation);
  },
  endpointsOf: allocationEndpoints,
  toUnsaved: ({ amount, dateISO, description, originId, destinationId }) => ({
    amount,
    dateISO,
    description,
    originJarId: originId,
    destinationJarId: destinationId,
  }),
  toBookmark: ({ amount, description, originId, destinationId }) => ({
    movementType: 'allocation',
    amount,
    description,
    originJarId: originId,
    destinationJarId: destinationId,
  }),
  fromBookmark: (bookmark) =>
    bookmark.movementType === 'allocation'
      ? {
          amount: bookmark.amount,
          description: bookmark.description,
          ...allocationEndpoints(bookmark),
        }
      : undefined,
};

export type { MovementEndpointOption, MovementKind, MovementLike };
