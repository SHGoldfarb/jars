import { decimal } from 'src/lib/decimal';
import { dateInput } from 'src/lib/dateInput';
import type { MovementEndpoints } from '../domain/commands';
import {
  movementFormSchema,
  type MovementBookmarkDraft,
  type MovementFormValues,
} from '../domain/formSchema';
import type { MovementLike } from './kinds';

const undatedFormValues = ({
  amount,
  description,
  originId,
  destinationId,
}: MovementBookmarkDraft): Omit<MovementFormValues, 'date'> => ({
  amount: amount.currency === 'CLP' ? decimal.toNumber(amount.amountDecimal).toString() : '',
  description,
  originId,
  destinationId,
});

// Mapping a finance entity onto the form's own shape needs the movement entities, so it
// belongs in the application layer; the form shape and its rules stay in the domain.
const toFormValues = <TMovement extends MovementLike>(
  movement: TMovement,
  endpointsOf: (movement: TMovement) => MovementEndpoints
): MovementFormValues => ({
  ...undatedFormValues({
    amount: movement.amount,
    description: movement.description,
    ...endpointsOf(movement),
  }),
  date: dateInput.toDateInputValue(new Date(movement.dateISO)),
});

// A bookmark has no date, so the form's own default fills it: the same one a blank form opens
// with.
const fromBookmarkDraft = (draft: MovementBookmarkDraft): MovementFormValues => ({
  ...movementFormSchema.getDefaultValues(),
  ...undatedFormValues(draft),
});

export const movementFormValues = {
  toFormValues,
  fromBookmarkDraft,
};
