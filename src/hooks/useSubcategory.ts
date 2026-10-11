import { financeQueries } from 'src/services/finance';
import { useQuery } from '@tanstack/react-query';

export const useSubcategory = (subcategoryId: string) => {
  const { data } = useQuery({
    queryKey: ['financeQueries.getSubcategoryById', subcategoryId],
    queryFn: () => financeQueries.subcategories.getById(subcategoryId),
    enabled: subcategoryId !== '',
  });
  return data;
};
