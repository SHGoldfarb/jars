import * as z from 'zod';
import { Archivable, Identifiable, Nameable, idShape } from './shared';

// A subcategory belongs to exactly one category and inherits its kind, so the kind is read off
// the parent rather than stored here: a copy could disagree with the category it belongs to.
export const Subcategory = z.object({
  ...Archivable.shape,
  ...Identifiable.shape,
  ...Nameable.shape,
  categoryId: idShape,
});

export type Subcategory = z.infer<typeof Subcategory>;
