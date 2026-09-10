import { useState } from 'react';
import { downloadTextFile } from 'src/lib/fileDownload';
import { dataManagement } from 'src/services/data-management';

export interface DataManagementStatus {
  kind: 'success' | 'error';
  message: string;
}

export const useDataManagement = () => {
  const [status, setStatus] = useState<DataManagementStatus | null>(null);

  const createBackup = async () => {
    const { fileName, contents } = await dataManagement.commands.createBackup();
    downloadTextFile({ fileName, contents, mimeType: 'application/json' });
  };

  const restoreFromBackup = async (file: File) => {
    setStatus(null);
    try {
      const result = await dataManagement.commands.restoreFromBackup(await file.text());
      setStatus(
        result.ok
          ? { kind: 'success', message: 'Backup restored.' }
          : { kind: 'error', message: result.error }
      );
    } catch (error) {
      // The restore is atomic, so a failure here left the previous data in place.
      console.error('Failed to restore from backup:', error);
      setStatus({ kind: 'error', message: 'The backup could not be restored.' });
    }
  };

  return { status, createBackup, restoreFromBackup };
};
