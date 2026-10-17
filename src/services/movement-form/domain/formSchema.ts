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

// Everything but the date: also what a bookmark is validated against.
const createUndatedValidators = (noun: MovementEndpointNoun) => ({
  amount: z.string().trim().min(1, 'Amount is required').pipe(currencyInput.parser),
  description: z.string(),
  originId: z.string().trim().min(1, `Origin ${noun.singular} is required`),
  destinationId: z.string().trim().min(1, `Destination ${noun.singular} is required`),
});

// The checks that tie the endpoints to what the selectors offer. Kept apart from the object so
// the bookmark schema below can share them while leaving the date out: Zod refuses to `.omit()`
// a field from an object that already carries a refinement.
const refineEndpoints =
  (noun: MovementEndpointNoun, activeEndpointIds: string[]) =>
  (values: { originId: string; destinationId: string }, ctx: z.RefinementCtx) => {
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
  };

const createFormSchema = (noun: MovementEndpointNoun, activeEndpointIds: string[]) =>
  z
    .object({
      date: z.string().trim().min(1, 'Date is required').transform(dateInput.parseToISO),
      ...createUndatedValidators(noun),
    })
    .superRefine(refineEndpoints(noun, activeEndpointIds));

// What saving a bookmark checks: every rule of the form but the date, which a bookmark does not
// keep - an empty or odd date must not stop one being saved.
const createBookmarkSchema = (noun: MovementEndpointNoun, activeEndpointIds: string[]) =>
  z.object(createUndatedValidators(noun)).superRefine(refineEndpoints(noun, activeEndpointIds));

type MovementFormSchema = ReturnType<typeof createFormSchema>;
type ParsedMovementFormValues = z.output<MovementFormSchema>;
type MovementBookmarkSchema = ReturnType<typeof createBookmarkSchema>;
type ParsedMovementBookmarkValues = z.output<MovementBookmarkSchema>;

// What a valid bookmark save hands on: a draft without the date a bookmark never keeps.
type MovementBookmarkDraft = Omit<MovementDraft, 'dateISO'>;

const toBookmarkDraft = (values: ParsedMovementBookmarkValues): MovementBookmarkDraft => ({
  amount: values.amount,
  description: values.description.trim(),
  originId: values.originId,
  destinationId: values.destinationId,
});

const toDraft = (values: ParsedMovementFormValues): MovementDraft => ({
  ...toBookmarkDraft(values),
  dateISO: values.date,
});

export const movementFormSchema = {
  getDefaultValues,
  createFormSchema,
  createBookmarkSchema,
  toDraft,
  toBookmarkDraft,
};

export type {
  MovementBookmarkDraft,
  MovementBookmarkSchema,
  MovementDraft,
  MovementEndpointNoun,
  MovementFormSchema,
  MovementFormValues,
  ParsedMovementBookmarkValues,
  ParsedMovementFormValues,
};
