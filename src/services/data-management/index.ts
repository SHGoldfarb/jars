import { dataManagementCommands } from './application/commands';

export const dataManagement = { commands: dataManagementCommands };

export type { DataFile } from './application/commands';
export type { CommandResult, ParseResult } from './domain/result';
