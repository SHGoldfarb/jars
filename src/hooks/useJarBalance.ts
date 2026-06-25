import { financeQueries } from 'src/services/finance/application';
import { useQuery } from '@tanstack/react-query';

export const useJarBalance = (jarId: string) => {
  const { data } = useQuery({
    queryKey: ['financeQueries.getJarBalance', jarId],
    queryFn: () => financeQueries.getJarBalance(jarId),
  });
  return data;
};
