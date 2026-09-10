import * as z from 'zod';
import { DB_SCHEMA_VERSION, FinanceSnapshot } from 'src/services/finance';

// A backup is the snapshot plus the two things a restore needs to judge the file:
// the schema it was taken from and when it was taken.
export const Backup = z.object({
  schemaVersion: z.literal(DB_SCHEMA_VERSION),
  createdAtISO: z.iso.datetime(),
  data: FinanceSnapshot,
});

export type Backup = z.infer<typeof Backup>;

const twoDigits = (value: number) => value.toString().padStart(2, '0');

export const backupFileName = (date: Date) =>
  `jars-backup-${date.getFullYear().toString()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())}.json`;
