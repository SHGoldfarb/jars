import { Dexie, type Table } from 'dexie';
import type { DriveBackupStateRepository } from '../domain/ports';
import { DriveBackupState } from '../domain/state';

// A database of its own, apart from `JarsMainDatabase`: the connection is not finance data, so it
// is never part of a backup file, and restoring or clearing the finance data leaves it alone.
const db = new Dexie('JarsDriveBackup');

// One row under a fixed key. The key is out-of-line (`''`), so the stored value is the state
// exactly as the domain describes it, with no id field added for the database's sake.
db.version(1).stores({ state: '' });

const STATE_KEY = 'state';

const stateTable: Table<unknown, string> = db.table('state');

const DISCONNECTED: DriveBackupState = { status: 'disconnected' };

// A row that does not parse can't be trusted to point at the right folder, so it is treated as
// no connection at all: the user connects again rather than the app failing to load Settings.
const get = async (): Promise<DriveBackupState> => {
  const row = await stateTable.get(STATE_KEY);
  if (row === undefined) {
    return DISCONNECTED;
  }

  const state = DriveBackupState.safeParse(row);
  if (!state.success) {
    console.error('Ignoring an invalid Drive backup state:', state.error);
    return DISCONNECTED;
  }
  return state.data;
};

const save = async (state: DriveBackupState): Promise<void> => {
  await stateTable.put(state, STATE_KEY);
};

export const driveBackupStateRepository: DriveBackupStateRepository = { get, save };
