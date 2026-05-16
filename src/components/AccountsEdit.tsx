import { useNavigate } from '@tanstack/react-router';
import { deleteAccount, updateAccount } from 'src/services/finance';
import { useParams } from '@tanstack/react-router';
import { useAccount } from 'src/hooks/useAccount';
import { GenericNameForm } from './GenericNameForm';

export const AccountsEdit = () => {
  const { accountId } = useParams({ strict: false });
  const account = useAccount(accountId ?? '');
  const navigate = useNavigate();

  if (!account) {
    return null;
  }

  const handleSubmit = async (name: string) => {
    try {
      await updateAccount({ ...account, name: name });
      await navigate({ to: '/accounts' });
    } catch (error) {
      console.error('Failed to update account:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAccount(account.id);
      await navigate({ to: '/accounts' });
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  return (
    <GenericNameForm
      title="Edit Account"
      onSubmit={(name) => {
        void handleSubmit(name);
      }}
      onCancelRoute="/accounts"
      initialName={account.name}
      onDelete={() => {
        void handleDelete();
      }}
      fieldName="accountName"
    />
  );
};
