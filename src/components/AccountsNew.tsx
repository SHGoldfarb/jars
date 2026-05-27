import { useNavigate } from '@tanstack/react-router';
import { financeCommands } from 'src/services/finance/application';
import { GenericNameForm } from './GenericNameForm';

export const AccountsNew = () => {
  const navigate = useNavigate();
  const handleSubmit = async (name: string) => {
    try {
      await financeCommands.createAccount({ name: name });
      await navigate({ to: '/accounts' });
    } catch (error) {
      console.error('Failed to create account:', error);
    }
  };
  return (
    <GenericNameForm
      title="Create Account"
      onSubmit={(name) => {
        void handleSubmit(name);
      }}
      onCancelRoute="/accounts"
      fieldName="accountName"
      placeholder="Savings Account"
    />
  );
};
