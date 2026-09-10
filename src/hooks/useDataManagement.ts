import { downloadTextFile } from 'src/lib/fileDownload';
import { dataManagement } from 'src/services/data-management';

export const useDataManagement = () => {
  const createBackup = async () => {
    const { fileName, contents } = await dataManagement.commands.createBackup();
    downloadTextFile({ fileName, contents, mimeType: 'application/json' });
  };

  return { createBackup };
};
