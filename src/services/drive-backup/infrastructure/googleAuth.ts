import { createTokenRequester, loadGoogleIdentity } from 'src/lib/googleIdentity';
import type { AuthResult, GoogleAuth } from '../domain/ports';
import type { DriveBackupConfig } from './config';

// Only files and folders the app creates itself, which is all a backup needs.
const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

// A token this close to expiring could lapse mid-upload, so a new one is requested instead.
const EXPIRY_MARGIN_MS = 60 * 1000;

interface CachedToken {
  accessToken: string;
  expiresAtMs: number;
}

// The token lives in this closure for the session and nowhere else: never in storage, never in a
// log. Reloading the app forgets it, and the next click asks Google again.
export const createGoogleAuth = ({ clientId }: DriveBackupConfig): GoogleAuth => {
  let requestToken: ReturnType<typeof createTokenRequester> | null = null;
  let cached: CachedToken | null = null;

  const load = async (): Promise<boolean> => {
    if (requestToken === null) {
      const identity = await loadGoogleIdentity();
      if (identity !== null) {
        requestToken = createTokenRequester(identity, { clientId, scope: DRIVE_FILE_SCOPE });
      }
    }
    return requestToken !== null;
  };

  // Not `async`: the popup has to open within this call, before it returns.
  const authorize = (hint?: string): Promise<AuthResult> => {
    if (cached !== null && cached.expiresAtMs - Date.now() > EXPIRY_MARGIN_MS) {
      return Promise.resolve({ kind: 'ok', accessToken: cached.accessToken });
    }
    if (requestToken === null) {
      return Promise.resolve({ kind: 'unavailable' });
    }

    return requestToken(hint).then((token): AuthResult => {
      switch (token.kind) {
        case 'ok':
          cached = { accessToken: token.accessToken, expiresAtMs: token.expiresAtMs };
          return { kind: 'ok', accessToken: token.accessToken };
        case 'cancelled':
          return { kind: 'cancelled' };
        case 'failed':
          return { kind: 'unavailable' };
      }
    });
  };

  const discardToken = () => {
    cached = null;
  };

  return { load, authorize, discardToken };
};
