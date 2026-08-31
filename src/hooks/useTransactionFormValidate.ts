import { transactionForm } from 'src/services/transaction-form';
import { formUtils } from 'src/lib/formUtils';
import { useTransactionFormAccounts } from './useTransactionFormAccounts';
import { useTransactionEditCurrentTransaction } from './useTransactionEditCurrentTransaction';
import { useTransactionFormJars } from './useTransactionFormJars';
import { useTransactionFormCategories } from './useTransactionFormCategories';

export const useTransactionFormValidate = () => {
  const transaction = useTransactionEditCurrentTransaction();
  const accounts = useTransactionFormAccounts(transaction?.id);
  const jars = useTransactionFormJars(transaction?.id);
  const incomeCategories = useTransactionFormCategories('income', transaction?.id);
  const expenseCategories = useTransactionFormCategories('expense', transaction?.id);

  const accountIds = accounts.map((account) => account.id);
  const jarIds = jars.map((jar) => jar.id);
  const incomeCategoryIds = incomeCategories.map((category) => category.id);
  const expenseCategoryIds = expenseCategories.map((category) => category.id);

  const transactionFormSchema = transactionForm.createFormSchema(
    accountIds,
    jarIds,
    incomeCategoryIds,
    expenseCategoryIds
  );

  return {
    validateWithSchema: (value: Parameters<typeof formUtils.validateWithSchema>[0]) =>
      formUtils.validateWithSchema(value, transactionFormSchema),
    transactionFormSchema,
  };
};
