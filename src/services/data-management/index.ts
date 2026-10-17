import { dataManagementCommands } from './application/commands';
import { moneyManager } from './domain/moneyManager';

export const dataManagement = { commands: dataManagementCommands, moneyManager };

export type { BackupFile, DataFile, MoneyManagerImportOptions } from './application/commands';
export type { CommandResult, ParseResult } from './domain/result';
