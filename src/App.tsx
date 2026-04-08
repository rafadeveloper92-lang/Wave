import React, { useState } from 'react';
import { 
  MessageSquare, 
  Rss, 
  Users, 
  Compass, 
  User as UserIcon,
  Search,
  Bell,
  Plus,
  Play,
  Settings,
  Grid,
  Image as ImageIcon
} from 'lucide-react';
import { cn } from './lib/utils';
import ChatsScreen from './pages/ChatsScreen';
import ReelsScreen from './pages/ReelsScreen';
import GroupsScreen from './pages/GroupsScreen';
import DiscoverScreen from './pages/DiscoverScreen';
import ProfileScreen from './pages/ProfileScreen';
import TodosScreen from './pages/TodosScreen';
import ChatDetailScreen from './pages/ChatDetailScreen';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from './contexts/AuthContext';
import AuthScreen from './components/AuthScreen';
import { usePushRegistration } from './hooks/usePushRegistration';

type Tab = 'chats' | 'reels' | 'groups' | 'discover' | 'profile' | 'todos';

export default function App() {
  const { user, loading } = useAuth();
  usePushRegistration(user?.id ?? null);
  const [activeTab, setActiveTab] = useState<Tab>('chats');
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617] text-brand text-sm font-medium">
        A carregar…
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'chats': return <ChatsScreen onChatClick={(chat) => setSelectedChat(chat)} />;
      case 'reels': return <ReelsScreen onProfileClick={(user) => setSelectedProfile(user)} />;
      case 'groups': return <GroupsScreen onGroupClick={(group) => setSelectedGroup(group)} />;
      case 'discover': return <DiscoverScreen />;
      case 'profile': return <ProfileScreen />;
      case 'todos': return <TodosScreen />;
      default: return <ChatsScreen onChatClick={(chat) => setSelectedChat(chat)} />;
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#020617] bg-main-gradient overflow-hidden shadow-2xl relative font-sans selection:bg-brand/30">
      <AnimatePresence>
        {selectedChat && (
          <ChatDetailScreen 
            key={`chat-detail-${selectedChat.id}`}
            chat={selectedChat} 
            onBack={() => setSelectedChat(null)} 
          />
        )}
        {selectedGroup && (
          <ChatDetailScreen 
            key={`group-detail-${selectedGroup.id}`}
            chat={{ ...selectedGroup, isGroup: true }} 
            onBack={() => setSelectedGroup(null)} 
          />
        )}
        {selectedStory && (
          <StoryViewer 
            key={`story-viewer-${selectedStory.id}`}
            story={selectedStory} 
            onBack={() => setSelectedStory(null)} 
          />
        )}
        {selectedVideo && (
          <VideoPlayer 
            key={`video-player-${selectedVideo.id}`}
            video={selectedVideo} 
            onBack={() => setSelectedVideo(null)} 
          />
        )}
        {selectedProfile && (
          <ProfileViewer 
            key={`profile-viewer-${selectedProfile.name}`}
            user={selectedProfile} 
            onBack={() => setSelectedProfile(null)} 
          />
        )}
      </AnimatePresence>
      {/* Top Bar */}
      <header className="px-5 py-5 flex justify-between items-center bg-gradient-to-b from-[#064e3b] to-[#020617] sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_8px_rgba(45,212,191,0.6)]">
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2dd4bf" />
                  <stop offset="100%" stopColor="#0d9488" />
                </linearGradient>
              </defs>
              {/* The stylized W */}
              <path 
                d="M6 16L12 32L18 18L24 32L30 12" 
                stroke="url(#logoGradient)" 
                strokeWidth="5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              {/* The signal bars (Wi-Fi style) */}
              <path 
                d="M26 10C28.5 7.5 32 7.5 34.5 10" 
                stroke="url(#logoGradient)" 
                strokeWidth="3" 
                strokeLinecap="round"
              />
              <path 
                d="M23 6C27 2 33.5 2 37.5 6" 
                stroke="url(#logoGradient)" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                opacity="0.7"
              />
              <path 
                d="M20 2C26 -4 35 -4 41 2" 
                stroke="url(#logoGradient)" 
                strokeWidth="2" 
                strokeLinecap="round" 
                opacity="0.4"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-white drop-shadow-md">Wave</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0">
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
              <Search size={24} strokeWidth={2.5} />
            </button>
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors relative text-white">
              <Bell size={24} strokeWidth={2.5} />
            </button>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-brand p-0.5 shadow-[0_0_10px_rgba(45,212,191,0.3)]">
            <img 
              src="https://i.pravatar.cc/150?u=me" 
              alt="Me" 
              className="w-full h-full rounded-full cursor-pointer object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-28 no-scrollbar">
        {renderScreen()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#020617]/80 backdrop-blur-3xl border-t border-white/5 px-5 py-3 flex justify-between items-center z-50">
        <NavButton 
          active={activeTab === 'chats'} 
          onClick={() => setActiveTab('chats')} 
          icon={<MessageSquare size={24} strokeWidth={2.5} />} 
          label="Chats" 
        />
        <NavButton 
          active={activeTab === 'reels'} 
          onClick={() => setActiveTab('reels')} 
          icon={<Play size={24} strokeWidth={2.5} />} 
          label="Reels" 
        />
        <NavButton 
          active={activeTab === 'groups'} 
          onClick={() => setActiveTab('groups')} 
          icon={<Users size={24} strokeWidth={2.5} />} 
          label="Groups" 
        />
        <NavButton 
          active={activeTab === 'discover'} 
          onClick={() => setActiveTab('discover')} 
          icon={<Compass size={24} strokeWidth={2.5} />} 
          label="Discover" 
        />
        <NavButton 
          active={activeTab === 'todos'} 
          onClick={() => setActiveTab('todos')} 
          icon={<Plus size={24} strokeWidth={2.5} />} 
          label="Todos" 
        />
        <NavButton 
          active={activeTab === 'profile'} 
          onClick={() => setActiveTab('profile')} 
          icon={<UserIcon size={24} strokeWidth={2.5} />} 
          label="Profile" 
        />
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all duration-300",
        active ? "text-brand scale-110" : "text-gray-500 hover:text-gray-300"
      )}
    >
      {icon}
      <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
    </button>
  );
}

function StoryViewer({ story, onBack }: { key?: string, story: any, onBack: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col"
    >
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <img src={story.avatar} alt="" className="w-10 h-10 rounded-full border-2 border-brand" />
          <span className="font-bold text-white">{story.name}</span>
        </div>
        <button onClick={onBack} className="text-white bg-white/10 p-2 rounded-full">✕</button>
      </div>
      <div className="flex-1 relative">
        <img src={`https://picsum.photos/seed/${story.id}/1080/1920`} alt="" className="w-full h-full object-cover" />
        <div className="absolute bottom-10 left-0 right-0 px-10">
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 5 }}
              onAnimationComplete={onBack}
              className="h-full bg-brand"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function VideoPlayer({ video, onBack }: { key?: string, video: any, onBack: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col"
    >
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <img src={video.user.avatar} alt="" className="w-10 h-10 rounded-full" />
          <span className="font-bold text-white">{video.title}</span>
        </div>
        <button onClick={onBack} className="text-white bg-white/10 p-2 rounded-full">✕</button>
      </div>
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="relative w-full aspect-video">
          <img src={video.content} alt="" className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Play fill="white" size={64} className="text-white" />
          </div>
        </div>
      </div>
      <div className="p-10 bg-gradient-to-t from-black to-transparent">
        <h3 className="text-xl font-bold text-white">{video.title}</h3>
        <p className="text-gray-400 mt-2">Shared by {video.user.name}</p>
      </div>
    </motion.div>
  );
}

function ProfileViewer({ user, onBack }: { key?: string, user: any, onBack: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="fixed inset-0 z-[600] bg-[#020617] flex flex-col no-scrollbar overflow-y-auto"
    >
      {/* Cover Photo Area */}
      <div className="relative h-72 w-full overflow-hidden shrink-0">
        <img 
          src={`https://picsum.photos/seed/cover-${user.name}/800/600`} 
          alt="Cover" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#020617]" />
        
        {/* Header Overlays */}
        <div className="absolute top-8 left-6 flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white border border-white/10 hover:bg-white/20 transition-all">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h2 className="text-2xl font-bold text-white drop-shadow-lg">@{user.name}</h2>
        </div>
        
        <button className="absolute top-8 right-6 p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white border border-white/10 hover:bg-white/20 transition-all">
          <Settings size={24} />
        </button>
      </div>

      {/* Profile Content Card */}
      <div className="px-6 -mt-24 relative z-10 pb-20">
        <div className="flex flex-col items-center">
          {/* Glowing Profile Picture */}
          <div className="relative group">
            <div className="w-44 h-44 rounded-full p-1.5 bg-gradient-to-tr from-brand via-brand/40 to-brand flex items-center justify-center shadow-[0_0_30px_rgba(45,212,191,0.3)]">
              <div className="w-full h-full rounded-full p-1 bg-[#020617] flex items-center justify-center">
                <div className="w-full h-full rounded-full p-1 border-2 border-brand/30">
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-full h-full rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>
            <div className="absolute bottom-4 right-4 bg-brand w-6 h-6 rounded-full border-4 border-[#020617]" />
          </div>

          {/* Info Card */}
          <div className="w-full mt-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-8 text-center space-y-6 shadow-2xl">
            <div>
              <h3 className="text-4xl font-bold text-white tracking-tight">@{user.name}</h3>
              <p className="text-gray-400 mt-4 leading-relaxed max-w-[280px] mx-auto">
                Criador de conteúdo apaixonado por tecnologia e inovação. Wave Community.
              </p>
            </div>

            <div className="pt-6 border-t border-white/5 flex justify-between items-center px-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">12.5K</p>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-1">Seguidores</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">450</p>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-1">Seguindo</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">1.2M</p>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-1">Curtidas</p>
              </div>
            </div>

            <div className="flex gap-3 w-full pt-4">
              <button className="flex-1 py-4 bg-brand text-black font-bold rounded-2xl shadow-lg shadow-brand/20 active:scale-95 transition-all">
                Seguir
              </button>
              <button className="flex-1 py-4 bg-white/5 text-white font-bold rounded-2xl border border-white/10 active:scale-95 transition-all">
                Mensagem
              </button>
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div className="mt-10 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-xl text-white">Posts</h3>
            <div className="flex gap-4">
              <button className="text-brand"><Grid size={22} /></button>
              <button className="text-gray-500"><ImageIcon size={22} /></button>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <div key={i} className="aspect-[3/4] bg-white/5 rounded-2xl overflow-hidden group relative cursor-pointer border border-white/5">
                <img 
                  src={`https://picsum.photos/seed/post-${i}-${user.name}/300/400`} 
                  alt="" 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-bold text-white drop-shadow-lg">
                  <Play size={12} fill="white" />
                  {Math.floor(Math.random() * 100)}K
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
