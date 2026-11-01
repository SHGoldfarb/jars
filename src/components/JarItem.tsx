import { ItemContent, ItemTitle } from 'components/ui/item';
import { useJarBalance } from 'src/hooks/useJarBalance';
import { BalanceAmount } from './BalanceAmount';

export const JarItem = ({ jar }: { jar: { id: string; name: string } }) => {
  const balance = useJarBalance(jar.id);

  if (!balance) return null;

  return (
    <>
      <ItemContent>
        <ItemTitle className="text-sm">{jar.name}</ItemTitle>
      </ItemContent>
      <ItemContent>
        <BalanceAmount balance={balance} className="text-sm" />
      </ItemContent>
    </>
  );
};
