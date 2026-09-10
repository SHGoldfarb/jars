import { useState, type ComponentProps } from 'react';
import { Button } from 'components/ui/button';
import { SettingsActionConfirm } from './SettingsActionConfirm';

export const SettingsActionButtonTrigger = ({
  title,
  variant,
  confirmation,
  onAction,
}: {
  title: string;
  variant: ComponentProps<typeof Button>['variant'];
  confirmation?: string;
  onAction: () => void;
}) => {
  // A destructive action stops at the dialog, so the click alone runs nothing.
  const [confirming, setConfirming] = useState(false);

  if (!confirmation) {
    return (
      <Button variant={variant} onClick={onAction}>
        {title}
      </Button>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        onClick={() => {
          setConfirming(true);
        }}
      >
        {title}
      </Button>
      <SettingsActionConfirm
        title={title}
        confirmation={confirmation}
        open={confirming}
        onOpenChange={setConfirming}
        onConfirm={onAction}
      />
    </>
  );
};
