import { supabase } from '../services/supabaseClient';

/** Verifica se o projeto Supabase responde (rede + URL/chave válidos). */
export async function checkSupabaseReachable(): Promise<{ ok: boolean; error?: string }> {
  const ms = 12000;
  const timeout = new Promise<{ ok: false; error: string }>((resolve) =>
    setTimeout(() => resolve({ ok: false, error: `Sem resposta do Supabase em ${ms / 1000}s. Verifica URL, chave e rede.` }), ms)
  );

  const probe = supabase.auth
    .getSession()
    .then(({ error }) => {
      if (error) {
        const msg = error.message || String(error);
        if (/fetch|network|failed|load/i.test(msg)) {
          return { ok: false as const, error: msg };
        }
      }
      return { ok: true as const };
    })
    .catch((e) => ({
      ok: false as const,
      error: e instanceof Error ? e.message : String(e),
    }));

  return Promise.race([probe, timeout]);
}
