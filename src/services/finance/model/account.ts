import * as z from 'zod';

const Archivable = z.object({
  archivedAtISO: z.iso.datetime().optional(),
});

const Identifiable = z.object({
  id: z.uuidv4(),
});

export const Account = z.object({
  ...Archivable.shape,
  ...Identifiable.shape,
  name: z.string(),
});

export type Account = z.infer<typeof Account>;
