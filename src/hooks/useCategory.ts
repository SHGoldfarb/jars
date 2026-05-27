import { financeQueries } from 'src/services/finance/application';
import { useQuery } from '@tanstack/react-query';

export const useCategory = (categoryId: string) => {
  const { data } = useQuery({
    queryKey: ['financeQueries.getCategoryById', categoryId],
    queryFn: () => financeQueries.getCategoryById(categoryId),
  });
  return data;
};
