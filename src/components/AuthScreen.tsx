import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

export default function AuthScreen() {
  const { signIn, signUp, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!email.trim() || !password) {
      setMessage('Preencha e-mail e senha.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'login') {
        const { error } = await signIn(email.trim(), password);
        if (error) setMessage(error.message);
      } else {
        const { error } = await signUp(email.trim(), password, displayName.trim() || undefined);
        if (error) setMessage(error.message);
        else
          setMessage(
            'Conta criada. Se o projeto exigir confirmação por e-mail, abra a caixa de entrada antes de entrar.'
          );
      }
    } finally {
      setBusy(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] text-brand text-sm font-medium">
        A carregar…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-[#020617] bg-main-gradient">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-white tracking-tight">Wave</h1>
          <p className="text-sm text-gray-500">
            {mode === 'login' ? 'Entre com a sua conta' : 'Crie uma conta para sincronizar mensagens'}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {mode === 'register' && (
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nome a mostrar (opcional)"
              autoComplete="name"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-brand/50"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            autoComplete="email"
            required
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-brand/50"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            minLength={6}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-brand/50"
          />

          {message && (
            <p className="text-xs text-amber-400/90 leading-relaxed px-1">{message}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3.5 rounded-2xl bg-brand text-[#020617] font-black text-sm disabled:opacity-50"
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
          className="w-full text-center text-sm text-brand font-medium"
        >
          {mode === 'login' ? 'Não tem conta? Registar' : 'Já tem conta? Entrar'}
        </button>
      </motion.div>
    </div>
  );
}
