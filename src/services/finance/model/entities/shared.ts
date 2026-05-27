import * as z from 'zod';

export const idShape = z.uuidv4();
export const dateTimeShape = z.iso.datetime();

export const Archivable = z.object({
  archivedAtISO: dateTimeShape.optional(),
});

export type Archivable = z.infer<typeof Archivable>;

export const Identifiable = z.object({
  id: idShape,
});

export const Nameable = z.object({
  name: z.string().trim().min(1),
});

export const ensureActive = (entity: Archivable, entityName: string): void => {
  if (entity.archivedAtISO) {
    throw new Error(`${entityName} is archived`);
  }
};
