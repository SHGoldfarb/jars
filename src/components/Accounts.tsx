import { useAccounts } from 'src/hooks/useAccounts';
import { useAccountsTotal } from 'src/hooks/useAccountsTotal';
import { BalanceSummary } from './BalanceSummary';
import { GenericList } from './GenericList';
import { AccountItem } from './AccountItem';

export const Accounts = () => {
  const { accounts } = useAccounts();
  const total = useAccountsTotal(accounts.map(({ id }) => id));
  const items = accounts.map((account) => ({ ...account, url: `/accounts/${account.id}/edit` }));

  return (
    <>
      <BalanceSummary label="Total in accounts" total={total} />
      <GenericList items={items} actions={[{ label: 'Add account', url: '/accounts/new' }]}>
        {(item) => <AccountItem account={item} />}
      </GenericList>
    </>
  );
};
