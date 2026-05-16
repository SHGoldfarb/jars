import { useAccounts } from 'src/hooks/useAccounts';
import { GenericNameableList } from 'src/components/GenericNameableList';

export const Accounts = () => {
  const { accounts } = useAccounts();

  return (
    <GenericNameableList
      items={accounts.map((account) => ({ ...account, url: `/accounts/${account.id}/edit` }))}
      addLabel="Add account"
      addUrl="/accounts/new"
    />
  );
};
