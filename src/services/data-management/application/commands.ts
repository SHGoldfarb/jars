import { financeCommands, financeQueries, DB_SCHEMA_VERSION } from 'src/services/finance';
import { Backup, backupFileName, parseBackupFile } from '../domain/backup';
import type { CommandResult } from '../domain/result';

export interface DataFile {
  fileName: string;
  contents: string;
}

const createDataManagementCommands = (deps: {
  finance: typeof financeQueries;
  financeWrites: typeof financeCommands;
}) => ({
  // Reads and formats; writes nothing.
  createBackup: async (): Promise<DataFile> => {
    const takenAt = new Date();
    const backup: Backup = {
      schemaVersion: DB_SCHEMA_VERSION,
      createdAtISO: takenAt.toISOString(),
      data: await deps.finance.database.snapshot(),
    };

    return { fileName: backupFileName(takenAt), contents: JSON.stringify(backup, null, 2) };
  },

  // A rejected file never reaches a writer, so the existing data is left untouched by
  // construction rather than by care.
  restoreFromBackup: async (text: string): Promise<CommandResult> => {
    const backup = parseBackupFile(text);
    if (!backup.ok) {
      return backup;
    }

    await deps.financeWrites.database.replaceAll(backup.value);
    return { ok: true };
  },

  clearAllData: (): Promise<void> => deps.financeWrites.database.clear(),
});

export const dataManagementCommands = createDataManagementCommands({
  finance: financeQueries,
  financeWrites: financeCommands,
});
