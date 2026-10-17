import type { DriveBackupState } from './state';

export interface DriveBackupStateRepository {
  get(): Promise<DriveBackupState>;
  save(state: DriveBackupState): Promise<void>;
}
