import * as z from 'zod';
import { Subcategory } from '../../model';
import { ensureActive } from './shared';

const NewSubcategoryInput = z.object({
  id: Subcategory.shape.id,
  name: Subcategory.shape.name,
  categoryId: Subcategory.shape.categoryId,
});

type NewSubcategoryInput = z.infer<typeof NewSubcategoryInput>;

const RenameSubcategoryInput = z.object({
  name: Subcategory.shape.name,
});

type RenameSubcategoryInput = z.infer<typeof RenameSubcategoryInput>;

export const subcategories = {
  create: (input: NewSubcategoryInput) => Subcategory.parse(input),
  rename: (subcategory: Subcategory, input: RenameSubcategoryInput) => {
    ensureActive(subcategory, 'Subcategory');
    return Subcategory.parse({ ...subcategory, ...RenameSubcategoryInput.parse(input) });
  },
  archive: (subcategory: Subcategory, archivedAtISO = new Date().toISOString()) =>
    Subcategory.parse({ ...subcategory, archivedAtISO }),
};
