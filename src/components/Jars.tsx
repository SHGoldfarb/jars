import { useJars } from 'src/hooks/useJars';
import { GenericList } from './GenericList';
import { JarItem } from './JarItem';

export const Jars = () => {
  const { jars } = useJars();

  return (
    <GenericList
      items={jars.map((jar) => ({ ...jar, url: `/jars/${jar.id}/edit` }))}
      addLabel="Add jar"
      addUrl="/jars/new"
    >
      {(item) => <JarItem jar={item} />}
    </GenericList>
  );
};
