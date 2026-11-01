import { useQuery } from '@tanstack/react-query';
import { balances } from 'src/services/balances';

export const useJarsTotal = (jarIds: readonly string[]) => {
  const { data } = useQuery({
    queryKey: ['balances.jarsTotal', jarIds],
    queryFn: () => balances.queries.jarsTotal(jarIds),
  });
  return data;
};
