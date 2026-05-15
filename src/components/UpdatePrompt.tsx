import { useState } from 'react';
import { Button } from 'components/ui/button';

import { registerSW } from 'virtual:pwa-register';

export const UpdatePrompt = () => {
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  const updateSW = registerSW({
    onNeedRefresh() {
      setNeedsRefresh(true);
    },
    //   onOfflineReady() {},
  });

  const handleUpdate = async () => {
    setLoading(true);
    await updateSW();
    setLoading(false);
  };

  if (!needsRefresh || dismissed) {
    return null;
  }

  return (
    <div className="flex flex-col items-center">
      <p>New version available!</p>
      <div>
        <Button
          onClick={() => {
            void handleUpdate();
          }}
        >
          {loading ? 'Updating...' : 'Update'}
        </Button>
        <Button
          onClick={() => {
            setDismissed(true);
          }}
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
};
