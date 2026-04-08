import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Search, UserPlus, MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import { useWaveContacts, type WaveContact } from '../hooks/useWaveContacts';
import { getBlockedUserIds } from '../lib/chatPreferences';

interface NewChatScreenProps {
  key?: string;
  onBack: () => void;
  onSelectContact: (contact: WaveContact) => void;
}

export default function NewChatScreen({ onBack, onSelectContact }: NewChatScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [blockTick, setBlockTick] = useState(0);
  const { contacts, loading, error, refetch } = useWaveContacts(true);

  useEffect(() => {
    const onBlock = () => setBlockTick((t) => t + 1);
    window.addEventListener('wave-blocklist-changed', onBlock);
    return () => window.removeEventListener('wave-blocklist-changed', onBlock);
  }, []);

  const filteredContacts = useMemo(() => {
    const blocked = getBlockedUserIds();
    return contacts.filter(
      (c) => !blocked.has(c.id) && c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [contacts, searchQuery, blockTick]);

  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-[#020617] flex flex-col"
    >
      <header className="px-6 py-6 flex items-center gap-4 border-b border-white/5">
        <button type="button" onClick={onBack} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-xl font-bold">Novo chat</h2>
          <p className="text-xs text-gray-500">Contactos na Wave (Supabase)</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Pesquisar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
          />
        </div>

        <div className="space-y-2">
          <button
            type="button"
            className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all group opacity-60 cursor-not-allowed"
            disabled
          >
            <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center">
              <UserPlus size={20} />
            </div>
            <span className="font-bold text-gray-400">Novo contacto (em breve)</span>
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-sm text-amber-100">
            <AlertCircle className="shrink-0 mt-0.5" size={20} />
            <div className="flex-1 space-y-2">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="text-brand font-bold text-xs uppercase tracking-wide"
              >
                Tentar outra vez
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 py-8 text-gray-500 text-sm">
            <Loader2 className="animate-spin" size={20} />
            A carregar contactos…
          </div>
        )}

        {!loading && !error && filteredContacts.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-8 px-4">
            Nenhum outro utilizador na Wave. Convida alguém a registar-se no mesmo projeto Supabase — os perfis aparecem aqui
            (tabela <code className="text-brand text-xs">profiles</code>).
          </p>
        )}

        <div className="space-y-2">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Na Wave</h3>
          <AnimatePresence>
            {filteredContacts.map((contact) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group"
                onClick={() => onSelectContact(contact)}
              >
                <img
                  src={contact.avatar}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold truncate">{contact.name}</h4>
                  <p className="text-xs text-gray-500 truncate">{contact.status}</p>
                </div>
                <MessageSquare size={18} className="text-gray-600 group-hover:text-brand transition-colors shrink-0" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
