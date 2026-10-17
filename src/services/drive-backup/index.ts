import { accountEmail, createFolder, uploadFile } from 'src/lib/googleDrive';
import { dataManagement } from 'src/services/data-management';
import { createDriveBackupCommands } from './application/commands';
import { createDriveBackupQueries } from './application/queries';
import { driveBackupConfig } from './infrastructure/config';
import { createGoogleAuth } from './infrastructure/googleAuth';
import { driveBackupStateRepository } from './infrastructure/stateDb';

const createDriveBackup = (config: NonNullable<typeof driveBackupConfig>) => {
  const auth = createGoogleAuth(config);
  const deps = {
    state: driveBackupStateRepository,
    backups: dataManagement.commands,
  };

  return {
    // Loads Google's script. The card calls it on mount and enables its button once it is `true`.
    load: () => auth.load(),
    commands: createDriveBackupCommands({
      ...deps,
      auth,
      drive: { createFolder, uploadFile, accountEmail },
    }),
    queries: createDriveBackupQueries(deps),
  };
};

// `null` in a build without a client id: there is no Drive backup, and no card to show for it.
export const driveBackup = driveBackupConfig === null ? null : createDriveBackup(driveBackupConfig);

export type { DriveBackupResult } from './application/commands';
export type { DriveBackupStatus } from './domain/state';
