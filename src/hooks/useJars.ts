import { getJars } from 'src/services/finance';
import { useLiveQuery } from 'dexie-react-hooks';

export const useJars = () => {
  const jars = useLiveQuery(getJars);
  const loading = jars === undefined;

  return { jars: jars ?? [], loading };
};
