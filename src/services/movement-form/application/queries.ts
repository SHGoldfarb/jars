import { byName } from 'src/services/finance';
import type { MovementEndpointOption, MovementKind, MovementLike } from './kinds';

export const createMovementFormQueries = <TMovement extends MovementLike, TUnsaved>(
  kind: MovementKind<TMovement, TUnsaved>
) => ({
  // Gets the options that should be shown in the movement form endpoint selectors:
  // The non archived endpoints + the origin/destination endpoints of the movement being
  // edited, even if they are archived.
  getEndpointsForSelector: async (
    movementId: string | undefined
  ): Promise<MovementEndpointOption[]> => {
    const endpoints = await kind.listEndpoints();
    if (movementId) {
      const movement = await kind.getMovementById(movementId);
      const { originId, destinationId } = kind.endpointsOf(movement);
      const endpointIds = endpoints.map(({ id }) => id);
      const missingIds = [originId, destinationId].filter((id) => !endpointIds.includes(id));
      if (missingIds.length > 0) {
        const missingEndpoints = await Promise.all(missingIds.map(kind.getEndpointById));
        return [...missingEndpoints, ...endpoints].sort(byName);
      }
    }
    return endpoints;
  },
});
