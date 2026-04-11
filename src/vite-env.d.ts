/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_TURN_URLS?: string;
  readonly VITE_TURN_USERNAME?: string;
  readonly VITE_TURN_CREDENTIAL?: string;
  /** Chave da API YouTube Data v3 (Google Cloud). Restringe por referrer / app no Google Cloud. */
  readonly VITE_YOUTUBE_API_KEY?: string;
  /** Opcional: ID da playlist (ex. só Shorts) — prioridade sobre pesquisa. */
  readonly VITE_YOUTUBE_PLAYLIST_ID?: string;
  /** Pesquisa quando não há playlist (default: youtube shorts). */
  readonly VITE_YOUTUBE_SHORTS_QUERY?: string;
  /** IDs de vídeo separados por vírgula, sem API (só embed). */
  readonly VITE_YOUTUBE_FALLBACK_IDS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
