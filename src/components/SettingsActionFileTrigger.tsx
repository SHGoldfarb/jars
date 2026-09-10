import { useState, type ChangeEvent } from 'react';
import { Button } from 'components/ui/button';
import { SettingsActionConfirm } from './SettingsActionConfirm';

export const SettingsActionFileTrigger = ({
  title,
  accept,
  confirmation,
  onFile,
}: {
  title: string;
  accept: string;
  confirmation?: string;
  onFile: (file: File) => void;
}) => {
  // A picked file waits here until the user confirms, so nothing runs on the strength of the
  // file picker alone.
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (confirmation) {
        setPendingFile(file);
      } else {
        onFile(file);
      }
    }
    // Reset so picking the same file again still fires a change event.
    event.target.value = '';
  };

  const handleConfirm = () => {
    if (pendingFile) {
      onFile(pendingFile);
    }
  };

  return (
    <>
      <Button asChild variant="destructive">
        <label>
          {title}
          <input type="file" accept={accept} className="sr-only" onChange={handleChange} />
        </label>
      </Button>
      {confirmation ? (
        <SettingsActionConfirm
          title={title}
          confirmation={confirmation}
          open={pendingFile !== null}
          onOpenChange={(open) => {
            if (!open) {
              setPendingFile(null);
            }
          }}
          onConfirm={handleConfirm}
        />
      ) : null}
    </>
  );
};
