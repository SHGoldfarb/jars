import { useQuery } from '@tanstack/react-query';
import type { MovementFormUi } from 'src/services/movement-form';

export const useMovementFormEndpoints = (
  movementForm: MovementFormUi,
  movementId: string | undefined
) => {
  const { data } = useQuery({
    queryKey: [
      'movementFormQueries.getEndpointsForSelector',
      movementForm.endpointNoun.plural,
      movementId,
    ],
    queryFn: () => movementForm.queries.getEndpointsForSelector(movementId),
  });
  return data ?? [];
};
