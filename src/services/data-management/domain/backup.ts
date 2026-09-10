import * as z from 'zod';
import { DB_SCHEMA_VERSION, FinanceSnapshot } from 'src/services/finance';
import type { ParseResult } from './result';

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

const describeIssue = (issue: z.core.$ZodIssue) => {
  const path = issue.path.join('.');
  return path ? `${path}: ${issue.message}` : issue.message;
};

// A wrong schema version explains every other issue in the file, so it is reported on its own.
// Otherwise the first issue is the one the user can act on; listing all of them for a file that
// is simply the wrong shape buries it.
const describeFailure = (error: z.ZodError) => {
  if (error.issues.some((issue) => issue.path[0] === 'schemaVersion')) {
    return 'This backup was taken from an unsupported version of the app.';
  }
  return `This file is not a valid backup (${describeIssue(error.issues[0])}).`;
};

const readJSON = (text: string): ParseResult<unknown> => {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, error: 'The file is not valid JSON.' };
  }
};

// Nothing is written before this returns `ok`, so an unreadable or invalid file cannot touch
// the database.
export const parseBackupFile = (text: string): ParseResult<FinanceSnapshot> => {
  const json = readJSON(text);
  if (!json.ok) {
    return json;
  }

  const backup = Backup.safeParse(json.value);
  if (!backup.success) {
    return { ok: false, error: describeFailure(backup.error) };
  }

  return { ok: true, value: backup.data.data };
};
