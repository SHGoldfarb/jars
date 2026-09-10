import { useDataManagement } from 'src/hooks/useDataManagement';
import { SettingsAction } from './SettingsAction';

// Every action gets its behaviour in its own step of the epic; until then the triggers are inert.
const notImplemented = () => undefined;
const notImplementedFile = (_file: File) => undefined;

const replacesAllData = 'Replaces all current data. This cannot be undone.';
const clearAllDataWarning = 'All current data is permanently lost and cannot be recovered.';

export const Settings = () => {
  const { status, createBackup, restoreFromBackup, clearAllData } = useDataManagement();

  const handleCreateBackup = async () => {
    try {
      await createBackup();
    } catch (error) {
      console.error('Failed to create backup:', error);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 p-6">
      <SettingsAction
        kind="button"
        title="Create backup"
        description="Downloads a JSON file with all your accounts, jars, categories and movements."
        onAction={() => {
          void handleCreateBackup();
        }}
      />
      <SettingsAction
        kind="file"
        title="Load from backup"
        description="Restores a JSON backup created by this app."
        warning={replacesAllData}
        accept="application/json,.json"
        confirmation="This replaces all current data and it cannot be recovered."
        onFile={(file) => {
          void restoreFromBackup(file);
        }}
      />
      <SettingsAction
        kind="button"
        title="Export to CSV"
        description="Downloads your movements as a spreadsheet file."
        onAction={notImplemented}
      />
      <SettingsAction
        kind="file"
        title="Import from Money Manager CSV"
        description="Imports a CSV exported by the Money Manager app."
        warning={replacesAllData}
        accept="text/csv,.csv"
        onFile={notImplementedFile}
      />
      <SettingsAction
        kind="button"
        title="Clear all data"
        description="Removes all accounts, jars, categories, transactions, transfers and allocations."
        warning={clearAllDataWarning}
        confirmation={clearAllDataWarning}
        onAction={() => {
          void clearAllData();
        }}
      />
      <div role="alert" className="text-xs/relaxed">
        {status ? (
          <p className={status.kind === 'error' ? 'text-destructive' : 'text-muted-foreground'}>
            {status.message}
          </p>
        ) : null}
      </div>
    </div>
  );
};
