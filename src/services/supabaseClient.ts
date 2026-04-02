import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hhgecmtljovgoqbcqleb.supabase.co';
const supabaseKey = 'sb_publishable_KR3obEpqz9WJZXWwUVS5xw_iq_rVUAy';

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key is missing. Please check your configuration.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
