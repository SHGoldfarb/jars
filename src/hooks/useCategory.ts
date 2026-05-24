import { getCategory } from 'src/services/finance';
import { useQuery } from '@tanstack/react-query';

export const useCategory = (categoryId: string) => {
  const { data } = useQuery({
    queryKey: ['getCategory', categoryId],
    queryFn: () => getCategory(categoryId),
  });
  return data;
};
