import { getJar } from 'src/services/finance';
import { useLiveQuery } from 'dexie-react-hooks';

export const useJar = (jarId: string) => useLiveQuery(() => getJar(jarId), [jarId]);
