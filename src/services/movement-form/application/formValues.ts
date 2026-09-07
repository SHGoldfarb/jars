import { decimal } from 'src/lib/decimal';
import { dateInput } from 'src/lib/dateInput';
import type { MovementEndpoints } from '../domain/commands';
import type { MovementFormValues } from '../domain/formSchema';
import type { MovementLike } from './kinds';

// Mapping a finance entity onto the form's own shape needs the movement entities, so it
// belongs in the application layer; the form shape and its rules stay in the domain.
const toFormValues = <TMovement extends MovementLike>(
  movement: TMovement,
  endpointsOf: (movement: TMovement) => MovementEndpoints
): MovementFormValues => ({
  amount:
    movement.amount.currency === 'CLP'
      ? decimal.toNumber(movement.amount.amountDecimal).toString()
      : '',
  date: dateInput.toDateInputValue(new Date(movement.dateISO)),
  description: movement.description,
  ...endpointsOf(movement),
});

export const movementFormValues = {
  toFormValues,
};
