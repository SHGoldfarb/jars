import type { ChangeEvent } from 'react';
import { Button } from 'components/ui/button';

export const SettingsActionFileTrigger = ({
  title,
  accept,
  onFile,
}: {
  title: string;
  accept: string;
  onFile: (file: File) => void;
}) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFile(file);
    }
    // Reset so picking the same file again still fires a change event.
    event.target.value = '';
  };

  return (
    <Button asChild variant="destructive">
      <label>
        {title}
        <input type="file" accept={accept} className="sr-only" onChange={handleChange} />
      </label>
    </Button>
  );
};
