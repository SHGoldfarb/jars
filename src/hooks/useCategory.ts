import { getCategory } from 'src/services/finance';
import { useLiveQuery } from 'dexie-react-hooks';

export const useCategory = (categoryId: string) =>
  useLiveQuery(() => getCategory(categoryId), [categoryId]);
