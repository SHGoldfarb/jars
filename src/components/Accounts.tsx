import { useAccounts } from 'src/hooks/useAccounts';
import { GenericList } from './GenericList';
import { AccountItem } from './AccountItem';

export const Accounts = () => {
  const { accounts } = useAccounts();
  const items = accounts.map((account) => ({ ...account, url: `/accounts/${account.id}/edit` }));

  return (
    <GenericList items={items} actions={[{ label: 'Add account', url: '/accounts/new' }]}>
      {(item) => <AccountItem account={item} />}
    </GenericList>
  );
};
