import React, { useEffect, useState } from 'react';
import { checkSupabaseReachable } from '../lib/supabaseHealth';

type Props = { children: React.ReactNode };

export default function SupabaseGate({ children }: Props) {
  const [state, setState] = useState<'checking' | 'ok' | 'fail'>('checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const r = await checkSupabaseReachable();
      if (cancelled) return;
      if (r.ok) setState('ok');
      else {
        setState('fail');
        setError(r.error ?? 'Supabase indisponível.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'checking') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-gray-400 text-sm font-sans px-6 text-center gap-2">
        <p>A ligar ao Supabase…</p>
      </div>
    );
  }

  if (state === 'fail') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-white font-sans px-6 text-center gap-4 max-w-md mx-auto">
        <h1 className="text-xl font-bold text-red-400">Sem ligação ao Supabase</h1>
        <p className="text-sm text-gray-400">
          A Wave só abre com o backend a responder. Verifica a URL e a chave anónima (<code className="text-brand text-xs">VITE_SUPABASE_URL</code>,{' '}
          <code className="text-brand text-xs">VITE_SUPABASE_ANON_KEY</code>), a rede e se o projeto não está em pausa.
        </p>
        {error && <p className="text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 w-full">{error}</p>}
        <button
          type="button"
          onClick={() => {
            setState('checking');
            setError(null);
            void checkSupabaseReachable().then((r) => {
              if (r.ok) setState('ok');
              else {
                setState('fail');
                setError(r.error ?? 'Falhou novamente.');
              }
            });
          }}
          className="px-6 py-3 rounded-xl bg-brand text-[#020617] font-bold text-sm"
        >
          Tentar outra vez
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
