import { useAccounts } from 'src/hooks/useAccounts';
import { GenericList } from './GenericList';
import { AccountItem } from './AccountItem';

export const Accounts = () => {
  const { accounts } = useAccounts();
  const items = accounts.map((account) => ({ ...account, url: `/accounts/${account.id}/edit` }));

  return (
    <GenericList items={items} addLabel="Add account" addUrl="/accounts/new">
      {(item) => <AccountItem account={item} />}
    </GenericList>
  );
};
