import * as z from 'zod';

export interface DriveBackupConfig {
  clientId: string;
}

const ClientId = z.string().trim().min(1);

// Parsed once. A build without a client id has no Drive backup at all, so a missing or empty
// value is `null` rather than a throw, and the Settings card is not rendered.
const parseConfig = (env: ImportMetaEnv): DriveBackupConfig | null => {
  const clientId = ClientId.safeParse(env.VITE_GOOGLE_CLIENT_ID);
  return clientId.success ? { clientId: clientId.data } : null;
};

export const driveBackupConfig = parseConfig(import.meta.env);
