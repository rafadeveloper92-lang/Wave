import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Search, Check, Camera, X, Users, ChevronRight, Plus, Lock, Globe, Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';

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

interface CreateGroupScreenProps {
  key?: string;
  onBack: () => void;
  onCreate: (group: any) => void;
}

export default function CreateGroupScreen({ onBack, onCreate }: CreateGroupScreenProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const toggleContact = (id: string) => {
    setSelectedContacts(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const filteredContacts = mockContacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    if (!groupName.trim()) return;
    
    const newGroup = {
      id: `group-${Date.now()}`,
      name: groupName,
      description: groupDesc || 'Novo grupo criado',
      members: `${selectedContacts.length + 1}`,
      avatar: `https://picsum.photos/seed/${groupName}/100/100`,
      isOwner: true,
      isFavorite: false,
      isPrivate,
      password: isPrivate ? password : null,
    };
    
    onCreate(newGroup);
  };

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
        <button onClick={step === 1 ? onBack : () => setStep(1)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-xl font-bold">{step === 1 ? 'Novo Grupo' : 'Dados do Grupo'}</h2>
          <p className="text-xs text-gray-500">
            {step === 1 
              ? `${selectedContacts.length} selecionados` 
              : 'Adicione nome e imagem'}
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div 
              key="step-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-6 space-y-6"
            >
              {/* Selected Contacts Horizontal Scroll */}
              {selectedContacts.length > 0 && (
                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                  {selectedContacts.map(id => {
                    const contact = mockContacts.find(c => c.id === id);
                    return (
                      <div key={`selected-${id}`} className="relative flex-shrink-0 flex flex-col items-center gap-1">
                        <img src={contact?.avatar} alt="" className="w-12 h-12 rounded-full border-2 border-brand" />
                        <span className="text-[10px] text-gray-400 max-w-[50px] truncate">{contact?.name.split(' ')[0]}</span>
                        <button 
                          onClick={() => toggleContact(id)}
                          className="absolute -top-1 -right-1 bg-gray-800 rounded-full p-1 border border-white/10"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

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

              {/* Contacts List */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Contatos</h3>
                {filteredContacts.map(contact => (
                  <div 
                    key={contact.id}
                    onClick={() => toggleContact(contact.id)}
                    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group"
                  >
                    <div className="relative">
                      <img src={contact.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                      {selectedContacts.includes(contact.id) && (
                        <div className="absolute -bottom-1 -right-1 bg-brand text-[#020617] rounded-full p-1 border-2 border-[#020617]">
                          <Check size={12} strokeWidth={4} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold truncate">{contact.name}</h4>
                      <p className="text-xs text-gray-500 truncate">{contact.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 space-y-8"
            >
              {/* Group Avatar */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-3xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden">
                    <Camera size={32} className="text-gray-600 group-hover:text-brand transition-colors" />
                  </div>
                  <button className="absolute -bottom-2 -right-2 bg-brand p-2 rounded-xl text-[#020617] shadow-lg">
                    <Plus size={20} />
                  </button>
                </div>
                <p className="text-xs text-gray-500">Toque para adicionar uma imagem</p>
              </div>

              {/* Inputs */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Nome do Grupo</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Time de Design" 
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Descrição (Opcional)</label>
                  <textarea 
                    placeholder="Sobre o que é este grupo?" 
                    value={groupDesc}
                    onChange={(e) => setGroupDesc(e.target.value)}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all resize-none"
                  />
                </div>

                {/* Visibility Toggle */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Privacidade</label>
                  <div className="flex p-1 bg-white/5 rounded-2xl">
                    <button 
                      type="button"
                      onClick={() => setIsPrivate(false)}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all",
                        !isPrivate ? "bg-brand text-[#020617] shadow-lg" : "text-gray-500 hover:text-gray-300"
                      )}
                    >
                      <Globe size={14} /> Público
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsPrivate(true)}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all",
                        isPrivate ? "bg-brand text-[#020617] shadow-lg" : "text-gray-500 hover:text-gray-300"
                      )}
                    >
                      <Lock size={14} /> Privado
                    </button>
                  </div>
                </div>

                {/* Password Field */}
                <AnimatePresence>
                  {isPrivate && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Senha de Acesso</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Defina uma senha" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
                        />
                        <button 
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-600 px-1 italic">Membros precisarão desta senha para entrar no grupo.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Summary */}
              <div className="glass p-4 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Users size={16} />
                    <span className="text-xs font-medium">Membros selecionados</span>
                  </div>
                  <span className="text-xs font-bold text-brand">{selectedContacts.length}</span>
                </div>
                <div className="flex -space-x-2 overflow-hidden">
                  {selectedContacts.slice(0, 5).map(id => (
                    <img 
                      key={`summary-${id}`}
                      src={mockContacts.find(c => c.id === id)?.avatar} 
                      alt="" 
                      className="w-8 h-8 rounded-full border-2 border-[#0a0f1a] object-cover" 
                    />
                  ))}
                  {selectedContacts.length > 5 && (
                    <div className="w-8 h-8 rounded-full border-2 border-[#0a0f1a] bg-gray-800 flex items-center justify-center text-[10px] font-bold">
                      +{selectedContacts.length - 5}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Action */}
      <footer className="p-6 border-t border-white/5">
        {step === 1 ? (
          <button 
            disabled={selectedContacts.length === 0}
            onClick={() => setStep(2)}
            className="w-full btn-gradient py-4 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-brand/20 disabled:opacity-50 disabled:grayscale"
          >
            Próximo <ChevronRight size={20} />
          </button>
        ) : (
          <button 
            disabled={!groupName.trim()}
            onClick={handleCreate}
            className="w-full btn-gradient py-4 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-brand/20 disabled:opacity-50 disabled:grayscale"
          >
            Criar Grupo <Check size={20} />
          </button>
        )}
      </footer>
    </motion.div>
  );
}
