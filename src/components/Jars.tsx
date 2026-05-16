import { useJars } from 'src/hooks/useJars';
import { GenericNameableList } from 'src/components/GenericNameableList';

export const Jars = () => {
  const { jars } = useJars();

  return (
    <GenericNameableList
      items={jars.map((jar) => ({ ...jar, url: `/jars/${jar.id}/edit` }))}
      addLabel="Add jar"
      addUrl="/jars/new"
    />
  );
};
