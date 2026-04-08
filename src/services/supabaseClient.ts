import { createClient } from '@supabase/supabase-js';

// Usando as credenciais fornecidas diretamente conforme solicitado
const supabaseUrl = 'https://hhgecmtljovgoqbcqleb.supabase.co';
const supabaseKey = 'sb_publishable_KR3obEpqz9WJZXWwUVS5xw_iq_rVUAy';

export const supabase = createClient(supabaseUrl, supabaseKey);
