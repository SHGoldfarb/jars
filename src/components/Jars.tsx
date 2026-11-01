import { useJars } from 'src/hooks/useJars';
import { useJarsTotal } from 'src/hooks/useJarsTotal';
import { BalanceSummary } from './BalanceSummary';
import { GenericList } from './GenericList';
import { JarItem } from './JarItem';

export const Jars = () => {
  const { jars } = useJars();
  const total = useJarsTotal(jars.map(({ id }) => id));

  return (
    <>
      <BalanceSummary label="Total in jars" total={total} />
      <GenericList
        items={jars.map((jar) => ({ ...jar, url: `/jars/${jar.id}/edit` }))}
        actions={[{ label: 'Add jar', url: '/jars/new' }]}
      >
        {(item) => <JarItem jar={item} />}
      </GenericList>
    </>
  );
};
