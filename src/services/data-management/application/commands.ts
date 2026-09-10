import { financeQueries, DB_SCHEMA_VERSION } from 'src/services/finance';
import { Backup, backupFileName } from '../domain/backup';

export interface DataFile {
  fileName: string;
  contents: string;
}

const createDataManagementCommands = (deps: { finance: typeof financeQueries }) => ({
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
});

export const dataManagementCommands = createDataManagementCommands({ finance: financeQueries });
