import { useId, useState } from 'react';
import { XIcon } from 'lucide-react';
import { Button } from 'components/ui/button';
import { Checkbox } from 'components/ui/checkbox';
import { Label } from 'components/ui/label';
import { cn } from 'src/lib/utils';
import { useDataManagement } from 'src/hooks/useDataManagement';
import { DriveBackupSettings } from './DriveBackupSettings';
import { SettingsAction } from './SettingsAction';
import { SettingsSection } from './SettingsSection';

const replacesAllData = 'Replaces all current data. This cannot be undone.';
const clearAllDataWarning = 'All current data is permanently lost and cannot be recovered.';
const replacesAllDataConfirmation = 'This replaces all current data and it cannot be recovered.';

export const Settings = () => {
  const {
    status,
    dismissStatus,
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
    <div className="mx-auto flex w-full max-w-lg flex-col gap-8 p-4 pt-6">
      <SettingsSection title="Backup">
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
      </SettingsSection>
      <SettingsSection title="Import and export">
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
      </SettingsSection>
      <SettingsSection title="Danger zone" danger>
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
      </SettingsSection>
      {/* Floats over the bottom of the page - above the phone tab bar - so the outcome of an
          action is seen wherever on the page it was started. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 sm:bottom-6">
        {/* The alert stays in the page while empty, so assistive technology announces each
            message as it arrives; only the pill around it comes and goes. */}
        <div
          className={cn(
            'flex items-center gap-1',
            status && 'pointer-events-auto rounded-lg border bg-popover py-1 pr-1 pl-4 shadow-lg'
          )}
        >
          <div role="alert" className="text-xs/relaxed">
            {status ? (
              <p
                className={status.kind === 'error' ? 'text-destructive' : 'text-popover-foreground'}
              >
                {status.message}
              </p>
            ) : null}
          </div>
          {status ? (
            <Button variant="ghost" size="icon" aria-label="Dismiss" onClick={dismissStatus}>
              <XIcon />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
