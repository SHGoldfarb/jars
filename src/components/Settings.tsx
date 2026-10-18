import { useId, useState } from 'react';
import { Checkbox } from 'components/ui/checkbox';
import { Label } from 'components/ui/label';
import { useDataManagement } from 'src/hooks/useDataManagement';
import { DriveBackupSettings } from './DriveBackupSettings';
import { SettingsAction } from './SettingsAction';

const replacesAllData = 'Replaces all current data. This cannot be undone.';
const clearAllDataWarning = 'All current data is permanently lost and cannot be recovered.';
const replacesAllDataConfirmation = 'This replaces all current data and it cannot be recovered.';

export const Settings = () => {
  const {
    status,
    createBackup,
    exportMovementsCsv,
    restoreFromBackup,
    importMoneyManagerExcel,
    clearAllData,
  } = useDataManagement();
  const [archiveEmptyJars, setArchiveEmptyJars] = useState(true);
  const archiveEmptyJarsId = useId();

  // A download either happens or it doesn't; there is nothing of the user's to lose either way,
  // so a failure is logged rather than reported next to the destructive actions' messages.
  const handleDownload = async (download: () => Promise<void>, failureMessage: string) => {
    try {
      await download();
    } catch (error) {
      console.error(failureMessage, error);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 p-6">
      <SettingsAction
        kind="button"
        title="Create backup"
        description="Downloads a JSON file with all your accounts, jars, categories and movements."
        onAction={() => {
          void handleDownload(createBackup, 'Failed to create backup:');
        }}
      />
      <DriveBackupSettings />
      <SettingsAction
        kind="file"
        title="Load from backup"
        description="Restores a JSON backup created by this app."
        warning={replacesAllData}
        accept="application/json,.json"
        confirmation={replacesAllDataConfirmation}
        onFile={(file) => {
          void restoreFromBackup(file);
        }}
      />
      <SettingsAction
        kind="button"
        title="Export to CSV"
        description="Downloads your movements as a spreadsheet file."
        onAction={() => {
          void handleDownload(exportMovementsCsv, 'Failed to export to CSV:');
        }}
      />
      <SettingsAction
        kind="file"
        title="Import from Money Manager Excel"
        description="Imports an Excel file exported by the Money Manager app."
        warning={replacesAllData}
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        confirmation={replacesAllDataConfirmation}
        options={
          <Label htmlFor={archiveEmptyJarsId} className="font-normal">
            <Checkbox
              id={archiveEmptyJarsId}
              checked={archiveEmptyJars}
              onCheckedChange={(checked) => {
                setArchiveEmptyJars(checked === true);
              }}
            />
            Archive jars with zero balance
          </Label>
        }
        onFile={(file) => {
          void importMoneyManagerExcel(file, { archiveEmptyJars });
        }}
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
