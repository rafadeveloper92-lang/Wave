import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Search, X, UserPlus, MessageSquare } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  avatar: string;
  status: string;
}

const mockContacts: Contact[] = [
  { id: 'c1', name: 'Ana Silva', avatar: 'https://i.pravatar.cc/150?u=ana', status: 'Disponível' },
  { id: 'c2', name: 'João Pereira', avatar: 'https://i.pravatar.cc/150?u=joao', status: 'No trabalho' },
  { id: 'c3', name: 'Maria Souza', avatar: 'https://i.pravatar.cc/150?u=maria', status: 'Bateria fraca 🪫' },
  { id: 'c4', name: 'Lucas Oliveira', avatar: 'https://i.pravatar.cc/150?u=lucas', status: 'Wave is awesome! 🌊' },
  { id: 'c5', name: 'Beatriz Santos', avatar: 'https://i.pravatar.cc/150?u=beatriz', status: 'Ocupada' },
  { id: 'c6', name: 'Ricardo Lima', avatar: 'https://i.pravatar.cc/150?u=ricardo', status: 'Na academia 💪' },
  { id: 'c7', name: 'Juliana Costa', avatar: 'https://i.pravatar.cc/150?u=juliana', status: 'Viajando ✈️' },
];

interface NewChatScreenProps {
  key?: string;
  onBack: () => void;
  onSelectContact: (contact: Contact) => void;
}

export default function NewChatScreen({ onBack, onSelectContact }: NewChatScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = mockContacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-[#020617] flex flex-col"
    >
      {/* Header */}
      <header className="px-6 py-6 flex items-center gap-4 border-b border-white/5">
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-xl font-bold">Novo Chat</h2>
          <p className="text-xs text-gray-500">Selecione um contato</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Pesquisar contatos..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
          />
        </div>

        {/* Options */}
        <div className="space-y-2">
          <button className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all group">
            <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center group-hover:bg-brand group-hover:text-[#020617] transition-all">
              <UserPlus size={20} />
            </div>
            <span className="font-bold">Novo Contato</span>
          </button>
        </div>

        {/* Contacts List */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Contatos na Wave</h3>
          {filteredContacts.map(contact => (
            <div 
              key={contact.id}
              onClick={() => onSelectContact(contact)}
              className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group"
            >
              <img src={contact.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold truncate">{contact.name}</h4>
                <p className="text-xs text-gray-500 truncate">{contact.status}</p>
              </div>
              <MessageSquare size={18} className="text-gray-600 group-hover:text-brand transition-colors" />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
