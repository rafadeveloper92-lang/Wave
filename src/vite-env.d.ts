/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_TURN_URLS?: string;
  readonly VITE_TURN_USERNAME?: string;
  readonly VITE_TURN_CREDENTIAL?: string;
  /** URL opcional do toque de chamada (ex. ficheiro no Storage). Por defeito: /sounds/incoming-call.mp3 */
  readonly VITE_RING_SOUND_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
