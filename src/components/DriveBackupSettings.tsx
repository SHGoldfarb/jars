import { Button } from 'components/ui/button';
import { Card, CardContent, CardHeader } from 'components/ui/card';
import { useDriveBackup } from 'src/hooks/useDriveBackup';
import { formatDateISO } from 'src/presentation/formatters/dateFormatters';

const TITLE = 'Google Drive backup';

const lastBackupText = (lastBackupAtISO: string | null) =>
  lastBackupAtISO === null ? 'No backup yet.' : `Last backup ${formatDateISO(lastBackupAtISO)}.`;

export const DriveBackupSettings = () => {
  const drive = useDriveBackup();
  if (drive === null) {
    return null;
  }
  const { ready, status, error, connect } = drive;

  return (
    <Card role="region" aria-label={TITLE} size="sm">
      <CardHeader>
        <p className="text-xs/relaxed text-muted-foreground">
          Keeps a copy of your backup in a jars folder in your Google Drive.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-3">
        {status === null ? null : status.kind === 'disconnected' ? (
          // Disabled until Google's script has loaded: the popup has to open inside the click.
          <Button
            disabled={!ready}
            onClick={() => {
              void connect();
            }}
          >
            Setup backup to Google Drive
          </Button>
        ) : (
          <p className="text-xs/relaxed">
            Backing up to the jars folder in {status.accountEmail}'s Google Drive.{' '}
            {lastBackupText(status.lastBackupAtISO)}
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
