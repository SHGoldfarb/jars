import type { LastBackup } from './state';

const BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

// Due when there has never been a backup, or when it has been more than a day since the last one
// and the data has changed since. Unchanged data is never uploaded again, however old the last
// backup is.
export const isBackupDue = ({
  lastBackup,
  fingerprint,
  now,
}: {
  lastBackup: LastBackup | null;
  fingerprint: string;
  now: Date;
}): boolean => {
  if (lastBackup === null) {
    return true;
  }

  const elapsedMs = now.getTime() - new Date(lastBackup.atISO).getTime();
  return elapsedMs > BACKUP_INTERVAL_MS && fingerprint !== lastBackup.fingerprint;
};
