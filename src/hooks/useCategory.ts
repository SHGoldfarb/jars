import { financeQueries } from 'src/services/finance';
import { useQuery } from '@tanstack/react-query';

export const useCategory = (categoryId: string) => {
  const { data } = useQuery({
    queryKey: ['financeQueries.getCategoryById', categoryId],
    queryFn: () => financeQueries.categories.getById(categoryId),
  });
  return data;
};
