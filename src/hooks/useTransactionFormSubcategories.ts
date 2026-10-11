import { useQuery } from '@tanstack/react-query';
import { transactionForm } from 'src/services/transaction-form';

// Every category's subcategories, keyed by category: the selector picks out the selected
// category's own, and the schema validates against all of them.
export const useTransactionFormSubcategories = (transactionId: string | undefined) => {
  const { data } = useQuery({
    queryKey: ['transactionFormQueries.getSubcategoriesByCategoryForSelector', transactionId],
    queryFn: () => transactionForm.queries.getSubcategoriesByCategoryForSelector(transactionId),
  });
  return data ?? {};
};
