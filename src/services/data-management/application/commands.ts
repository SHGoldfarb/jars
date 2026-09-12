import { csv } from 'src/lib/csv';
import { xlsx, type XlsxCell } from 'src/lib/xlsx';
import { financeCommands, financeQueries, DB_SCHEMA_VERSION } from 'src/services/finance';
import { Backup, backupFileName, parseBackupFile } from '../domain/backup';
import { moneyManager } from '../domain/moneyManager';
import { movementsCsvFileName, toMovementsCsvRows } from '../domain/movementsCsv';
import type { CommandResult, ParseResult } from '../domain/result';

export interface DataFile {
  fileName: string;
  contents: string;
}

// A workbook that cannot be opened is a rejected file like any other, so the reader's throw is
// turned into the same explained failure the mapping rules produce.
const readWorkbook = async (file: Blob): Promise<ParseResult<XlsxCell[][]>> => {
  try {
    return { ok: true, value: await xlsx.readRows(file) };
  } catch (error) {
    console.error('Failed to read the spreadsheet:', error);
    return { ok: false, error: 'The file could not be read as a spreadsheet.' };
  }
};

const createDataManagementCommands = (deps: {
  finance: typeof financeQueries;
  financeWrites: typeof financeCommands;
}) => ({
  // Reads and formats; writes nothing.
  createBackup: async (): Promise<DataFile> => {
    const takenAt = new Date();
    const backup: Backup = {
      schemaVersion: DB_SCHEMA_VERSION,
      createdAtISO: takenAt.toISOString(),
      data: await deps.finance.database.snapshot(),
    };

    return { fileName: backupFileName(takenAt), contents: JSON.stringify(backup, null, 2) };
  },

  // Reads and formats; writes nothing.
  exportMovementsCsv: async (): Promise<DataFile> => {
    const [movements, accounts, jars, incomeCategories, expenseCategories] = await Promise.all([
      deps.finance.movements.list(),
      // The names are looked up including the archived ones: a live movement may point at an
      // archived account, jar or category, and it still has to print that name. Nothing an
      // exported movement doesn't reference is ever looked up, so it never reaches the file.
      deps.finance.accounts.list({ includeArchived: true }),
      deps.finance.jars.list({ includeArchived: true }),
      deps.finance.categories.listIncome({ includeArchived: true }),
      deps.finance.categories.listExpense({ includeArchived: true }),
    ]);

    const rows = toMovementsCsvRows({
      movements,
      accounts,
      jars,
      categories: [...incomeCategories, ...expenseCategories],
    });

    return { fileName: movementsCsvFileName(new Date()), contents: csv.serialize(rows) };
  },

  // A rejected file never reaches a writer, so the existing data is left untouched by
  // construction rather than by care.
  restoreFromBackup: async (text: string): Promise<CommandResult> => {
    const backup = parseBackupFile(text);
    if (!backup.ok) {
      return backup;
    }

    await deps.financeWrites.database.replaceAll(backup.value);
    return { ok: true };
  },

  // Nothing is written until the whole workbook has been mapped, so a file rejected for its
  // fifth row leaves the existing data exactly as untouched as one rejected for its header.
  importMoneyManagerExcel: async (file: Blob): Promise<CommandResult> => {
    const rows = await readWorkbook(file);
    if (!rows.ok) {
      return rows;
    }

    const snapshot = moneyManager.toFinanceSnapshot(rows.value);
    if (!snapshot.ok) {
      return snapshot;
    }

    await deps.financeWrites.database.replaceAll(snapshot.value);
    return { ok: true };
  },

  clearAllData: (): Promise<void> => deps.financeWrites.database.clear(),
});

export const dataManagementCommands = createDataManagementCommands({
  finance: financeQueries,
  financeWrites: financeCommands,
});
