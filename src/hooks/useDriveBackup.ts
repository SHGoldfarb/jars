import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { driveBackup, type DriveBackupResult } from 'src/services/drive-backup';

const STATUS_KEY = ['driveBackup.status'];

const UNAVAILABLE_MESSAGE = "Couldn't reach Google Drive. Try again when you're online.";

// `null` in a build without a Google client id: there is no Drive backup to show.
export const useDriveBackup = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Google's script is only loaded once Settings is open, so a normal app open never contacts
  // Google. The button waits for it: the popup has to open inside the click, with nothing loaded
  // in between.
  const { data: ready = false } = useQuery({
    queryKey: ['driveBackup.load'],
    queryFn: () => driveBackup?.load() ?? false,
    enabled: driveBackup !== null,
    staleTime: Infinity,
  });

  // Recomputed every time Settings opens: the data can only change while Settings is closed.
  const { data: status } = useQuery({
    queryKey: STATUS_KEY,
    queryFn: () => driveBackup?.queries.status(new Date()) ?? null,
    enabled: driveBackup !== null,
  });

  // Called straight from the click: `run` starts the command before anything is awaited.
  const handle = async (run: () => Promise<DriveBackupResult>) => {
    setError(null);
    try {
      const result = await run();
      if (result.kind === 'ok') {
        queryClient.setQueryData(STATUS_KEY, result.status);
      } else if (result.kind === 'unavailable') {
        setError(UNAVAILABLE_MESSAGE);
      }
    } catch (failure) {
      // Google's failures come back as values, so a throw is the app's own storage failing.
      console.error('Failed to back up to Google Drive:', failure);
      setError('The backup to Google Drive could not be completed.');
    }
  };

  if (driveBackup === null) {
    return null;
  }
  const { commands } = driveBackup;

  return {
    ready,
    status: status ?? null,
    error,
    connect: () => handle(() => commands.connect()),
    backUpNow: (hint: string) => handle(() => commands.backUpNow(hint)),
  };
};
