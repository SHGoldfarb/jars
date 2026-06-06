import { useAccounts } from 'src/hooks/useAccounts';
import { useCategoriesExpense, useCategoriesIncome } from 'src/hooks/useCategories';
import { useJars } from 'src/hooks/useJars';
import { transactionFormUtils } from 'src/lib/transactionFormUtils';
import { formUtils } from 'src/lib/formUtils';

export const useTransactionFormValidate = () => {
  const { accounts } = useAccounts();
  const { jars } = useJars();
  const { categories: incomeCategories } = useCategoriesIncome();
  const { categories: expenseCategories } = useCategoriesExpense();

  const accountIds = accounts.map((account) => account.id);
  const jarIds = jars.map((jar) => jar.id);
  const incomeCategoryIds = incomeCategories.map((category) => category.id);
  const expenseCategoryIds = expenseCategories.map((category) => category.id);

  const transactionFormSchema = transactionFormUtils.createFormSchema(
    accountIds,
    jarIds,
    incomeCategoryIds,
    expenseCategoryIds
  );

  return (value: Parameters<typeof formUtils.validateWithSchema>[0]) =>
    formUtils.validateWithSchema(value, transactionFormSchema);
};
