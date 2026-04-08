import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = 'https://hhgecmtljovgoqbcqleb.supabase.co';
const supabaseKey = 'sb_publishable_KR3obEpqz9WJZXWwUVS5xw_iq_rVUAy';

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );
