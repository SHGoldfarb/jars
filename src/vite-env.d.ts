/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Optional on purpose: a build without it has no Drive backup, and `config.ts` handles that.
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
