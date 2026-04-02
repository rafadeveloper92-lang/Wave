import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Users, Plus, Star, ChevronRight, Lock, Pin, BellOff, Trash2, Shield, Settings, X } from 'lucide-react';
import CreateGroupScreen from '../components/CreateGroupScreen';

const initialGroups = [
  { id: 'group-1', name: 'Comunidade Tech', description: 'Novidades na Wave e discussões sobre o futuro da tecnologia.', members: '3K', avatar: 'https://picsum.photos/seed/tech-group/100/100', isOwner: false, isFavorite: true },
  { id: 'group-2', name: 'Family', description: 'Nosso grupo para conectar a família e compartilhar momentos.', members: '12', avatar: 'https://picsum.photos/seed/family-group/100/100', isOwner: true, isFavorite: false },
  { id: 'group-3', name: 'Hiking Club', description: 'Explore trilhas e aventuras com nosso clube de caminhada.', members: '85', avatar: 'https://picsum.photos/seed/hiking/100/100', isOwner: false, isFavorite: false },
  { id: 'group-4', name: 'Wave Design System', description: 'Grupo focado em UI/UX e design da plataforma Wave.', members: '450', avatar: 'https://picsum.photos/seed/design/100/100', isOwner: true, isFavorite: true },
  { id: 'group-5', name: 'Gamer Wave', description: 'Para quem ama jogos e quer encontrar parceiros de partida.', members: '1.2K', avatar: 'https://picsum.photos/seed/games/100/100', isOwner: false, isFavorite: false },
];

type GroupTab = 'all' | 'my' | 'favorites';

export default function GroupsScreen({ onGroupClick }: { onGroupClick: (group: any) => void }) {
  const [activeTab, setActiveTab] = useState<GroupTab>('all');
  const [groups, setGroups] = useState(initialGroups);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState<{ group: any } | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [longPressGroup, setLongPressGroup] = useState<any | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const touchStartPos = useRef({ x: 0, y: 0 });

  const handleStart = (group: any, e: React.MouseEvent | React.TouchEvent) => {
    const pos = 'touches' in e ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
    touchStartPos.current = pos;
    setIsScrolling(false);

    const timer = setTimeout(() => {
      setLongPressGroup(group);
      setIsLongPressing(true);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 600);
    setLongPressTimer(timer);
  };

  const handleMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const distY = Math.abs(currentY - touchStartPos.current.y);
    const distX = Math.abs(currentX - touchStartPos.current.x);

    if (distY > 10 || distX > 10) {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
      setIsScrolling(true);
    }
  };

  const handleEnd = (group: any) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    if (!isLongPressing && !isScrolling) {
      handleGroupClick(group);
    }
    setIsLongPressing(false);
    setIsScrolling(false);
  };

  const handleCancel = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setIsLongPressing(false);
  };

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setGroups(groups.map(g => g.id === id ? { ...g, isFavorite: !g.isFavorite } : g));
  };

  const filteredGroups = groups.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'my') return matchesSearch && g.isOwner;
    if (activeTab === 'favorites') return matchesSearch && g.isFavorite;
    return matchesSearch;
  });

  const handleCreateGroup = (newGroup: any) => {
    setGroups([newGroup, ...groups]);
    setShowCreateGroup(false);
  };

  const handleGroupClick = (group: any) => {
    if (group.isPrivate && !group.isOwner) {
      setShowPasswordPrompt({ group });
      setPasswordInput('');
      setPasswordError(false);
    } else {
      onGroupClick(group);
    }
  };

  const handlePasswordSubmit = () => {
    if (showPasswordPrompt && passwordInput === showPasswordPrompt.group.password) {
      onGroupClick(showPasswordPrompt.group);
      setShowPasswordPrompt(null);
    } else {
      setPasswordError(true);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="px-6 space-y-6 pb-20"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Grupos</h2>
        <button 
          onClick={() => setShowCreateGroup(true)}
          className="p-2 bg-brand/10 text-brand rounded-xl hover:bg-brand/20 transition-all"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input 
          type="text" 
          placeholder="Pesquisar grupos..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
        />
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-white/5 rounded-2xl">
        <TabButton active={activeTab === 'all'} onClick={() => setActiveTab('all')} label="Todos" />
        <TabButton active={activeTab === 'my'} onClick={() => setActiveTab('my')} label="Meus" />
        <TabButton active={activeTab === 'favorites'} onClick={() => setActiveTab('favorites')} label="Favoritos" />
      </div>

      {/* Groups List */}
      <div className="space-y-4 min-h-[300px]">
        <AnimatePresence mode="popLayout">
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={group.id} 
                onMouseDown={(e) => handleStart(group, e)}
                onMouseUp={() => handleEnd(group)}
                onMouseLeave={handleCancel}
                onTouchStart={(e) => handleStart(group, e)}
                onTouchMove={handleMove}
                onTouchEnd={() => handleEnd(group)}
                className={cn(
                  "glass p-4 rounded-3xl flex items-center gap-4 hover:bg-white/10 transition-all cursor-pointer group relative overflow-hidden",
                  longPressGroup?.id === group.id ? "bg-white/10 scale-[0.98]" : ""
                )}
              >
                <div className="relative flex-shrink-0">
                  <img src={group.avatar} alt="" className="w-16 h-16 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute -bottom-1 -right-1 bg-brand text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-[#0a0f1a]">
                    {group.members}
                  </div>
                  {group.isPrivate && (
                    <div className="absolute -top-1 -left-1 bg-red-500 text-white p-1 rounded-lg border border-[#0a0f1a] shadow-lg">
                      <Lock size={10} />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg truncate">{group.name}</h3>
                    {group.isPrivate && <Lock size={12} className="text-red-500" />}
                    {group.isOwner && (
                      <span className="text-[8px] font-black bg-brand/20 text-brand px-1.5 py-0.5 rounded uppercase tracking-tighter">Dono</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-1 leading-relaxed">{group.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Users size={12} />
                      <span className="text-[10px] font-medium">{group.members}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={(e) => toggleFavorite(e, group.id)}
                  className={cn(
                    "p-2 rounded-xl transition-all",
                    group.isFavorite ? "text-yellow-500 bg-yellow-500/10" : "text-gray-500 hover:bg-white/5"
                  )}
                >
                  <Star size={18} fill={group.isFavorite ? "currentColor" : "none"} />
                </button>
              </motion.div>
            ))
          ) : (
            <motion.div 
              key="empty-groups-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center space-y-4"
            >
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-gray-600">
                <Users size={32} />
              </div>
              <div>
                <p className="text-gray-400 font-medium">Nenhum grupo encontrado</p>
                <p className="text-xs text-gray-600">Tente mudar os filtros ou criar um novo grupo.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button 
        onClick={() => setShowCreateGroup(true)}
        className="w-full btn-gradient py-4 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-brand/20"
      >
        <Plus size={20} /> Criar Novo Grupo
      </button>

      <AnimatePresence>
        {showCreateGroup && (
          <CreateGroupScreen 
            key="create-group-screen"
            onBack={() => setShowCreateGroup(false)}
            onCreate={handleCreateGroup}
          />
        )}
        {showPasswordPrompt && (
          <div 
            key="password-prompt-overlay"
            className="fixed inset-0 z-[200] flex items-center justify-center px-6 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPasswordPrompt(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-xs bg-[#1e293b] rounded-3xl p-6 shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-3 rounded-2xl bg-red-500/10 text-red-500">
                  <Lock size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">Grupo Privado</h3>
                  <p className="text-sm text-gray-400">Este grupo requer uma senha para acesso.</p>
                </div>
                <div className="w-full space-y-2">
                  <input 
                    type="password" 
                    placeholder="Digite a senha" 
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setPasswordError(false);
                    }}
                    className={cn(
                      "w-full bg-white/5 border rounded-2xl py-3 px-4 text-sm focus:outline-none transition-all",
                      passwordError ? "border-red-500 focus:ring-red-500/50" : "border-white/10 focus:ring-brand/50"
                    )}
                  />
                  {passwordError && <p className="text-[10px] text-red-500 font-bold">Senha incorreta. Tente novamente.</p>}
                </div>
                <div className="flex flex-col w-full gap-2 pt-2">
                  <button 
                    onClick={handlePasswordSubmit}
                    className="w-full py-3 rounded-2xl bg-brand text-[#020617] font-bold shadow-lg shadow-brand/20"
                  >
                    Entrar no Grupo
                  </button>
                  <button 
                    onClick={() => setShowPasswordPrompt(null)}
                    className="w-full py-3 rounded-2xl font-bold text-gray-400 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {longPressGroup && (
          <div 
            key="group-context-menu-overlay"
            className="fixed inset-0 z-[300] flex items-end justify-center px-4 pb-8 bg-black/40 backdrop-blur-sm"
            onClick={() => setLongPressGroup(null)}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-sm bg-[#1e293b] rounded-[32px] overflow-hidden shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Info */}
              <div className="p-6 flex items-center gap-4 border-b border-white/5">
                <img src={longPressGroup.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-lg">{longPressGroup.name}</h4>
                    {longPressGroup.isPrivate && <Lock size={14} className="text-red-500" />}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{longPressGroup.description}</p>
                </div>
                <button 
                  onClick={() => setLongPressGroup(null)}
                  className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Options */}
              <div className="p-2">
                <MenuOption icon={<Pin size={20} />} label="Fixar grupo" onClick={() => setLongPressGroup(null)} />
                <MenuOption 
                  icon={<Star size={20} fill={longPressGroup.isFavorite ? "currentColor" : "none"} />} 
                  label={longPressGroup.isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"} 
                  onClick={() => {
                    setGroups(groups.map(g => g.id === longPressGroup.id ? { ...g, isFavorite: !g.isFavorite } : g));
                    setLongPressGroup(null);
                  }} 
                />
                <MenuOption icon={<BellOff size={20} />} label="Silenciar notificações" onClick={() => setLongPressGroup(null)} />
                
                {longPressGroup.isOwner && (
                  <>
                    <div className="h-px bg-white/5 my-1 mx-4" />
                    <MenuOption icon={<Shield size={20} />} label="Gerenciar Cargos" onClick={() => setLongPressGroup(null)} />
                    <MenuOption icon={<Settings size={20} />} label="Configurações do Grupo" onClick={() => setLongPressGroup(null)} />
                  </>
                )}
                
                <div className="h-px bg-white/5 my-1 mx-4" />
                <MenuOption icon={<Trash2 size={20} />} label={longPressGroup.isOwner ? "Apagar grupo" : "Sair do grupo"} variant="danger" onClick={() => setLongPressGroup(null)} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MenuOption({ icon, label, onClick, variant = 'default' }: { icon: React.ReactNode, label: string, onClick: () => void, variant?: 'default' | 'danger' }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-2xl transition-all",
        variant === 'danger' ? "text-red-500 hover:bg-red-500/10" : "text-gray-300 hover:bg-white/5"
      )}
    >
      <div className={cn(
        "p-2 rounded-xl",
        variant === 'danger' ? "bg-red-500/10" : "bg-white/5"
      )}>
        {icon}
      </div>
      <span className="font-medium">{label}</span>
    </button>
  );
}

function TabButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 py-2.5 text-xs font-bold rounded-xl transition-all",
        active ? "bg-brand text-[#020617] shadow-lg" : "text-gray-500 hover:text-gray-300"
      )}
    >
      {label}
    </button>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
