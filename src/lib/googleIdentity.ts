/// <reference types="google.accounts" />
import * as z from 'zod';

// Google Identity Services' popup token client. Knows nothing about Drive or backups: it loads
// Google's script and asks for an access token for whatever scope it is given.

const SCRIPT_URL = 'https://accounts.google.com/gsi/client';

// Holding one is proof the script has loaded, so a token can be requested synchronously.
export interface GoogleIdentity {
  initTokenClient: typeof google.accounts.oauth2.initTokenClient;
}

// The declared types describe a loaded script: TypeScript takes `google.accounts.oauth2` to always
// exist. Whether the script really defined it is only known at runtime, so the global is checked
// against the shape before the declared API is used.
const LoadedScript = z.object({
  google: z.object({
    accounts: z.object({
      oauth2: z.object({
        initTokenClient: z.unknown().refine((value) => typeof value === 'function'),
      }),
    }),
  }),
});

const loadedIdentity = (): GoogleIdentity | null =>
  LoadedScript.safeParse(globalThis).success
    ? { initTokenClient: google.accounts.oauth2.initTokenClient }
    : null;

let loading: Promise<GoogleIdentity | null> | null = null;

// Adds the script tag once. A failed load (offline, blocked) resolves `null` and is forgotten, so
// the next call tries again.
export const loadGoogleIdentity = (): Promise<GoogleIdentity | null> => {
  loading ??= new Promise<GoogleIdentity | null>((resolve) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      const identity = loadedIdentity();
      if (identity === null) {
        console.error('Google Identity Services loaded without the token client.');
      }
      resolve(identity);
    };
    script.onerror = () => {
      console.error('Google Identity Services could not be loaded.');
      resolve(null);
    };
    document.head.appendChild(script);
  }).then((identity) => {
    if (identity === null) {
      loading = null;
      document.querySelector(`script[src="${SCRIPT_URL}"]`)?.remove();
    }
    return identity;
  });
  return loading;
};

export type TokenResult =
  | { kind: 'ok'; accessToken: string; expiresAtMs: number }
  | { kind: 'cancelled' }
  | { kind: 'failed' };

// The declared `TokenResponse` has every field present; a real response carries either a token or
// an `error`, so it is parsed rather than trusted.
const GrantedToken = z.object({
  access_token: z.string().min(1),
  expires_in: z.coerce.number().positive(),
  scope: z.string(),
});

const ErrorResponse = z.object({ error: z.string() });

// Declining is the user's choice, as is closing the popup: neither is a failure to report. A
// popup the browser blocked is treated the same way, as the next click opens it again.
const toTokenResult = (response: unknown, scope: string, requestedAtMs: number): TokenResult => {
  const token = GrantedToken.safeParse(response);
  if (token.success) {
    // The consent screen lets the user untick a scope. A token without it is a decline too.
    return token.data.scope.split(' ').includes(scope)
      ? {
          kind: 'ok',
          accessToken: token.data.access_token,
          expiresAtMs: requestedAtMs + token.data.expires_in * 1000,
        }
      : { kind: 'cancelled' };
  }

  const error = ErrorResponse.safeParse(response);
  if (error.success && error.data.error === 'access_denied') {
    return { kind: 'cancelled' };
  }
  console.error('Google returned no access token:', error.success ? error.data.error : response);
  return { kind: 'failed' };
};

const POPUP_CANCELLED = new Set(['popup_closed', 'popup_failed_to_open']);

// Opens the popup synchronously, then waits for it, so it must be called straight from a click
// handler with nothing awaited before it, or the browser blocks the popup.
export const createTokenRequester =
  (identity: GoogleIdentity, { clientId, scope }: { clientId: string; scope: string }) =>
  (hint?: string): Promise<TokenResult> =>
    new Promise<TokenResult>((resolve) => {
      // Counted from before the popup opened, so the expiry errs early, never late.
      const requestedAtMs = Date.now();
      const client = identity.initTokenClient({
        client_id: clientId,
        scope,
        callback: (response) => {
          resolve(toTokenResult(response, scope, requestedAtMs));
        },
        error_callback: (error) => {
          if (POPUP_CANCELLED.has(error.type)) {
            resolve({ kind: 'cancelled' });
          } else {
            console.error('Google Identity Services failed:', error.type);
            resolve({ kind: 'failed' });
          }
        },
      });
      client.requestAccessToken(hint === undefined ? {} : { login_hint: hint });
    });
