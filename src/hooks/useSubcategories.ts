import { financeQueries } from 'src/services/finance';
import { useQuery } from '@tanstack/react-query';

// Every available subcategory, alphabetically. The Categories list holds categories of one kind
// and picks each one's own out of this, which is one query for the screen rather than one per
// category.
export const useSubcategories = () => {
  const { data: subcategories } = useQuery({
    queryKey: ['financeQueries.listSubcategories'],
    queryFn: () => financeQueries.subcategories.list(),
  });

  return { subcategories: subcategories ?? [] };
};
