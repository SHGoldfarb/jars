import { movementFormSchema } from '../domain/formSchema';
import type { BookmarkUnsaved } from 'src/services/finance';
import type {
  MovementBookmarkSchema,
  MovementDraft,
  MovementEndpointNoun,
  MovementFormSchema,
  MovementFormValues,
  ParsedMovementBookmarkValues,
  ParsedMovementFormValues,
} from '../domain/formSchema';
import { createMovementFormCommands } from './commands';
import { movementFormValues } from './formValues';
import { createMovementFormQueries } from './queries';
import type { MovementEndpointOption, MovementKind, MovementLike } from './kinds';

// The part of a configured form the UI needs, free of the entity types each kind is built on,
// so the form components stay non-generic.
interface MovementFormUi {
  endpointNoun: MovementEndpointNoun;
  getDefaultValues: () => MovementFormValues;
  createFormSchema: (activeEndpointIds: string[]) => MovementFormSchema;
  toDraft: (values: ParsedMovementFormValues) => MovementDraft;
  createBookmarkSchema: (activeEndpointIds: string[]) => MovementBookmarkSchema;
  toBookmark: (values: ParsedMovementBookmarkValues) => BookmarkUnsaved;
  queries: {
    getEndpointsForSelector: (movementId: string | undefined) => Promise<MovementEndpointOption[]>;
    getDescriptionSuggestions: () => Promise<string[]>;
    getFormValuesFromBookmark: (bookmarkId: string) => Promise<MovementFormValues | undefined>;
  };
}

export const createMovementForm = <TMovement extends MovementLike, TUnsaved>(
  kind: MovementKind<TMovement, TUnsaved>
) => ({
  endpointNoun: kind.endpointNoun,
  getDefaultValues: movementFormSchema.getDefaultValues,
  createFormSchema: (activeEndpointIds: string[]) =>
    movementFormSchema.createFormSchema(kind.endpointNoun, activeEndpointIds),
  toDraft: movementFormSchema.toDraft,
  createBookmarkSchema: (activeEndpointIds: string[]) =>
    movementFormSchema.createBookmarkSchema(kind.endpointNoun, activeEndpointIds),
  toBookmark: (values: ParsedMovementBookmarkValues) =>
    kind.toBookmark(movementFormSchema.toBookmarkDraft(values)),
  queries: createMovementFormQueries(kind),
  commands: createMovementFormCommands(kind),
  toFormValues: (movement: TMovement) =>
    movementFormValues.toFormValues(movement, kind.endpointsOf),
  toUnsaved: kind.toUnsaved,
});

export type { MovementFormUi };
