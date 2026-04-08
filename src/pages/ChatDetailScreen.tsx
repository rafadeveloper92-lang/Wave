import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Phone, Video, MoreVertical, Send, Smile, Paperclip, User, Image, Search, BellOff, Wallpaper, Trash2, Eraser, AlertCircle, MessageSquare, ChevronRight, Star, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChatMessages } from '../hooks/useChatMessages';
import { dmRoomKey, groupRoomKey } from '../lib/chatRooms';
import CallOverlay from '../components/CallOverlay';
import { useWebRtcCall } from '../hooks/useWebRtcCall';

export interface Message {
  id: string;
  text: string;
  time: string;
  isMe: boolean;
}

interface ChatDetailProps {
  key?: string;
  chat: {
    id: string;
    name: string;
    avatar: string;
    online?: boolean;
    isGroup?: boolean;
    members?: string;
    description?: string;
  };
  onBack: () => void;
}

type GroupRole = 'Marechal' | 'General' | 'Capitão' | 'Membro';

interface Member {
  id: string;
  name: string;
  avatar: string;
  role: GroupRole;
  bio: string;
  phone: string;
  status: string;
}

const ROLE_CONFIG = {
  'Marechal': { label: 'Marechal', color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: '👑', priority: 4 },
  'General': { label: 'General', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', icon: '⭐', priority: 3 },
  'Capitão': { label: 'Capitão', color: 'text-brand', bg: 'bg-brand/10', border: 'border-brand/20', icon: '🛡️', priority: 2 },
  'Membro': { label: 'Membro', color: 'text-gray-500', bg: 'bg-white/5', border: 'border-white/10', icon: '👤', priority: 1 },
};

function seedMessagesForChat(isGroup: boolean): Message[] {
  return isGroup
    ? [
        { id: 'msg-1', text: 'Bem-vindos ao grupo!', time: '09:00', isMe: false },
        { id: 'msg-2', text: 'Alguém viu as novidades da Wave?', time: '09:05', isMe: false },
      ]
    : [
        { id: 'msg-1', text: 'Oi! Como você está?', time: '10:00', isMe: false },
        { id: 'msg-2', text: 'Tudo bem por aqui, e você?', time: '10:02', isMe: true },
        { id: 'msg-3', text: 'Sua foto de hoje ficou ótima! 😍', time: '10:05', isMe: false },
      ];
}

export default function ChatDetailScreen({ chat, onBack }: ChatDetailProps) {
  const { user } = useAuth();
  const roomKey = useMemo(
    () => (chat.isGroup ? groupRoomKey(chat.id) : dmRoomKey(chat.id)),
    [chat.id, chat.isGroup]
  );
  const {
    messages: syncedMessages,
    loading: messagesLoading,
    error: messagesError,
    sendMessage: sendSyncedMessage,
  } = useChatMessages(roomKey, user?.id ?? null);

  const rtc = useWebRtcCall(chat.id, { enabled: true, isGroup: Boolean(chat.isGroup) });
  const callUiActive = rtc.phase !== 'idle';
  const canStartCall = rtc.signalingReady;

  const [localMessages, setLocalMessages] = useState<Message[]>(() => seedMessagesForChat(Boolean(chat.isGroup)));
  const [useLocalOnly, setUseLocalOnly] = useState(false);

  useEffect(() => {
    setLocalMessages(seedMessagesForChat(Boolean(chat.isGroup)));
    setUseLocalOnly(false);
  }, [roomKey, chat.isGroup]);

  useEffect(() => {
    if (messagesError) {
      setUseLocalOnly(true);
      setLocalMessages(seedMessagesForChat(Boolean(chat.isGroup)));
    }
  }, [messagesError, chat.isGroup]);

  const displayMessages = useLocalOnly ? localMessages : syncedMessages;

  const [showInfo, setShowInfo] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  
  // Mock: current user is 'Marechal'
  const [currentUserRole, setCurrentUserRole] = useState<GroupRole>('Marechal');
  const [onlyAdminsCanMessage, setOnlyAdminsCanMessage] = useState(false);
  const [onlyAdminsCanEditInfo, setOnlyAdminsCanEditInfo] = useState(false);
  const [ephemeralMessages, setEphemeralMessages] = useState(false);
  
  const [members, setMembers] = useState<Member[]>([
    { id: 'member-1', name: 'Lucas Silva', avatar: 'https://i.pravatar.cc/150?u=lucas', role: 'Marechal', bio: 'Apaixonado por tecnologia e design.', phone: '+55 11 98765-4321', status: 'Focado no desenvolvimento do Wave 🚀' },
    { id: 'member-2', name: 'Ana Silva', avatar: 'https://i.pravatar.cc/150?u=ana', role: 'General', bio: 'Explorando o mundo da Wave!', phone: '+55 21 99887-7665', status: 'Viajando e conectando 🌍' },
    { id: 'member-3', name: 'João Pereira', avatar: 'https://i.pravatar.cc/150?u=joao', role: 'Capitão', bio: 'Sempre pronto para uma boa conversa.', phone: '+55 31 97766-5544', status: 'Disponível para trocar ideias' },
    { id: 'member-4', name: 'Maria Souza', avatar: 'https://i.pravatar.cc/150?u=maria', role: 'Membro', bio: 'Amante da natureza e de boas conexões.', phone: '+55 41 96655-4433', status: 'Offline por um tempo 🌿' },
    { id: 'member-5', name: 'Pedro Santos', avatar: 'https://i.pravatar.cc/150?u=pedro', role: 'Membro', bio: 'Entusiasta de trilhas e aventuras.', phone: '+55 51 95544-3322', status: 'Em uma trilha... 🏔️' },
  ]);

  const canUserMessage = !onlyAdminsCanMessage || currentUserRole !== 'Membro';
  const canUserEditInfo = !onlyAdminsCanEditInfo || ['Marechal', 'General'].includes(currentUserRole);

  const handlePromote = (memberId: string, newRole: GroupRole) => {
    setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    if (selectedMember?.id === memberId) {
      setSelectedMember({ ...selectedMember, role: newRole });
    }
  };

  const handleBan = (memberId: string) => {
    setMembers(members.filter(m => m.id !== memberId));
    setSelectedMember(null);
  };

  const [inputText, setInputText] = useState('');

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    if (useLocalOnly) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: inputText.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: true,
      };
      setLocalMessages((prev) => [...prev, newMessage]);
      setInputText('');
      return;
    }
    const { error: sendErr } = await sendSyncedMessage(inputText);
    if (sendErr) {
      alert(sendErr);
      return;
    }
    setInputText('');
  };

  const handleClearChat = () => {
    if (useLocalOnly) setLocalMessages([]);
    setShowClearModal(false);
    setShowMenu(false);
  };

  const handleDeleteChat = () => {
    setShowDeleteModal(false);
    setShowMenu(false);
    onBack();
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 bg-[#020617] flex flex-col z-[100]"
    >
      <CallOverlay
        visible={callUiActive}
        phase={rtc.phase}
        kind={rtc.callKind}
        peerName={chat.name}
        peerAvatar={chat.avatar}
        localStream={rtc.localStream}
        remoteStream={rtc.remoteStream}
        isMuted={rtc.isMuted}
        error={rtc.error}
        onAccept={rtc.acceptCall}
        onReject={rtc.rejectCall}
        onEnd={rtc.endCall}
        onToggleMute={rtc.toggleMute}
        onDismissError={rtc.clearError}
      />

      <AnimatePresence>
        {showInfo && (
          <ChatInfoScreen 
            key="chat-info-screen"
            chat={chat} 
            onBack={() => setShowInfo(false)} 
            onMemberClick={(member) => setSelectedMember(member)}
            currentUserRole={currentUserRole}
            members={members}
            onlyAdminsCanMessage={onlyAdminsCanMessage}
            setOnlyAdminsCanMessage={setOnlyAdminsCanMessage}
            onlyAdminsCanEditInfo={onlyAdminsCanEditInfo}
            setOnlyAdminsCanEditInfo={setOnlyAdminsCanEditInfo}
            ephemeralMessages={ephemeralMessages}
            setEphemeralMessages={setEphemeralMessages}
          />
        )}
        {selectedMember && (
          <MemberProfileScreen 
            key={`member-profile-${selectedMember.id}`}
            member={selectedMember} 
            onBack={() => setSelectedMember(null)} 
            currentUserRole={currentUserRole}
            onPromote={handlePromote}
            onBan={handleBan}
            canStartCall={canStartCall}
            callActive={callUiActive}
            onVoiceCall={() => void rtc.startCall('audio')}
            onVideoCall={() => void rtc.startCall('video')}
          />
        )}
        {showMenu && (
          <div 
            key="chat-menu-overlay"
            className="fixed inset-0 z-[110]" 
            onClick={() => setShowMenu(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="absolute top-16 right-4 w-56 bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[120]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="py-2">
                <MenuOption icon={<User size={18} />} label={chat.isGroup ? "Dados do grupo" : "Ver contato"} onClick={() => { setShowInfo(true); setShowMenu(false); }} />
                <MenuOption icon={<Image size={18} />} label="Mídia, links e docs" />
                <MenuOption icon={<Search size={18} />} label="Pesquisar" />
                <MenuOption icon={<BellOff size={18} />} label="Silenciar notificações" />
                <MenuOption icon={<Wallpaper size={18} />} label="Papel de parede" />
                <div className="h-px bg-white/5 my-1" />
                <MenuOption icon={<Eraser size={18} />} label="Limpar conversa" onClick={() => setShowClearModal(true)} />
                <MenuOption icon={<Trash2 size={18} className="text-red-500" />} label="Apagar conversa" onClick={() => setShowDeleteModal(true)} className="text-red-500" />
              </div>
            </motion.div>
          </div>
        )}

        {showClearModal && (
          <Modal 
            key="clear-chat-modal"
            title="Limpar conversa?" 
            description="Todas as mensagens desta conversa serão apagadas permanentemente."
            confirmLabel="Limpar"
            onConfirm={handleClearChat}
            onCancel={() => setShowClearModal(false)}
          />
        )}

        {showDeleteModal && (
          <Modal 
            key="delete-chat-modal"
            title="Apagar conversa?" 
            description="Esta conversa será removida da sua lista de chats."
            confirmLabel="Apagar"
            onConfirm={handleDeleteChat}
            onCancel={() => setShowDeleteModal(false)}
            isDanger
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 relative z-50">
        <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => setShowInfo(true)}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onBack();
            }} 
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="relative">
            <img src={chat.avatar} alt={chat.name} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
            {chat.online && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-brand border-2 border-[#020617] rounded-full"></span>
            )}
          </div>
          <div>
            <h3 className="font-bold text-sm">{chat.name}</h3>
            <p className="text-[10px] text-brand font-medium">
              {chat.isGroup ? `${chat.members || '10'} membros` : (chat.online ? 'Online' : 'Visto por último às 10:00')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            title={canStartCall ? 'Chamada de vídeo' : chat.isGroup ? 'Chamadas em grupo em breve' : 'Indisponível'}
            disabled={!canStartCall || callUiActive}
            onClick={() => void rtc.startCall('video')}
            className={cn(
              'p-2 rounded-full transition-colors',
              canStartCall && !callUiActive ? 'hover:bg-white/10 text-gray-400' : 'text-gray-600 opacity-50 cursor-not-allowed'
            )}
          >
            <Video size={20} />
          </button>
          <button
            type="button"
            title={canStartCall ? 'Chamada de voz' : chat.isGroup ? 'Chamadas em grupo em breve' : 'Indisponível'}
            disabled={!canStartCall || callUiActive}
            onClick={() => void rtc.startCall('audio')}
            className={cn(
              'p-2 rounded-full transition-colors',
              canStartCall && !callUiActive ? 'hover:bg-white/10 text-gray-400' : 'text-gray-600 opacity-50 cursor-not-allowed'
            )}
          >
            <Phone size={20} />
          </button>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className={cn("p-2 rounded-full transition-colors", showMenu ? "bg-brand/20 text-brand" : "hover:bg-white/10 text-gray-400")}
          >
            <MoreVertical size={20} />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar relative bg-[#0a0f1a]">
        {/* Premium Tech Drawings Pattern - Subtle & High Quality */}
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300d285' fill-opacity='0.4'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10zM30 30h2v2h-2v-2zm0 40h2v2h-2v-2zM70 30h2v2h-2v-2zm0 40h2v2h-2v-2zM40 0h2v2h-2v-2zm0 40h2v2h-2v-2zM0 40h2v2H0v-2zm40 40h2v2h-2v-2zM0 80h2v2H0v-2zm10-70h2v2h-2v-2zm40 40h2v2h-2v-2zm20 20h2v2h-2v-2zM20 10c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm50 50c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}></div>
        
        {/* Vibrant Atmospheric Glows - Keeping the Lightened Feel */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-brand/25 via-brand/5 to-transparent pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-full h-96 bg-gradient-to-t from-brand/10 via-transparent to-transparent pointer-events-none"></div>
        
        {messagesError && (
          <div className="relative z-20 mx-4 mt-2 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-200/90">
            Modo offline: a base de dados ainda não tem a tabela de mensagens ou houve erro. Execute{' '}
            <code className="text-brand">supabase/migrations/001_wave_messaging.sql</code> no projeto Supabase e
            ative Realtime em <code className="text-brand">chat_messages</code>.
          </div>
        )}
        {messagesLoading && !useLocalOnly && (
          <p className="relative z-20 text-center text-xs text-gray-500 py-2">A carregar mensagens…</p>
        )}

        <div className="relative z-10 space-y-6">
          {displayMessages.map((msg) => (
            <div key={msg.id} className={cn(
              "flex flex-col max-w-[85%] group",
              msg.isMe ? "ml-auto items-end" : "mr-auto items-start"
            )}>
              <div className={cn(
                "px-4 py-3 rounded-[22px] text-sm shadow-xl relative overflow-hidden transition-all duration-300",
                msg.isMe 
                  ? "bg-brand text-[#020617] font-bold rounded-tr-none shadow-brand/20" 
                  : "bg-white/10 backdrop-blur-2xl rounded-tl-none border border-white/10 text-white"
              )}>
                {/* Subtle inner light effect for user messages */}
                {msg.isMe && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none"></div>
                )}
                <span className="relative z-10 leading-relaxed">{msg.text}</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5 px-1">
                <span className="text-[10px] text-gray-500 font-bold tracking-tight">{msg.time}</span>
                {msg.isMe && (
                  <div className="flex -space-x-1 opacity-80">
                    <span className="text-brand text-[10px] font-black">✓</span>
                    <span className="text-brand text-[10px] font-black">✓</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input Area - Clean & High Contrast */}
      <div className="p-4 bg-[#0a0f1a] border-t border-white/5">
        {chat.isGroup && !canUserMessage ? (
          <div className="flex items-center justify-center py-3 px-4 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-xs text-gray-500 font-medium italic">Somente oficiais podem enviar mensagens</p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 bg-white/5 rounded-2xl px-4 py-2 border border-white/10 focus-within:border-brand/40 focus-within:bg-white/10 transition-all">
              <button className="text-gray-400 hover:text-brand transition-colors"><Smile size={22} /></button>
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Mensagem" 
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 placeholder:text-gray-500"
              />
              <button className="text-gray-400 hover:text-brand transition-colors"><Paperclip size={22} /></button>
            </div>
            <button 
              onClick={handleSendMessage}
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg",
                inputText.trim() 
                  ? "bg-brand text-[#020617] shadow-brand/30 scale-105" 
                  : "bg-white/5 text-gray-500"
              )}
            >
              <Send size={22} fill={inputText.trim() ? "currentColor" : "none"} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function MemberProfileScreen({ 
  member, 
  onBack, 
  currentUserRole,
  onPromote,
  onBan,
  canStartCall,
  callActive,
  onVoiceCall,
  onVideoCall,
}: { 
  key?: string,
  member: Member, 
  onBack: () => void, 
  currentUserRole: GroupRole,
  onPromote: (id: string, role: GroupRole) => void,
  onBan: (id: string) => void,
  canStartCall?: boolean,
  callActive?: boolean,
  onVoiceCall?: () => void,
  onVideoCall?: () => void,
}) {
  const currentPriority = ROLE_CONFIG[currentUserRole].priority;
  const targetPriority = ROLE_CONFIG[member.role].priority;
  const canManage = currentPriority > targetPriority || currentUserRole === 'Marechal';

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 bg-[#020617] flex flex-col z-[120] overflow-y-auto no-scrollbar"
    >
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h3 className="font-bold text-lg">Perfil</h3>
        </div>
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400">
          <MoreVertical size={20} />
        </button>
      </header>

      <div className="flex flex-col items-center py-8 px-6 space-y-6 bg-gradient-to-b from-brand/5 to-transparent">
        <div className="relative">
          <img src={member.avatar} alt="" className="w-40 h-40 rounded-3xl object-cover shadow-2xl border-4 border-brand/20" />
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#020617] rounded-full flex items-center justify-center border-2 border-brand/20 shadow-lg">
            <span className="text-xl">{ROLE_CONFIG[member.role].icon}</span>
          </div>
        </div>
        
        <div className="text-center space-y-1">
          <h2 className="text-3xl font-black text-white">{member.name}</h2>
          <div className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-black text-[10px] uppercase tracking-widest",
            ROLE_CONFIG[member.role].bg,
            ROLE_CONFIG[member.role].color,
            ROLE_CONFIG[member.role].border
          )}>
            <span>{ROLE_CONFIG[member.role].icon}</span>
            <span>{ROLE_CONFIG[member.role].label}</span>
          </div>
        </div>

        <div className="flex justify-center gap-4 w-full px-4">
          <ProfileActionButton icon={<MessageSquare size={20} />} label="Mensagem" />
          <ProfileActionButton
            icon={<Phone size={20} />}
            label="Voz"
            disabled={!canStartCall || callActive}
            onClick={onVoiceCall}
            title={canStartCall ? 'Chamada de voz' : 'Indisponível'}
          />
          <ProfileActionButton
            icon={<Video size={20} />}
            label="Vídeo"
            disabled={!canStartCall || callActive}
            onClick={onVideoCall}
            title={canStartCall ? 'Chamada de vídeo' : 'Indisponível'}
          />
          <ProfileActionButton icon={<Search size={20} />} label="Pesquisar" />
        </div>
      </div>

      <div className="px-6 space-y-6 pb-12">
        {/* Administrative Actions */}
        {canManage && member.id !== 'me' && (
          <div className="glass p-5 rounded-3xl space-y-4 border border-brand/20">
            <h4 className="text-xs font-black text-brand uppercase tracking-widest">Ações de Comando</h4>
            <div className="space-y-2">
              {currentUserRole === 'Marechal' && (
                <button 
                  onClick={() => onPromote(member.id, member.role === 'General' ? 'Membro' : 'General')}
                  className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-2xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Star size={18} className="text-blue-400" />
                    <span className="text-sm font-medium">{member.role === 'General' ? 'Remover General' : 'Promover a General'}</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-600" />
                </button>
              )}
              
              {(currentUserRole === 'Marechal' || currentUserRole === 'General') && (
                <button 
                  onClick={() => onPromote(member.id, member.role === 'Capitão' ? 'Membro' : 'Capitão')}
                  className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-2xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Shield size={18} className="text-brand" />
                    <span className="text-sm font-medium">{member.role === 'Capitão' ? 'Remover Capitão' : 'Promover a Capitão'}</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-600" />
                </button>
              )}

              <button 
                onClick={() => onBan(member.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-red-500/5 rounded-2xl transition-colors text-red-500"
              >
                <div className="flex items-center gap-3">
                  <Trash2 size={18} />
                  <span className="text-sm font-medium">Banir do Grupo</span>
                </div>
                <ChevronRight size={16} className="text-gray-600" />
              </button>
            </div>
          </div>
        )}
        {/* About and Phone */}
        <div className="glass p-5 rounded-3xl space-y-4">
          <div className="space-y-1">
            <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">Recado e número de telefone</h4>
            <p className="text-sm text-white font-medium">{member.status || 'Disponível'}</p>
            <p className="text-xs text-gray-500">12 de março</p>
          </div>
          <div className="h-px bg-white/5" />
          <div className="flex items-center justify-between">
            <p className="text-sm text-white font-medium">{member.phone || '+55 00 00000-0000'}</p>
            <div className="flex gap-3">
              <MessageSquare size={18} className="text-brand" />
              <Phone size={18} className="text-brand" />
              <Video size={18} className="text-brand" />
            </div>
          </div>
        </div>

        {/* Media, Links and Docs */}
        <div className="glass p-5 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">Mídia, links e docs</h4>
            <div className="flex items-center gap-1 text-brand text-xs font-bold">
              <span>24</span>
              <ArrowLeft size={14} className="rotate-180" />
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {[1, 2, 3, 4].map(i => (
              <img 
                key={`media-${i}`} 
                src={`https://picsum.photos/seed/media${i}${member.id}/100/100`} 
                alt="" 
                className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border border-white/5" 
              />
            ))}
          </div>
        </div>

        {/* Settings List */}
        <div className="glass rounded-3xl overflow-hidden">
          <ProfileListItem icon={<BellOff size={20} />} label="Silenciar notificações" />
          <ProfileListItem icon={<Image size={20} />} label="Visibilidade de mídia" />
          <ProfileListItem icon={<Wallpaper size={20} />} label="Papel de parede" />
        </div>

        {/* Encryption */}
        <div className="glass p-5 rounded-3xl space-y-2">
          <div className="flex items-center gap-3">
            <div className="text-brand"><AlertCircle size={20} /></div>
            <div>
              <h4 className="text-sm font-bold text-white">Criptografia</h4>
              <p className="text-xs text-gray-500 leading-relaxed">As mensagens e as chamadas são protegidas com a criptografia de ponta a ponta da Wave.</p>
            </div>
          </div>
        </div>

        {/* Common Groups */}
        <div className="space-y-4">
          <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest px-1">Grupos em comum</h4>
          <div className="glass p-4 rounded-3xl flex items-center gap-4">
            <img src="https://picsum.photos/seed/tech/100/100" alt="" className="w-12 h-12 rounded-xl object-cover" />
            <div className="flex-1">
              <h5 className="text-sm font-bold text-white">Comunidade Tech Wave</h5>
              <p className="text-xs text-gray-500">Lucas, Ana, João e mais 3.000</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <button className="w-full py-4 rounded-2xl bg-red-500/10 text-red-500 font-bold border border-red-500/20 flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all">
            <Trash2 size={18} /> Bloquear {member.name.split(' ')[0]}
          </button>
          <button className="w-full py-4 rounded-2xl bg-red-500/10 text-red-500 font-bold border border-red-500/20 flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all">
            <AlertCircle size={18} /> Denunciar {member.name.split(' ')[0]}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ProfileActionButton({
  icon,
  label,
  onClick,
  disabled,
  title,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex-1 flex flex-col items-center gap-2 p-3 glass rounded-2xl transition-all',
        disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/10'
      )}
    >
      <div className="text-brand">{icon}</div>
      <span className="text-[10px] font-bold text-brand uppercase tracking-wider">{label}</span>
    </button>
  );
}

function ProfileListItem({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
      <div className="flex items-center gap-4">
        <div className="text-gray-500">{icon}</div>
        <span className="text-sm font-medium text-gray-200">{label}</span>
      </div>
      <ArrowLeft size={16} className="rotate-180 text-gray-600" />
    </button>
  );
}

function MenuOption({ icon, label, onClick, className }: { icon: React.ReactNode, label: string, onClick?: () => void, className?: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-white/5 transition-colors text-left",
        className
      )}
    >
      <span className="opacity-70">{icon}</span>
      {label}
    </button>
  );
}

function Modal({ title, description, confirmLabel, onConfirm, onCancel, isDanger }: { key?: string, title: string, description: string, confirmLabel: string, onConfirm: () => void, onCancel: () => void, isDanger?: boolean }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-6 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-xs bg-[#1e293b] rounded-3xl p-6 shadow-2xl border border-white/10"
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={cn("p-3 rounded-2xl", isDanger ? "bg-red-500/10 text-red-500" : "bg-brand/10 text-brand")}>
            <AlertCircle size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
          </div>
          <div className="flex flex-col w-full gap-2 pt-2">
            <button 
              onClick={onConfirm}
              className={cn(
                "w-full py-3 rounded-2xl font-bold transition-all",
                isDanger ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-brand text-[#020617] shadow-lg shadow-brand/20"
              )}
            >
              {confirmLabel}
            </button>
            <button 
              onClick={onCancel}
              className="w-full py-3 rounded-2xl font-bold text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

function ChatInfoScreen({ 
  chat, 
  onBack, 
  onMemberClick,
  currentUserRole,
  members,
  onlyAdminsCanMessage,
  setOnlyAdminsCanMessage,
  onlyAdminsCanEditInfo,
  setOnlyAdminsCanEditInfo,
  ephemeralMessages,
  setEphemeralMessages
}: { 
  key?: string,
  chat: any, 
  onBack: () => void, 
  onMemberClick: (member: any) => void,
  currentUserRole: GroupRole,
  members: Member[],
  onlyAdminsCanMessage?: boolean,
  setOnlyAdminsCanMessage?: (val: boolean) => void,
  onlyAdminsCanEditInfo?: boolean,
  setOnlyAdminsCanEditInfo?: (val: boolean) => void,
  ephemeralMessages?: boolean,
  setEphemeralMessages?: (val: boolean) => void
}) {
  const isHighOfficer = ['Marechal', 'General'].includes(currentUserRole);

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 bg-[#020617] flex flex-col z-[110] overflow-y-auto no-scrollbar"
    >
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h3 className="font-bold text-lg">{chat.isGroup ? 'Info do Grupo' : 'Perfil'}</h3>
        </div>
      </header>

      <div className="flex flex-col items-center py-8 px-6 space-y-4">
        <div className="relative">
          <img src={chat.avatar} alt="" className="w-32 h-32 rounded-3xl object-cover shadow-2xl border-4 border-brand/20" />
          {chat.isGroup && (
            <div className="absolute -bottom-2 -right-2 bg-brand text-[#020617] font-black px-2 py-1 rounded-lg text-[10px] border-2 border-[#020617]">
              COMANDO
            </div>
          )}
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black">{chat.name}</h2>
          <p className="text-brand font-bold text-sm mt-1">{chat.isGroup ? `${chat.members || '10'} membros` : (chat.online ? 'Online' : 'Visto por último às 10:00')}</p>
        </div>
      </div>

      <div className="px-6 space-y-6 pb-10">
        <div className="glass p-5 rounded-3xl space-y-2">
          <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">Descrição</h4>
          <p className="text-sm text-gray-300 leading-relaxed">
            {chat.description || 'Este é um espaço para conexões reais e conversas inspiradoras na Wave.'}
          </p>
        </div>

        {chat.isGroup && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">{chat.members || '10'} Membros</h4>
              <button className="text-brand text-xs font-bold">Ver Todos</button>
            </div>
            
            {isHighOfficer && (
              <div className="glass p-5 rounded-3xl space-y-4 border border-brand/20">
                <h4 className="text-xs font-black text-brand uppercase tracking-widest">Protocolos de Segurança</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">Enviar mensagens</p>
                      <p className="text-[10px] text-gray-500">Apenas oficiais podem enviar mensagens</p>
                    </div>
                    <button 
                      onClick={() => setOnlyAdminsCanMessage?.(!onlyAdminsCanMessage)}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative",
                        onlyAdminsCanMessage ? "bg-brand" : "bg-white/10"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                        onlyAdminsCanMessage ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">Editar dados do grupo</p>
                      <p className="text-[10px] text-gray-500">Mudar nome, imagem e descrição</p>
                    </div>
                    <button 
                      onClick={() => setOnlyAdminsCanEditInfo?.(!onlyAdminsCanEditInfo)}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative",
                        onlyAdminsCanEditInfo ? "bg-brand" : "bg-white/10"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                        onlyAdminsCanEditInfo ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">Mensagens temporárias</p>
                      <p className="text-[10px] text-gray-500">Auto-destruição em 24h</p>
                    </div>
                    <button 
                      onClick={() => setEphemeralMessages?.(!ephemeralMessages)}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative",
                        ephemeralMessages ? "bg-brand" : "bg-white/10"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                        ephemeralMessages ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {members.map((member) => (
                <div 
                  key={member.id} 
                  onClick={() => onMemberClick(member)}
                  className="flex items-center justify-between group cursor-pointer hover:bg-white/5 p-2 rounded-2xl transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={member.avatar} alt="" className="w-10 h-10 rounded-full border border-white/10" />
                      <div className="absolute -bottom-1 -right-1 text-[8px] bg-[#020617] rounded-full p-0.5 border border-white/10">
                        {ROLE_CONFIG[member.role].icon}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold">{member.name}</p>
                      <p className="text-[10px] text-gray-500">{member.status.substring(0, 20)}...</p>
                    </div>
                  </div>
                  <div className={cn(
                    "text-[8px] font-black px-2 py-0.5 rounded-md border",
                    ROLE_CONFIG[member.role].bg,
                    ROLE_CONFIG[member.role].color,
                    ROLE_CONFIG[member.role].border
                  )}>
                    {ROLE_CONFIG[member.role].label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button className="w-full py-4 rounded-2xl bg-red-500/10 text-red-500 font-bold border border-red-500/20 hover:bg-red-500/20 transition-all">
            {chat.isGroup ? 'Sair do Grupo' : 'Bloquear Contato'}
          </button>
          <button className="w-full py-4 rounded-2xl bg-white/5 text-gray-400 font-bold border border-white/10 hover:bg-white/10 transition-all">
            Denunciar
          </button>
        </div>
      </div>
    </motion.div>
  );
}
