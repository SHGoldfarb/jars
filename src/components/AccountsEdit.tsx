import { useNavigate } from '@tanstack/react-router';
import { financeCommands } from 'src/services/finance/application';
import { useParams } from '@tanstack/react-router';
import { useAccount } from 'src/hooks/useAccount';
import { GenericNameForm } from './GenericNameForm';
import { useAccountBalance } from 'src/hooks/useAccountBalance';
import { decimal } from 'src/services/finance';

export const AccountsEdit = () => {
  const { accountId } = useParams({ strict: false });
  const account = useAccount(accountId ?? '');
  const balance = useAccountBalance(accountId ?? '');
  const navigate = useNavigate();

  if (!account || !balance) {
    return null;
  }

  const handleSubmit = async (name: string) => {
    try {
      await financeCommands.renameAccount({ accountId: account.id, name });
      await navigate({ to: '/accounts' });
    } catch (error) {
      console.error('Failed to update account:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await financeCommands.archiveAccount({ accountId: account.id });
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
      placeholder="Savings Account"
      disableDeleteButton={decimal.toNumber(balance.amountDecimal) !== 0}
    />
  );
};
