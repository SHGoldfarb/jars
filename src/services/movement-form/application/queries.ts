import { byName, financeQueries } from 'src/services/finance';
import type { MovementFormValues } from '../domain/formSchema';
import { movementFormValues } from './formValues';
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

  // Gets what the description field suggests: the descriptions movements of this kind already
  // carry, and only of this kind.
  getDescriptionSuggestions: (): Promise<string[]> => kind.listDescriptions(),

  // Gets the values a new movement started from a bookmark opens with: the bookmark's own, the
  // date left at the form's default. An endpoint the selectors would no longer offer - a deleted
  // account or jar - is left empty for the user to pick again, since the form only accepts what
  // its selectors offer. A bookmark that is gone, or is another kind's (a hand-edited link),
  // gives nothing, and the form opens blank.
  getFormValuesFromBookmark: async (
    bookmarkId: string
  ): Promise<MovementFormValues | undefined> => {
    const bookmark = (await financeQueries.bookmarks.list()).find(({ id }) => id === bookmarkId);
    const draft = bookmark ? kind.fromBookmark(bookmark) : undefined;
    if (!draft) {
      return undefined;
    }

    const endpointIds = (await kind.listEndpoints()).map(({ id }) => id);
    const offered = (id: string) => (endpointIds.includes(id) ? id : '');
    return movementFormValues.fromBookmarkDraft({
      ...draft,
      originId: offered(draft.originId),
      destinationId: offered(draft.destinationId),
    });
  },
});
