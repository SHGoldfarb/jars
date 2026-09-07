import * as z from 'zod';
import { dateInput } from 'src/lib/dateInput';
import { currencyInput, type CurrencyAmount } from 'src/services/shared';

// A movement moves money between two endpoints of the same entity: accounts for transfers,
// jars for allocations. Only the wording changes, so the noun is all the form needs to know.
interface MovementEndpointNoun {
  singular: string;
  plural: string;
}

interface MovementFormValues {
  amount: string;
  date: string;
  description: string;
  originId: string;
  destinationId: string;
}

// What a valid form hands to whoever submits it: the endpoints stay kind-agnostic, so each
// kind renames them onto its own entity fields.
interface MovementDraft {
  amount: CurrencyAmount;
  dateISO: string;
  description: string;
  originId: string;
  destinationId: string;
}

const getDefaultValues = (): MovementFormValues => ({
  amount: '',
  date: dateInput.todayDateInputValue(),
  description: '',
  originId: '',
  destinationId: '',
});

const createValidators = (noun: MovementEndpointNoun) => ({
  amount: z.string().trim().min(1, 'Amount is required').pipe(currencyInput.parser),
  date: z.string().trim().min(1, 'Date is required').transform(dateInput.parseToISO),
  description: z.string(),
  originId: z.string().trim().min(1, `Origin ${noun.singular} is required`),
  destinationId: z.string().trim().min(1, `Destination ${noun.singular} is required`),
});

const createFormSchema = (noun: MovementEndpointNoun, activeEndpointIds: string[]) =>
  z.object(createValidators(noun)).superRefine((values, ctx) => {
    if (values.originId && !activeEndpointIds.includes(values.originId)) {
      ctx.addIssue({
        code: 'custom',
        path: ['originId'],
        message: `Origin ${noun.singular} must be active`,
      });
    }

    if (values.destinationId && !activeEndpointIds.includes(values.destinationId)) {
      ctx.addIssue({
        code: 'custom',
        path: ['destinationId'],
        message: `Destination ${noun.singular} must be active`,
      });
    }

    if (values.originId && values.destinationId && values.originId === values.destinationId) {
      ctx.addIssue({
        code: 'custom',
        path: ['destinationId'],
        message: `Origin and destination ${noun.plural} must be different`,
      });
    }
  });

type MovementFormSchema = ReturnType<typeof createFormSchema>;
type ParsedMovementFormValues = z.output<MovementFormSchema>;

const toDraft = (values: ParsedMovementFormValues): MovementDraft => ({
  amount: values.amount,
  dateISO: values.date,
  description: values.description.trim(),
  originId: values.originId,
  destinationId: values.destinationId,
});

export const movementFormSchema = {
  getDefaultValues,
  createFormSchema,
  toDraft,
};

export type {
  MovementDraft,
  MovementEndpointNoun,
  MovementFormSchema,
  MovementFormValues,
  ParsedMovementFormValues,
};
