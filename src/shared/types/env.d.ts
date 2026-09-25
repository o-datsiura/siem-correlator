/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_APP_ENV: string;
  readonly VITE_ENABLE_WORKER_LOGS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
