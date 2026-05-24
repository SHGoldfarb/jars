import { getJar } from 'src/services/finance';
import { useQuery } from '@tanstack/react-query';

export const useJar = (jarId: string) =>
  useQuery({ queryKey: ['getJar', jarId], queryFn: () => getJar(jarId) }).data;
