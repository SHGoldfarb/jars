import * as z from 'zod';

// Thin Drive v3 REST calls. Knows nothing about backups: it creates folders and files where it is
// told to, with whatever access token it is given.

// What a caller can act on. `unauthorized` means the token is no longer accepted, `notFound` that
// something the request points at is gone; everything else that went wrong (offline, a 5xx, a
// response of the wrong shape) is `unavailable`, which only ever means "try again later".
export type DriveResult<T> =
  | { kind: 'ok'; value: T }
  | { kind: 'unauthorized' }
  | { kind: 'notFound' }
  | { kind: 'unavailable' };

const DRIVE_API = 'https://www.googleapis.com/drive/v3';

const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

const authorization = (accessToken: string) => ({ Authorization: `Bearer ${accessToken}` });

// Only the method, the URL and the outcome are ever logged, never the request headers, so the
// access token can't end up in a log.
const driveRequest = async <T>(
  url: string,
  init: RequestInit,
  schema: z.ZodType<T>
): Promise<DriveResult<T>> => {
  const request = `${init.method ?? 'GET'} ${url}`;

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    console.error(`Drive request failed: ${request}`, error);
    return { kind: 'unavailable' };
  }

  if (response.status === 401) {
    return { kind: 'unauthorized' };
  }
  if (response.status === 404) {
    return { kind: 'notFound' };
  }
  if (!response.ok) {
    console.error(`Drive request returned ${response.status.toString()}: ${request}`);
    return { kind: 'unavailable' };
  }

  const body = schema.safeParse(await response.json().catch(() => undefined));
  if (!body.success) {
    console.error(`Drive response had an unexpected shape: ${request}`);
    return { kind: 'unavailable' };
  }
  return { kind: 'ok', value: body.data };
};

const CreatedFile = z.object({ id: z.string().min(1) });

// Created in the root of the user's Drive, where they will see it.
export const createFolder = (
  accessToken: string,
  name: string
): Promise<DriveResult<{ id: string }>> =>
  driveRequest(
    `${DRIVE_API}/files?fields=id`,
    {
      method: 'POST',
      headers: { ...authorization(accessToken), 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, mimeType: FOLDER_MIME_TYPE }),
    },
    CreatedFile
  );

const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';

// A `multipart/related` body: the file's metadata as JSON, then its contents. The boundary is
// random, so the contents can't contain it by chance.
const multipartBody = ({
  boundary,
  metadata,
  contents,
  mimeType,
}: {
  boundary: string;
  metadata: object;
  contents: string;
  mimeType: string;
}) =>
  [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    `Content-Type: ${mimeType}`,
    '',
    contents,
    `--${boundary}--`,
    '',
  ].join('\r\n');

// Always a new file, even when one with the same name is already in the folder: Drive allows
// duplicate names, and nothing is ever overwritten. A folder that no longer exists is `notFound`.
export const uploadFile = (
  accessToken: string,
  file: { folderId: string; fileName: string; contents: string; mimeType: string }
): Promise<DriveResult<{ id: string }>> => {
  const boundary = `jars-${crypto.randomUUID()}`;

  return driveRequest(
    `${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=id`,
    {
      method: 'POST',
      headers: {
        ...authorization(accessToken),
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody({
        boundary,
        metadata: { name: file.fileName, parents: [file.folderId] },
        contents: file.contents,
        mimeType: file.mimeType,
      }),
    },
    CreatedFile
  );
};
