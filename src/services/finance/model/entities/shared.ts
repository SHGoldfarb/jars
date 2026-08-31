import * as z from 'zod';
import { CurrencyAmount } from 'src/services/shared';

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

export const Movement = z.object({
  ...Identifiable.shape,
  ...Archivable.shape,
  amount: CurrencyAmount,
  dateISO: dateTimeShape,
  description: z.string().trim(),
});

export type Movement = z.infer<typeof Movement>;
