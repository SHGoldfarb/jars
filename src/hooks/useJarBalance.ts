import { useQuery } from '@tanstack/react-query';
import { balances } from 'src/services/balances';

export const useJarBalance = (jarId: string) => {
  const { data } = useQuery({
    queryKey: ['financeQueries.getJarBalance', jarId],
    queryFn: () => balances.queries.jars(jarId),
  });
  return data;
};
