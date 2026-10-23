import { Button } from 'components/ui/button';
import { Card, CardContent, CardHeader } from 'components/ui/card';
import { useDriveBackup } from 'src/hooks/useDriveBackup';
import { formatDateISO, formatTimeAgo } from 'src/presentation/formatters/dateFormatters';

const TITLE = 'Google Drive backup';

// A due backup waits for a click: without a server, the sign-in from last time has always expired
// by now, and opening Google's popup unasked would be too intrusive.
const duePromptText = (lastBackupAtISO: string | null) =>
  lastBackupAtISO === null
    ? 'No backup has been made yet. Reconnect Google Drive to back up.'
    : `Your last backup was ${formatTimeAgo(lastBackupAtISO, new Date())}. Reconnect Google Drive to back up.`;

export const DriveBackupSettings = () => {
  const drive = useDriveBackup();
  if (drive === null) {
    return null;
  }
  const { ready, status, error, connect, backUpNow } = drive;

  return (
    <Card role="region" aria-label={TITLE} size="sm">
      <CardHeader>
        <p className="text-xs/relaxed text-muted-foreground">
          Keeps a copy of your backup in a jars folder in your Google Drive.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-3">
        {/* The buttons are disabled until Google's script has loaded: the popup has to open
            inside the click. */}
        {status === null ? null : status.kind === 'disconnected' ? (
          <Button
            disabled={!ready}
            onClick={() => {
              void connect();
            }}
          >
            Setup backup to Google Drive
          </Button>
        ) : status.kind === 'due' ? (
          <>
            <p className="text-xs/relaxed">{duePromptText(status.lastBackupAtISO)}</p>
            <Button
              disabled={!ready}
              onClick={() => {
                void backUpNow(status.accountEmail);
              }}
            >
              Reconnect Google Drive
            </Button>
          </>
        ) : (
          <p className="text-xs/relaxed">
            Backing up to the jars folder in {status.accountEmail}'s Google Drive. Last backup{' '}
            {formatDateISO(status.lastBackupAtISO)}.
          </p>
        )}
        {error ? (
          <p role="alert" className="text-xs/relaxed text-destructive">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
};
