import { useState } from 'react';

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
    <div>
      <p>New version available!</p>
      <button
        onClick={() => {
          void handleUpdate();
        }}
      >
        {loading ? 'Updating...' : 'Update'}
      </button>
      <button
        onClick={() => {
          setDismissed(true);
        }}
      >
        Dismiss
      </button>
    </div>
  );
};
