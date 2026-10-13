import { useQuery } from '@tanstack/react-query';
import type { MovementFormUi } from 'src/services/movement-form';

export const useMovementFormDescriptions = (movementForm: MovementFormUi) => {
  const { data } = useQuery({
    queryKey: ['movementFormQueries.getDescriptionSuggestions', movementForm.endpointNoun.plural],
    queryFn: () => movementForm.queries.getDescriptionSuggestions(),
  });
  return data ?? [];
};
