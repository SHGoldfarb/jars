import { useNavigate } from '@tanstack/react-router';
import { financeCommands } from 'src/services/finance';
import { GenericNameForm } from './GenericNameForm';

export const CategoriesExpenseNew = () => {
  const navigate = useNavigate();
  const handleSubmit = async (name: string) => {
    try {
      await financeCommands.categories.createExpense({ name: name });
      await navigate({ to: '/categories/expense' });
    } catch (error) {
      console.error('Failed to create expense category:', error);
    }
  };
  return (
    <GenericNameForm
      title="Create Expense Category"
      onSubmit={(name) => {
        void handleSubmit(name);
      }}
      onCancelRoute="/categories/expense"
      fieldName="categoryName"
      placeholder="Groceries"
    />
  );
};
