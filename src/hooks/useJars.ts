import { financeQueries } from 'src/services/finance';
import { useQuery } from '@tanstack/react-query';

export const useJars = () => {
  const jars = useQuery({
    queryKey: ['financeQueries.listJars'],
    queryFn: () => financeQueries.jars.list(),
  }).data;
  return { jars: jars ?? [] };
};
