import { useNavigate } from '@tanstack/react-router';
import { createCategory } from 'src/services/finance';
import { GenericNameForm } from './GenericNameForm';

export const CategoriesIncomeNew = () => {
  const navigate = useNavigate();
  const handleSubmit = async (name: string) => {
    try {
      await createCategory({ name: name, kind: 'income' });
      await navigate({ to: '/categories/income' });
    } catch (error) {
      console.error('Failed to create income category:', error);
    }
  };
  return (
    <GenericNameForm
      title="Create Income Category"
      onSubmit={(name) => {
        void handleSubmit(name);
      }}
      onCancelRoute="/categories/income"
      fieldName="categoryName"
      placeholder="Salary"
    />
  );
};
