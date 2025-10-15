/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_N8N_WEBHOOK_URL_NURSE: string;
  readonly VITE_N8N_WEBHOOK_TOKEN: string;
  readonly VITE_N8N_WEBHOOK_URL_SOP: string;
  readonly VITE_N8N_WEBHOOK_TOKEN_SOP: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  google: {
    accounts: {
      id: {
        initialize: (config: any) => void;
        renderButton: (element: HTMLElement, config: any) => void;
        prompt: () => void;
      };
    };
  };
}
