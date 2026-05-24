import { getJars } from 'src/services/finance';
import { useQuery } from '@tanstack/react-query';

export const useJars = () => {
  const jars = useQuery({ queryKey: ['getJars'], queryFn: () => getJars() }).data;
  return { jars: jars ?? [] };
};
