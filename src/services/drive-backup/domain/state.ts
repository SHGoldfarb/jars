import * as z from 'zod';

export const LastBackup = z.object({
  atISO: z.iso.datetime(),
  fingerprint: z.string().min(1),
});

export type LastBackup = z.infer<typeof LastBackup>;

// What is stored. Whether a backup is due is derived from it on every read, never stored, so it
// cannot go stale.
export const DriveBackupState = z.discriminatedUnion('status', [
  z.object({ status: z.literal('disconnected') }),
  z.object({
    status: z.literal('connected'),
    folderId: z.string().min(1),
    accountEmail: z.string().min(1),
    lastBackup: LastBackup.nullable(),
  }),
]);

export type DriveBackupState = z.infer<typeof DriveBackupState>;

export type DriveBackupConnection = Extract<DriveBackupState, { status: 'connected' }>;

// What the Settings card shows.
export type DriveBackupStatus =
  | { kind: 'disconnected' }
  | { kind: 'upToDate'; accountEmail: string; lastBackupAtISO: string }
  | { kind: 'due'; accountEmail: string; lastBackupAtISO: string | null };
