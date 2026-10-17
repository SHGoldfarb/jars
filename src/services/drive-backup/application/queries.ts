import type { dataManagement } from 'src/services/data-management';
import type { DriveBackupStateRepository } from '../domain/ports';
import { isBackupDue } from '../domain/schedule';
import type { DriveBackupStatus } from '../domain/state';

export const createDriveBackupQueries = (deps: {
  state: DriveBackupStateRepository;
  backups: Pick<typeof dataManagement.commands, 'createBackup'>;
}) => ({
  // Local only: reads the stored state and fingerprints the current data. Nothing here contacts
  // Google, so it is safe to run every time Settings opens.
  status: async (now: Date): Promise<DriveBackupStatus> => {
    const state = await deps.state.get();
    if (state.status === 'disconnected') {
      return { kind: 'disconnected' };
    }

    const { accountEmail, lastBackup } = state;
    if (lastBackup === null) {
      return { kind: 'due', accountEmail, lastBackupAtISO: null };
    }

    const { fingerprint } = await deps.backups.createBackup();
    return isBackupDue({ lastBackup, fingerprint, now })
      ? { kind: 'due', accountEmail, lastBackupAtISO: lastBackup.atISO }
      : { kind: 'upToDate', accountEmail, lastBackupAtISO: lastBackup.atISO };
  },
});
