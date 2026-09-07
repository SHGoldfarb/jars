import { allocationKind, transferKind } from './application/kinds';
import { createMovementForm } from './application/movementForm';

export const movementForm = {
  transfers: createMovementForm(transferKind),
  allocations: createMovementForm(allocationKind),
};

export type { MovementEndpointOption } from './application/kinds';
export type { MovementFormUi } from './application/movementForm';
export type { MovementDraft, MovementFormValues } from './domain/formSchema';
