import type { DriveBackupState } from './state';

export interface DriveBackupStateRepository {
  get(): Promise<DriveBackupState>;
  save(state: DriveBackupState): Promise<void>;
}

export type AuthResult =
  | { kind: 'ok'; accessToken: string }
  | { kind: 'cancelled' }
  | { kind: 'unavailable' };

export interface GoogleAuth {
  // Resolves `true` once a token can be requested. Until then `authorize` is `unavailable`.
  load(): Promise<boolean>;
  // May open Google's popup, so it must be called straight from a click, with nothing awaited
  // before it.
  authorize(hint?: string): Promise<AuthResult>;
  // For a token Drive has rejected: the next `authorize` asks for a fresh one.
  discardToken(): void;
}
