import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL?.trim() || 'https://hhgecmtljovgoqbcqleb.supabase.co';
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ||
  'sb_publishable_KR3obEpqz9WJZXWwUVS5xw_iq_rVUAy';

export const supabase = createClient(supabaseUrl, supabaseKey);
