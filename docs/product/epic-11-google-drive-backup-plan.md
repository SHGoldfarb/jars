# Plan — Epic 11: Google Drive backup

**Target:** `docs/product/epics.md:292`–`305` — the whole epic.

**Shape of this plan:** this plan is not split into vertical slices. It is built bottom-up, in small
steps, each one sized to be read in a single sitting. Pure primitives come first, then adapters, then
orchestration, and the UI comes last. Each step:

- touches one layer and, where possible, one file plus its types;
- ends green (`pnpm exec tsc -b`, `pnpm lint`, `pnpm format:check`, `pnpm test`);
- leaves the app's behaviour unchanged until step 12. Steps 1–11 add code that nothing user-visible
  calls yet.

That last point is the tradeoff of this shape. Steps 1–11 can't be e2e-tested because no screen
reaches them yet, so their review rests on types, boundary schemas and reading the code. The e2e
tests land with the steps that put each behaviour on screen (12–13), and they cover all five ACs.
Per `CONTRIBUTING.md`, no unit tests are added for logic those flows exercise.

---

## Decisions taken up front

### 1. No server and no automatic sign-in: when a backup is due, it takes one click

Jars stays a static PWA, and the app never navigates the user away or opens a popup on its own.
That leaves one kind of credential: a Google **access token that lasts one hour**, obtained when
the user clicks. There's no client secret, so there's no refresh token.

A backup is due at most once every 24h, so the token from the last backup has always expired by
the time the next one is due. Every due backup therefore needs one click. In practice, ACs `297`
and `300` become one prompt:

- **On open**, the app checks locally whether a backup is due (more than 24h since the last one,
  and the data's fingerprint has changed). This makes no network call and doesn't show Google's
  sign-in.
- **If it is due**, Settings shows "Your last backup was <relative time>. Reconnect Google Drive to
  back up." with a **"Reconnect Google Drive"** button.
- **The click** opens Google's token popup with the stored account as a hint. If the user is still
  signed in and has already consented, the popup closes on its own. Then the backup is uploaded
  and the prompt disappears.

AC `297`'s wording ("backs up every time the app opens") can't be met without a server or an
automatic redirect, and both were ruled out. Step 15 proposes rewording it to match.

The token is kept in memory only, for the length of the session. **No credential is ever stored on
the device.**

### 2. Google Identity Services' token popup, loaded on Settings mount

Every authorization now starts with a click, so the popup token client
(`google.accounts.oauth2.initTokenClient`) is the simplest fit. The user never leaves the app, and
there's no redirect handshake, URL fragment or return path to handle.

`requestAccessToken()` has to run synchronously inside the click handler, or the browser blocks the
popup. So the Drive card starts loading `https://accounts.google.com/gsi/client` when it mounts,
and keeps its button disabled until the script is ready. The script never loads at boot, so users
who don't use the feature never load it, and a normal app open never contacts Google.

Because nothing may be awaited before the popup opens, two things follow:

- The commands can't read the stored account email from IndexedDB to use as the popup's hint. The
  card already holds it in the status it read on mount, so it passes the hint in.
- A command can't open a second popup partway through, after it has awaited a request. A token
  Drive rejects is discarded, and the next click asks for a fresh one.

### 3. Scope `drive.file`, with a `jars` folder the app creates

AC `298` wants a folder the user can see, so we use `drive.file` and not `drive.appdata` (a hidden
folder). With `drive.file` the app can only see files and folders it created itself. That is
exactly what it needs, and Google classes the scope as non-sensitive, so no security audit is
required.

- The folder's id is stored locally once it is created. A later backup uploads into that id
  directly.
- If the upload returns `404` (the user deleted the folder or emptied it from the trash), the app
  creates a new `jars` folder, stores its id and retries once.
- If the user renames or moves the folder, the stored id still works, so backups follow it.

When connecting, the app also reads the account's email from Drive's
`about?fields=user(emailAddress)`. It is stored and passed as the popup's `hint`, so the right
account is preselected when several are signed in. It also lets Settings show which account the
backups go to.

### 4. The file uploaded is byte-for-byte the downloaded backup

AC `299`: the upload is `dataManagement.commands.createBackup()`'s `DataFile`, with the same
`fileName` and the same `contents`. The Drive code never builds JSON of its own. Two backups never
share a calendar day (they are at least 24h apart), so `jars-backup-YYYY-MM-DD.json` stays unique
in practice. Drive tolerates duplicate names anyway.

### 5. "Different from the last snapshot" is a fingerprint of `data`, not of the file

The file contains `createdAtISO`, so two backups of the same data never have equal contents. The
comparison uses a SHA-256 of `JSON.stringify(backup.data)` instead. `createBackup` returns that
fingerprint alongside the file, so the hash and the upload come from the same read.
`snapshot()` returns the tables in primary-key order, so the same data hashes to the same value.
If that ordering ever changed, the worst case would be one unnecessary prompt, never a skipped
backup.

### 6. A new bounded context: `src/services/drive-backup/`

`data-management` is about file formats and never talks to the network. Drive backup is about
syncing with an outside service, with its own state, schedule and failure modes. It gets its own
context, which consumes `data-management`'s barrel the same way `balances` consumes `finance`'s.

```
src/services/drive-backup/
  index.ts                     driveBackup = { commands, queries }
  domain/
    state.ts                   DriveBackupState union + schema
    schedule.ts                isBackupDue
    ports.ts                   DriveBackupStateRepository, GoogleAuth
  application/
    commands.ts                connect, backUpNow
    queries.ts                 status (state + due)
  infrastructure/
    config.ts                  env parsing
    stateDb.ts                 Dexie store for DriveBackupState
    googleAuth.ts              token popup + in-memory token cache
```

The Drive REST calls and the Google script loader don't know anything about the domain, so they go
in `src/lib/` (steps 6–9).

### 7. Backup state lives in its own Dexie database, outside the finance snapshot

The connection (folder id, account email, last backup time, last fingerprint) is not finance data:

- It must not be included in a backup file.
- "Load from backup" and "Clear all data" must not disconnect Drive, and they don't need to know
  that it exists.

So it goes in a separate database, `JarsDriveBackup`, with a single row that is zod-parsed on read.
That keeps `DB_SCHEMA_VERSION` and `FinanceSnapshot` unchanged. After "Clear all data" the
fingerprint changes, so the next due backup uploads an empty snapshot **as a new file**. Earlier
files are never overwritten or deleted, so nothing in Drive is lost.

### 8. Stored state is two cases; "due" is derived, never stored

```ts
type DriveBackupState =
  | { status: 'disconnected' }
  | {
      status: 'connected';
      folderId: string;
      accountEmail: string;
      lastBackup: { atISO: string; fingerprint: string } | null;
    };

type DriveBackupStatus =
  | { kind: 'disconnected' }
  | { kind: 'upToDate'; accountEmail: string; lastBackupAtISO: string }
  | { kind: 'due'; accountEmail: string; lastBackupAtISO: string | null };
```

There's no stored `needsReconnect`. Expired auth is the normal case (decision 1), and a revoked
grant is handled by the popup itself, which shows the consent screen again. Click results are
returned as values, the same way `data-management` does it (`CommandResult`):

- `cancelled` (the user closed the popup, declined, unticked the Drive permission, or the browser
  blocked the popup) → no message, and the prompt stays. The next click asks for consent again.
- `unavailable` (offline, or a `5xx`) → "Couldn't reach Google Drive. Try again when you're
  online.", and the prompt stays.
- `ok` → `lastBackup` is saved, and the status becomes `upToDate`.

### 9. Settings computes the status on mount

`status()` reads the state and the current fingerprint, then applies `isBackupDue`. Settings shows
no finance data, and the user can only change finance data by leaving Settings, so computing the
status when the card mounts is enough. After a click, the command's result updates the card
directly.

### 10. Configuration comes from `import.meta.env`, parsed once

`VITE_GOOGLE_CLIENT_ID` is a public value. A `.env` file with a placeholder is committed so dev and
e2e tests run without setup. The real value goes in `.env.production`. If the value is missing, the
config parses to `null` and the Drive card isn't rendered. A build without the value has no
half-working button.

### 11. E2E tests fake Google at the network boundary, with no test-only code paths

A new fixture, `src/tests/e2e/setup/googleDrive.ts`, uses `page.route` to fake:

- `https://accounts.google.com/gsi/client`, with a small script whose
  `initTokenClient({ callback, error_callback })` returns
  `{ requestAccessToken: () => callback({ access_token: 'fake', expires_in: 3599 }) }`. A test can
  switch it to `error_callback({ type: 'popup_closed' })`.
- `www.googleapis.com/drive/v3/about`, `/drive/v3/files` (create folder) and
  `/upload/drive/v3/files` (upload).

Every request to a Google host is recorded, so tests can assert on folders, upload bodies, how
many authorizations happened, and that nothing contacted Google on open. Time is controlled with
`page.clock`. Testing "the app opens" requires `page.reload()`. That is a deliberate exception to
the "navigate by clicking" rule: reloading _is_ the use case being tested.

---

## Steps

Every step lists its **review focus**: the one thing a reviewer should actually check.

### Step 1 — `src/lib/hash.ts`: `sha256Hex(text)`

A WebCrypto wrapper (`crypto.subtle.digest` → hex). It has no domain knowledge.

**Review focus:** UTF-8 encoding via `TextEncoder`, and lowercase hex with zero padding.

### Step 2 — `createBackup` also returns a fingerprint

In `data-management/application/commands.ts`, `createBackup` returns
`DataFile & { fingerprint: string }`, where the fingerprint is `sha256Hex(JSON.stringify(data))`
(decision 5). Export a `BackupFile` type from the barrel. `useDataManagement` ignores the new field.

**Review focus:** the hash covers `data` only, not `createdAtISO`. The download is unchanged.

### Step 3 — Config: env schema and the committed `.env`

`drive-backup/infrastructure/config.ts` zod-parses `import.meta.env` into `{ clientId } | null`
(decision 10). Add the typings to `src/vite-env.d.ts` and commit `.env` with a placeholder.

**Review focus:** a missing or empty value gives `null`, not a throw.

### Step 4 — Domain: state union and `isBackupDue`

Add `domain/state.ts` (decision 8's `DriveBackupState` plus its zod schema, and
`DriveBackupStatus`) and `domain/schedule.ts`:

```ts
export const isBackupDue = (input: {
  lastBackup: { atISO: string; fingerprint: string } | null;
  fingerprint: string;
  now: Date;
}): boolean => …; // null → true; otherwise > 24h AND fingerprint differs
```

**Review focus:** the 24h boundary is strict ("more than"), and both conditions must hold.

### Step 5 — Persistence: `JarsDriveBackup` store

`infrastructure/stateDb.ts` holds one table with a single key `'state'`. It exposes `get()`, which
parses the row and falls back to `disconnected` when the row is missing or invalid, and `save()`.
The repository interface goes in `domain/ports.ts`.

**Review focus:** a corrupt row is logged and treated as `disconnected`, not thrown. It is a
separate database from `JarsMainDatabase` (decision 7).

### Step 6 — `src/lib/googleDrive.ts`: create folder

`createFolder(accessToken, name)` → `DriveResult<{ id }>`. The `DriveResult` union is
`ok | unauthorized | notFound | unavailable` (unavailable covers network errors and 5xx).
Responses are zod-parsed.

**Review focus:** mapping HTTP status codes to the result union. The access token never appears
in log output.

### Step 7 — `src/lib/googleDrive.ts`: upload file

`uploadFile(accessToken, { folderId, fileName, contents, mimeType })` uses
`uploadType=multipart`, reusing step 6's result union.

**Review focus:** the multipart body (boundary, metadata part with `parents: [folderId]`, then
the media part).

### Step 8 — `src/lib/googleDrive.ts`: account email

`accountEmail(accessToken)` → `DriveResult<string>`, from `about?fields=user(emailAddress)`.

**Review focus:** the `fields` mask asks for nothing beyond the email.

### Step 9 — `src/lib/googleIdentity.ts`: script loader and token client

- `loadGoogleIdentity()` adds the script tag once, and resolves when
  `window.google.accounts.oauth2.initTokenClient` exists, checking the shape at runtime.
- `createTokenRequester(identity, { clientId, scope })` → a function
  `(hint?) => Promise<TokenResult>`. It takes the loaded `identity` from `loadGoogleIdentity()`, so
  it can't be called before the script is there. `TokenResult` is
  `ok { accessToken, expiresAtMs } | cancelled | failed`. It opens the popup before anything is
  awaited, so it must be called synchronously from a click (decision 2). The hint is passed as
  `login_hint` (`hint` is deprecated).
- Add `@types/google.accounts` as a dev dependency.

**Review focus:** the script's shape and Google's response are both zod-checked at runtime, not
cast. `popup_closed`, `popup_failed_to_open`, `access_denied` and a token without the requested
scope all map to `cancelled`.

### Step 10 — `infrastructure/googleAuth.ts`: the `GoogleAuth` port

`load()` loads the script through step 9 and keeps the identity; the card calls it on mount and
enables its button once it resolves. `authorize(hint?)` returns the in-memory token if it has more
than 60s left, and otherwise requests a new one through step 9, synchronously. It returns
`ok | cancelled | unavailable`: `failed`, or a script that never loaded, is `unavailable`.
`discardToken()` forgets the cached token.

**Review focus:** the token is kept in a module variable only, never written to `sessionStorage`,
IndexedDB or a log.

### Step 11 — Application: `connect`, `backUpNow`, `status`

`application/commands.ts` and `queries.ts`, wired from ports through the barrel:

- **`connect()`**: authorize → create the `jars` folder → read the email → save `connected` →
  upload the first backup.
- **`backUpNow(hint)`**: authorize with the hint the card passes in (decision 2) →
  `createBackup()` → upload. On `notFound`, create a new folder and retry once. On
  `unauthorized`, discard the cached token and return `unavailable`; the next click opens the
  popup for a fresh token. On success, save `lastBackup`.
- **`status(now)`**: decision 8's `DriveBackupStatus`, computed from the state and a fresh
  fingerprint.
- **Single flight:** a module-level in-progress promise, so a double click can't upload twice.

**Review focus:** `authorize` is the first call in both commands, with nothing awaited before it.
State is never written before the upload succeeds. `backUpNow` uploads even when the backup isn't
due: the click is the user's decision.

### Step 12 — Settings: "Setup backup to Google Drive" (ACs `296`, `298`, `299`)

Add `useDriveBackup` (loads the script on mount, reads `status` on mount, and runs the commands)
and `DriveBackupSettings.tsx`, with one component per file as `CONTRIBUTING.md` asks.

- **Disconnected:** a "Setup backup to Google Drive" button.
- **Up to date:** "Backing up to the jars folder in `<email>`'s Google Drive. Last backup
  `<date>`."
- **Not rendered** when config is `null`.

E2E — `driveBackup.spec.ts` + the fixture (decision 11), with `test.slow()` because it seeds data,
connects and downloads:

- **Setup creates the folder and uploads the backup:** seed data, then click the button. Expect
  exactly one folder created, named `jars` with the folder mime type, and one upload into it. The
  uploaded body is equal to the file downloaded from "Create backup" at the same pinned clock
  time, and its `data.accounts` names match the seeded ones (hardcoded). The card shows the
  account email.

**Review focus:** the button is disabled until the Google script has loaded.

### Step 13 — Backup-due prompt (ACs `297`, `300`)

When the status is `due`, the card shows decision 1's prompt and the "Reconnect Google Drive"
button, which runs `backUpNow()`. It also shows the `unavailable` message when a click fails.

E2E, added to `driveBackup.spec.ts` (one use case, so one test):

- Connect at T. Reload at T+23h and open Settings → no prompt.
- Reload at T+25h without changing data → no prompt.
- Create a transaction, then reload at T+25h → **no request to any Google host before Settings is
  opened**, and Settings shows the prompt.
- Make the fake popup report `popup_closed`, then click → no upload, the prompt stays, and no error
  is shown.
- Make Drive unreachable, then click → no upload, the prompt stays, and the "Couldn't reach" message
  is shown.
- Restore the fakes and click → one upload into the **same** folder id, and the card shows "Up to
  date".

**Review focus:** opening the app never contacts Google. Only a click does.

### Step 14 — Google Cloud setup (setup only, no code)

A checklist in the PR description, not in the repo:

- Create the OAuth client (type: Web application). Add the production origin and
  `http://localhost:5173` as **authorized JavaScript origins**. The popup flow needs no redirect
  URIs.
- Add only the `drive.file` scope to the consent screen.
- Publish the consent screen to "In production". While it is in "Testing" status, only listed test
  users can connect.
- Fill in `.env.production` with the client id.

### Step 15 — Docs

Requested as part of this epic, so it doesn't count as an agent editing docs on its own initiative
(`AGENTS.md`):

- `docs/product/epics.md`:
  - **Proposed AC `297` rewording, for the owner to approve:** "When the app opens more than 24
    hours after the last backup and the data has changed, Settings prompts to reconnect, and one
    click backs up". Merge AC `300` into it, since they're now the same prompt.
  - Tick the ACs and mark the epic `[DONE]`.
  - Remove "Configure automatic backup to cloud (Google Drive?)" from the Epics Backlog.
- `README.md`: add a **Google Drive backup** entry under "Key features" ("connect once; when a
  backup is due, Settings asks you to reconnect, and one click saves a copy of your data to a
  `jars` folder in your Drive").
- `CONTRIBUTING.md`, "Folder Structure": add `drive-backup/` under `src/services/` ("syncs the
  JSON backup to the user's Google Drive (`application/`, `domain/`, `infrastructure/`)").

**Review focus:** the README and the AC describe the one-click behaviour honestly, and don't
promise backups that happen on their own.

---

## File summary

| Step | New                                                                            | Edited                                                |
| ---- | ------------------------------------------------------------------------------ | ----------------------------------------------------- |
| 1    | `src/lib/hash.ts`                                                              |                                                       |
| 2    |                                                                                | `data-management/application/commands.ts`, `index.ts` |
| 3    | `drive-backup/infrastructure/config.ts`, `.env`                                | `src/vite-env.d.ts`                                   |
| 4    | `drive-backup/domain/state.ts`, `schedule.ts`                                  |                                                       |
| 5    | `drive-backup/infrastructure/stateDb.ts`, `domain/ports.ts`                    |                                                       |
| 6–8  | `src/lib/googleDrive.ts`                                                       |                                                       |
| 9    | `src/lib/googleIdentity.ts`                                                    | `package.json`                                        |
| 10   | `drive-backup/infrastructure/googleAuth.ts`                                    |                                                       |
| 11   | `drive-backup/application/*`, `drive-backup/index.ts`                          |                                                       |
| 12   | `useDriveBackup.ts`, `DriveBackupSettings.tsx`, `driveBackup.spec.ts`, fixture | `Settings.tsx`, `settings.page.ts`                    |
| 13   |                                                                                | `DriveBackupSettings.tsx`, `driveBackup.spec.ts`      |
| 15   |                                                                                | `epics.md`, `README.md`, `CONTRIBUTING.md`            |

## Out of scope

From the epic: restoring from Drive, and encrypting backups. Also left out by this plan:

- **Showing the due prompt outside Settings** (a badge on the Settings nav item, or a banner). AC
  `300` places the prompt on Settings, so a user who rarely opens Settings will rarely back up.
  This is the first follow-up to consider.
- **Disconnect / revoke.** Not in the ACs. Until it's built, the user can revoke access from their
  Google account settings. The next reconnect then shows Google's consent screen again.
- **Retention.** Old files are never deleted. Writing at most one file a day keeps growth small,
  and the app never deleting anything is the safe default while restore doesn't exist yet.
- **Restoring old backups after a schema change.** `Backup.schemaVersion` is
  `z.literal(DB_SCHEMA_VERSION)`, so Drive backups from before a future migration won't restore.
  This doesn't matter until restore is built, but restore will need a migration step.
