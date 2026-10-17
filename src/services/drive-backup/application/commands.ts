import type { accountEmail, createFolder, DriveResult, uploadFile } from 'src/lib/googleDrive';
import type { dataManagement } from 'src/services/data-management';
import type { AuthResult, DriveBackupStateRepository, GoogleAuth } from '../domain/ports';
import type { DriveBackupConnection, DriveBackupStatus } from '../domain/state';

const FOLDER_NAME = 'jars';

const BACKUP_MIME_TYPE = 'application/json';

// What a click ends in. `ok` carries the new status, so the card updates without reading again.
export type DriveBackupResult =
  | { kind: 'ok'; status: Extract<DriveBackupStatus, { kind: 'upToDate' }> }
  | { kind: 'cancelled' }
  | { kind: 'unavailable' };

const CANCELLED: DriveBackupResult = { kind: 'cancelled' };
const UNAVAILABLE: DriveBackupResult = { kind: 'unavailable' };

export const createDriveBackupCommands = (deps: {
  state: DriveBackupStateRepository;
  auth: GoogleAuth;
  drive: {
    createFolder: typeof createFolder;
    uploadFile: typeof uploadFile;
    accountEmail: typeof accountEmail;
  };
  backups: Pick<typeof dataManagement.commands, 'createBackup'>;
}) => {
  // One click at a time: a second click while one is running gets the same outcome, and opens no
  // second popup and uploads nothing twice. The guarded function is started synchronously, so its
  // `authorize` still runs inside the click that started it.
  let inFlight: Promise<DriveBackupResult> | null = null;
  const singleFlight = (run: () => Promise<DriveBackupResult>): Promise<DriveBackupResult> => {
    inFlight ??= run().finally(() => {
      inFlight = null;
    });
    return inFlight;
  };

  // A token Drive rejects is dropped. Asking for a new one would open a popup outside the click,
  // which the browser blocks, so the next click asks instead. A folder still missing after it was
  // just created is nothing a retry in this click can fix either.
  const driveFailed = (
    result: Exclude<DriveResult<unknown>, { kind: 'ok' }>
  ): DriveBackupResult => {
    if (result.kind === 'unauthorized') {
      deps.auth.discardToken();
    }
    return UNAVAILABLE;
  };

  const notAuthorized = (auth: Exclude<AuthResult, { kind: 'ok' }>): DriveBackupResult =>
    auth.kind === 'cancelled' ? CANCELLED : UNAVAILABLE;

  // Uploads the backup into the connection's folder. A folder that is gone (deleted, or emptied
  // from the trash) is replaced once: the new folder is stored as soon as it exists, so a failed
  // retry doesn't leave the next click to create yet another one.
  const upload = async (
    accessToken: string,
    connection: DriveBackupConnection
  ): Promise<DriveBackupResult> => {
    const backup = await deps.backups.createBackup();
    const file = {
      fileName: backup.fileName,
      contents: backup.contents,
      mimeType: BACKUP_MIME_TYPE,
    };

    let current = connection;
    let uploaded = await deps.drive.uploadFile(accessToken, {
      ...file,
      folderId: current.folderId,
    });
    if (uploaded.kind === 'notFound') {
      const folder = await deps.drive.createFolder(accessToken, FOLDER_NAME);
      if (folder.kind !== 'ok') {
        return driveFailed(folder);
      }
      current = { ...current, folderId: folder.value.id };
      await deps.state.save(current);
      uploaded = await deps.drive.uploadFile(accessToken, { ...file, folderId: current.folderId });
    }

    if (uploaded.kind !== 'ok') {
      return driveFailed(uploaded);
    }

    const atISO = new Date().toISOString();
    await deps.state.save({ ...current, lastBackup: { atISO, fingerprint: backup.fingerprint } });
    return {
      kind: 'ok',
      status: { kind: 'upToDate', accountEmail: current.accountEmail, lastBackupAtISO: atISO },
    };
  };

  // Every command calls `authorize` before its first `await`, so the popup opens inside the click.
  return {
    // Reads the account, creates the `jars` folder, stores the connection, then uploads the first
    // backup. The email is read first so a failure there leaves no empty folder behind, and the
    // connection is stored before the upload, so a failed first upload leaves a backup that is due
    // into the same folder rather than a second folder on the next try.
    connect: (): Promise<DriveBackupResult> =>
      singleFlight(async () => {
        const auth = await deps.auth.authorize();
        if (auth.kind !== 'ok') {
          return notAuthorized(auth);
        }

        const email = await deps.drive.accountEmail(auth.accessToken);
        if (email.kind !== 'ok') {
          return driveFailed(email);
        }
        const folder = await deps.drive.createFolder(auth.accessToken, FOLDER_NAME);
        if (folder.kind !== 'ok') {
          return driveFailed(folder);
        }

        const connection: DriveBackupConnection = {
          status: 'connected',
          folderId: folder.value.id,
          accountEmail: email.value,
          lastBackup: null,
        };
        await deps.state.save(connection);
        return upload(auth.accessToken, connection);
      }),

    // Uploads whether or not a backup is due: the click is the user's decision. The hint is the
    // account email the card already shows, as reading it from storage here would mean awaiting
    // before the popup opens.
    backUpNow: (hint: string): Promise<DriveBackupResult> =>
      singleFlight(async () => {
        const auth = await deps.auth.authorize(hint);
        if (auth.kind !== 'ok') {
          return notAuthorized(auth);
        }

        const state = await deps.state.get();
        if (state.status === 'disconnected') {
          return UNAVAILABLE;
        }
        return upload(auth.accessToken, state);
      }),
  };
};
