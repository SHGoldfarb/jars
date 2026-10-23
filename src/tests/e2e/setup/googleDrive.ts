import { test as base, type Request, type Route } from '@playwright/test';
import * as z from 'zod';

// Google, faked at the network boundary: the app runs its real code against a stand-in for
// Google's sign-in script and for the Drive API, and nothing in the app knows it is under test.
// Every test gets it, so no test ever reaches the real Google.

const GOOGLE_HOSTS = new Set(['accounts.google.com', 'www.googleapis.com']);

export const FAKE_ACCOUNT_EMAIL = 'someone@example.com';

// Stands in for https://accounts.google.com/gsi/client. Asking for a token calls back into the
// test, which decides what the "popup" does; the scope granted is the one asked for.
const FAKE_SCRIPT = `
window.google = { accounts: { oauth2: { initTokenClient: (config) => ({
  requestAccessToken: (override) => {
    window.__fakeGooglePopup(override && override.login_hint).then((outcome) => {
      if (outcome === 'grant') {
        config.callback({ access_token: 'fake-token', expires_in: 3599, scope: config.scope });
      } else {
        config.error_callback({ type: 'popup_closed' });
      }
    });
  },
}) } } };
`;

const FolderMetadata = z.object({ name: z.string(), mimeType: z.string() });
const UploadMetadata = z.object({ name: z.string(), parents: z.tuple([z.string()]) });

export interface DriveFolder {
  id: string;
  name: string;
  mimeType: string;
}

export interface DriveUpload {
  folderId: string;
  name: string;
  contents: string;
}

type PopupOutcome = 'grant' | 'close';

// The two parts of a `multipart/related` upload: the metadata, then the file's contents.
const readUpload = (request: Request): { metadata: unknown; contents: string } => {
  const boundary = /boundary=(.+)$/.exec(request.headers()['content-type'] ?? '')?.[1];
  const body = request.postDataBuffer()?.toString('utf8') ?? '';
  if (boundary === undefined) {
    throw new Error('The upload has no multipart boundary.');
  }
  const [, metadataPart = '', contentsPart = ''] = body.split(`--${boundary}`);
  const partBody = (part: string) => part.slice(part.indexOf('\r\n\r\n') + 4, -2);
  return { metadata: JSON.parse(partBody(metadataPart)), contents: partBody(contentsPart) };
};

const createGoogleDriveFake = () => {
  let popupOutcome: PopupOutcome = 'grant';
  let reachable = true;
  let scriptGate: Promise<void> = Promise.resolve();
  const popupHints: (string | undefined)[] = [];
  const requests: string[] = [];
  const folders: DriveFolder[] = [];
  const uploads: DriveUpload[] = [];

  const json = (route: Route, status: number, body: object) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

  const handle = async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    requests.push(`${request.method()} ${url.hostname}${url.pathname}`);

    if (url.hostname === 'accounts.google.com' && url.pathname === '/gsi/client') {
      await scriptGate;
      return route.fulfill({ contentType: 'text/javascript', body: FAKE_SCRIPT });
    }
    if (!reachable || url.hostname !== 'www.googleapis.com') {
      return route.abort('internetdisconnected');
    }

    if (request.method() === 'GET' && url.pathname === '/drive/v3/about') {
      return json(route, 200, { user: { emailAddress: FAKE_ACCOUNT_EMAIL } });
    }
    if (request.method() === 'POST' && url.pathname === '/drive/v3/files') {
      const metadata = FolderMetadata.parse(request.postDataJSON());
      const folder = { id: `folder-${(folders.length + 1).toString()}`, ...metadata };
      folders.push(folder);
      return json(route, 200, { id: folder.id });
    }
    if (request.method() === 'POST' && url.pathname === '/upload/drive/v3/files') {
      const { metadata, contents } = readUpload(request);
      const { name, parents } = UploadMetadata.parse(metadata);
      if (!folders.some((folder) => folder.id === parents[0])) {
        return json(route, 404, { error: { code: 404 } });
      }
      uploads.push({ folderId: parents[0], name, contents });
      return json(route, 200, { id: `file-${uploads.length.toString()}` });
    }
    return json(route, 400, { error: { code: 400 } });
  };

  return {
    handle,
    popup: (hint: string | undefined) => {
      popupHints.push(hint);
      return popupOutcome;
    },
    fake: {
      // What the next sign-in popups do: sign in, or get closed by the user.
      setPopup: (outcome: PopupOutcome) => {
        popupOutcome = outcome;
      },
      // An unreachable Google: every Drive request fails as if offline.
      setReachable: (value: boolean) => {
        reachable = value;
      },
      // Holds back Google's script until the returned function is called.
      holdScript: () => {
        let release = () => {
          // Replaced below
        };
        scriptGate = new Promise((resolve) => {
          release = resolve;
        });
        return release;
      },
      // Every request to a Google host, in order, as `METHOD host/path`.
      requests: () => [...requests],
      // The account hint each sign-in popup was opened with, in order.
      popupHints: () => [...popupHints],
      folders: () => [...folders],
      uploads: () => [...uploads],
    },
  };
};

export type GoogleDriveFake = ReturnType<typeof createGoogleDriveFake>['fake'];

export const test = base.extend<{ googleDrive: GoogleDriveFake }>({
  // The app's service worker controls a page once it is reloaded, and in WebKit what it fetches
  // never reaches `page.route`: Google's real script would load around the fake. No test is about
  // the service worker, so it is blocked for all of them.
  serviceWorkers: 'block',
  googleDrive: [
    async ({ page }, use) => {
      const google = createGoogleDriveFake();
      await page.exposeFunction('__fakeGooglePopup', google.popup);
      await page.route((url) => GOOGLE_HOSTS.has(url.hostname), google.handle);
      await use(google.fake);
    },
    { auto: true },
  ],
});
