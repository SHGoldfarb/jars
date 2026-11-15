import { XIcon } from 'lucide-react';
import { Button } from 'src/components/ui/button';

export const FormFieldClearButton = ({
  label,
  onClear,
}: {
  // The label of the field it clears, so the button announces what it empties.
  label: string;
  onClear: () => void;
}) => (
  <Button
    type="button"
    variant="ghost"
    size="icon"
    aria-label={`Clear ${label.toLowerCase()}`}
    onClick={onClear}
  >
    <XIcon />
  </Button>
);
