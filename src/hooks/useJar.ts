import { financeQueries } from 'src/services/finance/application';
import { useQuery } from '@tanstack/react-query';

export const useJar = (jarId: string) =>
  useQuery({
    queryKey: ['financeQueries.getJarById', jarId],
    queryFn: () => financeQueries.jars.getById(jarId),
  }).data;
