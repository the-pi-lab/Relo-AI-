/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the Cloudflare Worker engine (empty = same-origin) */
  readonly VITE_API_URL?: string;
  /** Meta app id for the in-app OAuth connect flow (optional) */
  readonly VITE_META_APP_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
