import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

export default function AuthScreen() {
  const { signIn, signUp, loading } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!email.trim() || password.length < 6) {
      setMessage('Email válido e palavra-passe com pelo menos 6 caracteres.');
      return;
    }
    setBusy(true);
    try {
      const fn = mode === 'login' ? signIn : signUp;
      const { error } = await fn(email, password);
      if (error) setMessage(error);
      else if (mode === 'register') {
        setMessage('Conta criada. Confirma o email se o projeto Supabase exigir; depois inicia sessão.');
      }
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] text-gray-400 text-sm">
        A carregar…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] px-6 py-10 text-white">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6"
      >
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-brand">Wave</h1>
          <p className="text-xs text-gray-500">
            {mode === 'login' ? 'Inicia sessão para sincronizar chats no Supabase.' : 'Cria conta para guardar mensagens na nuvem.'}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Palavra-passe</label>
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
          </div>

          {message && (
            <p className="text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2">{message}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-xl bg-brand text-[#020617] font-bold text-sm disabled:opacity-50"
          >
            {busy ? 'A aguardar…' : mode === 'login' ? 'Entrar' : 'Registar'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setMessage(null);
          }}
          className="w-full text-center text-xs text-gray-500 underline"
        >
          {mode === 'login' ? 'Não tens conta? Regista-te' : 'Já tens conta? Entrar'}
        </button>
      </motion.div>
    </div>
  );
}
