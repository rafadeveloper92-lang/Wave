import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pin, BellOff, Trash2, CheckCircle, MoreVertical, X, Lock, Eye, EyeOff, Search, Plus, Music } from 'lucide-react';
import { cn } from '../lib/utils';
import NewChatScreen from '../components/NewChatScreen';
import StatusEditor from '../components/StatusEditor';
import { sortChatsWithPins, togglePinChat, isChatPinned, getBlockedUsers, unblockUser } from '../lib/chatPreferences';

const mockChats = [
  { id: 'chat-1', name: 'Ana Silva', avatar: 'https://i.pravatar.cc/150?u=ana', message: 'Sua foto de hoje ficou ótima! 😍', time: '1m', unread: 2, online: true },
  { id: 'chat-2', name: 'Grupo Família', avatar: 'https://i.pravatar.cc/150?u=family', message: 'Mãe: O almoço tá pronto! 🥘', time: '5m', unread: 1, online: false },
  { id: 'chat-3', name: 'João Pereira', avatar: 'https://i.pravatar.cc/150?u=joao', message: 'Vamos sim! Às 18h?', time: '15m', unread: 0, online: true },
  { id: 'chat-4', name: 'Comunidade Tech', avatar: 'https://i.pravatar.cc/150?u=tech', message: 'Lucas: Novidades na Wave!', time: '30m', unread: 0, online: false },
  { id: 'chat-5', name: 'Maria Souza', avatar: 'https://i.pravatar.cc/150?u=maria', message: 'Oi, tudo bem?', time: '1h', unread: 0, online: true },
];

const statusData = [
  { id: 'status-1', name: 'Ana Silva', avatar: 'https://i.pravatar.cc/150?u=ana', items: [{ id: 's1', image: 'https://picsum.photos/seed/travel/1080/1920', time: 'Há 5 minutos', overlays: [] }] },
  { id: 'status-2', name: 'João Pereira', avatar: 'https://i.pravatar.cc/150?u=joao', items: [{ id: 's2', image: 'https://picsum.photos/seed/party/1080/1920', time: 'Há 1 hora', overlays: [] }] },
  { id: 'status-3', name: 'Maria Souza', avatar: 'https://i.pravatar.cc/150?u=maria', items: [{ id: 's3', image: 'https://picsum.photos/seed/tech/1080/1920', time: 'Há 3 horas', overlays: [] }] },
];

export default function ChatsScreen({ onChatClick }: { onChatClick: (chat: any) => void }) {
  const [chats, setChats] = useState(mockChats);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [showStatusViewer, setShowStatusViewer] = useState<{ name: string, avatar: string, items: any[] } | null>(null);
  const [showStatusEditor, setShowStatusEditor] = useState<string | null>(null);
  const [myStatuses, setMyStatuses] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const touchStartPos = useRef({ x: 0, y: 0 });
  const [lockedChats, setLockedChats] = useState<Record<string, string>>({});
  const [showSetPassword, setShowSetPassword] = useState<any | null>(null);
  const [showUnlockPrompt, setShowUnlockPrompt] = useState<any | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pinTick, setPinTick] = useState(0);
  const [blockListTick, setBlockListTick] = useState(0);

  useEffect(() => {
    const onPins = () => setPinTick((t) => t + 1);
    window.addEventListener('wave-pins-changed', onPins);
    return () => window.removeEventListener('wave-pins-changed', onPins);
  }, []);

  useEffect(() => {
    const onBl = () => setBlockListTick((t) => t + 1);
    window.addEventListener('wave-blocklist-changed', onBl);
    return () => window.removeEventListener('wave-blocklist-changed', onBl);
  }, []);

  useEffect(() => {
    const onBlocked = (e: Event) => {
      const id = (e as CustomEvent<{ peerUserId: string }>).detail?.peerUserId;
      if (!id) return;
      setChats((prev) => prev.filter((c) => c.peerUserId !== id));
    };
    window.addEventListener('wave-user-blocked', onBlocked);
    return () => window.removeEventListener('wave-user-blocked', onBlocked);
  }, []);

  useEffect(() => {
    const onRemoved = (e: Event) => {
      const chatId = (e as CustomEvent<{ chatId: string }>).detail?.chatId;
      if (!chatId) return;
      setChats((prev) => prev.filter((c) => c.id !== chatId));
    };
    window.addEventListener('wave-chat-removed', onRemoved);
    return () => window.removeEventListener('wave-chat-removed', onRemoved);
  }, []);

  const handleStart = (chat: any, e: React.MouseEvent | React.TouchEvent) => {
    const pos = 'touches' in e ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
    touchStartPos.current = pos;
    setIsScrolling(false);

    const timer = setTimeout(() => {
      setSelectedChat(chat);
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

  const handleEnd = (chat: any) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    if (!isLongPressing && !isScrolling) {
      if (lockedChats[chat.id]) {
        setShowUnlockPrompt(chat);
        setPasswordInput('');
        setPasswordError(false);
      } else {
        onChatClick(chat);
      }
    }
    setIsLongPressing(false);
    setIsScrolling(false);
  };

  const handleSetPassword = () => {
    if (!passwordInput.trim()) return;
    setLockedChats(prev => ({ ...prev, [showSetPassword.id]: passwordInput }));
    setShowSetPassword(null);
    setPasswordInput('');
  };

  const handleUnlock = () => {
    if (passwordInput === lockedChats[showUnlockPrompt.id]) {
      onChatClick(showUnlockPrompt);
      setShowUnlockPrompt(null);
      setPasswordInput('');
    } else {
      setPasswordError(true);
    }
  };

  const toggleLock = (chat: any) => {
    if (lockedChats[chat.id]) {
      // Unlock (remove password)
      const newLocked = { ...lockedChats };
      delete newLocked[chat.id];
      setLockedChats(newLocked);
      setSelectedChat(null);
    } else {
      setShowSetPassword(chat);
      setSelectedChat(null);
      setPasswordInput('');
    }
  };

  const handleNewChatSelect = (contact: { id: string; name: string; avatar: string; status?: string }) => {
    const peerId = contact.id;
    const existingChat = chats.find((c) => c.peerUserId === peerId || (!c.peerUserId && c.name === contact.name));
    if (existingChat) {
      onChatClick(existingChat);
    } else {
      const newChat = {
        id: `dm-${peerId}`,
        peerUserId: peerId,
        name: contact.name,
        avatar: contact.avatar,
        message: 'Inicie uma conversa...',
        time: 'Agora',
        unread: 0,
        online: true,
      };
      setChats([newChat, ...chats]);
      onChatClick(newChat);
    }
    setShowNewChat(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setShowStatusEditor(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveStatus = (data: { image: string, overlays: any[] }) => {
    const newStatus = {
      id: `status-${Date.now()}`,
      image: data.image,
      overlays: data.overlays,
      time: 'Agora'
    };
    setMyStatuses(prev => [...prev, newStatus]);
    setShowStatusEditor(null);
  };

  const filteredChats = sortChatsWithPins(
    chats.filter(
      (chat) =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.message.toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) as typeof chats;
  void pinTick;
  void blockListTick;

  const handleCancel = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setIsLongPressing(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-5 space-y-5 relative pb-24"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Chats</h2>
        <button 
          onClick={() => setShowNewChat(true)}
          className="p-1.5 bg-brand/10 text-brand rounded-lg hover:bg-brand/20 transition-all"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input 
          type="text" 
          placeholder="Pesquisar conversas..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
        />
      </div>

      {getBlockedUsers().length > 0 && (
        <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">
            Bloqueados ({getBlockedUsers().length})
          </h3>
          <div className="space-y-1.5 max-h-32 overflow-y-auto no-scrollbar">
            {getBlockedUsers().map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-xl hover:bg-white/5">
                <span className="text-xs font-medium truncate">{b.name}</span>
                <button
                  type="button"
                  onClick={() => unblockUser(b.id)}
                  className="text-[10px] font-bold text-brand shrink-0 uppercase"
                >
                  Desbloquear
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Status</h3>
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {/* My Status */}
          <div className="flex flex-col items-center gap-2 min-w-[70px]">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
            <div className="relative">
              <button 
                onClick={() => {
                  if (myStatuses.length > 0) {
                    setShowStatusViewer({
                      name: 'Meu Status',
                      avatar: 'https://i.pravatar.cc/150?u=me',
                      items: myStatuses
                    });
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
                className={cn(
                  "w-14 h-14 rounded-full p-0.5 border-2 transition-all",
                  myStatuses.length > 0 ? "border-brand" : "border-dashed border-gray-600"
                )}
              >
                <img 
                  src="https://i.pravatar.cc/150?u=me" 
                  alt="Meu Status" 
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="absolute bottom-0 right-0 bg-brand text-[#020617] rounded-full p-0.5 border-2 border-[#020617] hover:scale-110 transition-transform"
              >
                <Plus size={10} strokeWidth={3} />
              </button>
            </div>
            <span className="text-[9px] font-medium text-gray-400">Meu Status</span>
          </div>

          {/* Friends Status */}
          {statusData.map((status) => (
            <button 
              key={status.id} 
              onClick={() => setShowStatusViewer({
                name: status.name,
                avatar: status.avatar,
                items: status.items
              })}
              className="flex flex-col items-center gap-1.5 min-w-[60px]"
            >
              <div className="w-14 h-14 rounded-full p-0.5 border-2 border-brand">
                <img 
                  src={status.avatar} 
                  alt={status.name} 
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-[9px] font-medium text-gray-400 truncate w-full text-center">{status.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredChats.map((chat) => (
          <div 
            key={chat.id} 
            onMouseDown={(e) => handleStart(chat, e)}
            onMouseUp={() => handleEnd(chat)}
            onMouseLeave={handleCancel}
            onTouchStart={(e) => handleStart(chat, e)}
            onTouchMove={handleMove}
            onTouchEnd={() => handleEnd(chat)}
            className={cn(
              "flex items-center gap-3 group cursor-pointer transition-all duration-200 p-1.5 -mx-1.5 rounded-xl",
              selectedChat?.id === chat.id ? "bg-white/10 scale-[0.98]" : "hover:bg-white/5"
            )}
          >
            <div className="relative">
              <img 
                src={chat.avatar} 
                alt={chat.name} 
                className="w-12 h-12 rounded-full object-cover border-2 border-transparent group-hover:border-brand transition-all"
                referrerPolicy="no-referrer"
              />
              {chat.online && (
                <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-brand border-2 border-[#020617] rounded-full"></span>
              )}
              {lockedChats[chat.id] && (
                <div className="absolute -top-1 -left-1 bg-red-500 text-white p-0.5 rounded-md border border-[#020617] shadow-lg">
                  <Lock size={8} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 border-b border-white/5 pb-3">
              <div className="flex justify-between items-center mb-0.5">
                <div className="flex items-center gap-1.5">
                  {isChatPinned(chat.id) && <Pin size={12} className="text-brand shrink-0" />}
                  <h3 className="font-semibold text-base truncate">{chat.name}</h3>
                  {lockedChats[chat.id] && <Lock size={10} className="text-red-500" />}
                </div>
                <span className="text-[10px] text-gray-500">{chat.time}</span>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-400 truncate pr-4">{chat.message}</p>
                {chat.unread > 0 && (
                  <span className="bg-brand text-[#020617] text-[9px] font-bold w-4.5 h-4.5 flex items-center justify-center rounded-full">
                    {chat.unread}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Context Menu Overlay */}
      <AnimatePresence>
        {selectedChat && (
          <div 
            className="fixed inset-0 z-[300] flex items-end justify-center px-4 pb-8 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedChat(null)}
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
                <img src={selectedChat.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-1">
                  <h4 className="font-bold text-lg">{selectedChat.name}</h4>
                  <p className="text-xs text-gray-500 truncate">{selectedChat.message}</p>
                </div>
                <button 
                  onClick={() => setSelectedChat(null)}
                  className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Options */}
              <div className="p-2">
                <MenuOption
                  icon={<Pin size={20} />}
                  label={selectedChat && isChatPinned(selectedChat.id) ? 'Desfixar conversa' : 'Fixar conversa'}
                  onClick={() => {
                    if (selectedChat) togglePinChat(selectedChat.id);
                    setSelectedChat(null);
                  }}
                />
                <MenuOption 
                  icon={<Lock size={20} />} 
                  label={lockedChats[selectedChat.id] ? "Remover senha" : "Colocar senha"} 
                  onClick={() => toggleLock(selectedChat)} 
                />
                <MenuOption icon={<BellOff size={20} />} label="Silenciar notificações" onClick={() => setSelectedChat(null)} />
                <MenuOption icon={<CheckCircle size={20} />} label="Marcar como lida" onClick={() => setSelectedChat(null)} />
                <div className="h-px bg-white/5 my-1 mx-4" />
                <MenuOption
                  icon={<Trash2 size={20} />}
                  label="Apagar conversa"
                  variant="danger"
                  onClick={() => {
                    if (selectedChat) {
                      window.dispatchEvent(
                        new CustomEvent('wave-chat-removed', { detail: { chatId: selectedChat.id } })
                      );
                    }
                    setSelectedChat(null);
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
        {showSetPassword && (
          <div 
            key="set-password-overlay"
            className="fixed inset-0 z-[400] flex items-center justify-center px-6 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSetPassword(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-xs bg-[#1e293b] rounded-3xl p-6 shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-3 rounded-2xl bg-brand/10 text-brand">
                  <Lock size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">Bloquear Conversa</h3>
                  <p className="text-sm text-gray-400">Defina uma senha para proteger esta conversa.</p>
                </div>
                <div className="w-full relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Digite a senha" 
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
                  />
                  <button 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="flex flex-col w-full gap-2 pt-2">
                  <button 
                    onClick={handleSetPassword}
                    disabled={!passwordInput.trim()}
                    className="w-full py-3 rounded-2xl bg-brand text-[#020617] font-bold shadow-lg shadow-brand/20 disabled:opacity-50"
                  >
                    Confirmar Senha
                  </button>
                  <button 
                    onClick={() => setShowSetPassword(null)}
                    className="w-full py-3 rounded-2xl font-bold text-gray-400 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {showUnlockPrompt && (
          <div 
            key="unlock-prompt-overlay"
            className="fixed inset-0 z-[400] flex items-center justify-center px-6 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowUnlockPrompt(null)}
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
                  <h3 className="text-xl font-bold text-white">Conversa Bloqueada</h3>
                  <p className="text-sm text-gray-400">Digite a senha para acessar esta conversa.</p>
                </div>
                <div className="w-full space-y-2">
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
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
                    <button 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {passwordError && <p className="text-[10px] text-red-500 font-bold">Senha incorreta. Tente novamente.</p>}
                </div>
                <div className="flex flex-col w-full gap-2 pt-2">
                  <button 
                    onClick={handleUnlock}
                    className="w-full py-3 rounded-2xl bg-brand text-[#020617] font-bold shadow-lg shadow-brand/20"
                  >
                    Desbloquear
                  </button>
                  <button 
                    onClick={() => setShowUnlockPrompt(null)}
                    className="w-full py-3 rounded-2xl font-bold text-gray-400 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {showNewChat && (
          <NewChatScreen 
            key="new-chat-screen"
            onBack={() => setShowNewChat(false)}
            onSelectContact={handleNewChatSelect}
          />
        )}
        {showStatusViewer && (
          <StatusViewer 
            status={showStatusViewer} 
            onClose={() => setShowStatusViewer(null)} 
          />
        )}
        {showStatusEditor && (
          <StatusEditor 
            image={showStatusEditor}
            onCancel={() => setShowStatusEditor(null)}
            onSave={handleSaveStatus}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatusViewer({ status, onClose }: { status: { name: string, avatar: string, items: any[] }, onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentItem = status.items[currentIndex];
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Handle music playback
    const musicOverlay = currentItem.overlays?.find((o: any) => o.type === 'music');
    let playPromise: Promise<void> | undefined;

    if (musicOverlay && musicOverlay.previewUrl) {
      if (audioRef.current) audioRef.current.pause();
      audioRef.current = new Audio(musicOverlay.previewUrl);
      audioRef.current.currentTime = musicOverlay.startTime || 0;
      playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          if (e.name !== 'AbortError') console.error("Audio play failed", e);
        });
      }
    } else {
      if (audioRef.current) audioRef.current.pause();
    }

    return () => {
      if (playPromise !== undefined) {
        playPromise.then(() => {
          audioRef.current?.pause();
        }).catch(() => {});
      } else {
        audioRef.current?.pause();
      }
    };
  }, [currentIndex, currentItem]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentIndex < status.items.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        onClose();
      }
    }, 30000);
    return () => clearTimeout(timer);
  }, [currentIndex, status.items.length, onClose]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[500] bg-black flex flex-col"
    >
      {/* Progress Bars */}
      <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-10">
        {status.items.map((_, idx) => (
          <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ 
                width: idx < currentIndex ? '100%' : idx === currentIndex ? '100%' : '0%' 
              }}
              transition={{ 
                duration: idx === currentIndex ? 30 : 0, 
                ease: 'linear' 
              }}
              className="h-full bg-white"
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <img src={status.avatar} alt="" className="w-10 h-10 rounded-full border border-white/20" />
          <div>
            <h4 className="font-bold text-white text-sm">{status.name}</h4>
            <p className="text-[10px] text-white/60">{currentItem.time}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-white/80 hover:text-white">
          <X size={24} />
        </button>
      </div>

      {/* Content */}
      <div 
        className="flex-1 flex items-center justify-center relative"
        onClick={(e) => {
          const x = e.clientX;
          const width = window.innerWidth;
          if (x < width / 3) {
            // Previous
            if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
          } else {
            // Next
            if (currentIndex < status.items.length - 1) {
              setCurrentIndex(prev => prev + 1);
            } else {
              onClose();
            }
          }
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentItem.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full relative flex items-center justify-center"
          >
            <img 
              src={currentItem.image} 
              alt="" 
              className="w-full max-h-full object-contain"
              referrerPolicy="no-referrer"
            />
            
            {currentItem.overlays?.map((overlay: any) => (
              <div 
                key={overlay.id}
                className="absolute pointer-events-none"
                style={{
                  left: `calc(50% + ${overlay.x}px)`,
                  top: `calc(50% + ${overlay.y}px)`,
                  transform: `translate(-50%, -50%) scale(${overlay.scale}) rotate(${overlay.rotation}deg)`
                }}
              >
                {overlay.type === 'text' ? (
                  <div className={cn(
                    "bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-white font-bold text-xl shadow-2xl whitespace-nowrap",
                    overlay.font
                  )}>
                    {overlay.content}
                  </div>
                ) : (
                  <div className="bg-white/10 backdrop-blur-xl p-3 rounded-2xl border border-white/20 flex items-center gap-3 shadow-2xl min-w-[200px]">
                    <img src={overlay.cover} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm truncate">{overlay.content}</p>
                      <p className="text-white/60 text-xs truncate">{overlay.artist}</p>
                    </div>
                    <div className="p-2 bg-brand text-[#020617] rounded-full">
                      <Music size={14} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Reply */}
      <div className="p-6 pb-10 flex flex-col items-center gap-2">
        <div className="w-full bg-white/10 backdrop-blur-md border border-white/10 rounded-full py-3 px-6 text-center text-white/60 text-sm">
          Responder
        </div>
      </div>
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
