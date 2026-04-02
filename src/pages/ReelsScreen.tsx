import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Share2, Music, UserPlus, MoreVertical, Volume2, VolumeX, Camera } from 'lucide-react';
import { cn } from '../lib/utils';

const reelsData = [
  {
    id: 'reel-1',
    user: { name: 'lucas_silva', avatar: 'https://i.pravatar.cc/150?u=lucas' },
    description: 'Vibe de hoje! 🌊 #praia #verao #wave',
    music: 'Matuê - Vampiro',
    video: 'https://picsum.photos/seed/beach_reel/1080/1920',
    likes: '125K',
    comments: '1.2K',
    shares: '45K'
  },
  {
    id: 'reel-2',
    user: { name: 'ana_clara', avatar: 'https://i.pravatar.cc/150?u=ana' },
    description: 'Aquela resenha com os amigos! 🍻 #resenha #amigos',
    music: 'Simone Mendes - Erro Gostoso',
    video: 'https://picsum.photos/seed/party_reel/1080/1920',
    likes: '89K',
    comments: '850',
    shares: '12K'
  },
  {
    id: 'reel-3',
    user: { name: 'dj_topo', avatar: 'https://i.pravatar.cc/150?u=topo' },
    description: 'Novo set saindo! 🔥 #funk #dj #topo',
    music: 'DJ Topo - MTG Quero Te Encontrar',
    video: 'https://picsum.photos/seed/dj_reel/1080/1920',
    likes: '210K',
    comments: '3.4K',
    shares: '98K'
  },
  {
    id: 'reel-4',
    user: { name: 'marilia_fã', avatar: 'https://i.pravatar.cc/150?u=marilia' },
    description: 'Eterna Rainha! 👑 #mariliamendonca #sertanejo',
    music: 'Marília Mendonça - Leão',
    video: 'https://picsum.photos/seed/concert_reel/1080/1920',
    likes: '500K',
    comments: '15K',
    shares: '120K'
  }
];

export default function ReelsScreen({ onProfileClick }: { onProfileClick?: (user: any) => void }) {
  const [isMuted, setIsMuted] = useState(false);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());

  const toggleLike = (id: string) => {
    const newLiked = new Set(likedReels);
    if (newLiked.has(id)) newLiked.delete(id);
    else newLiked.add(id);
    setLikedReels(newLiked);
  };

  const toggleFollow = (userName: string) => {
    const newFollowing = new Set(followingUsers);
    if (newFollowing.has(userName)) newFollowing.delete(userName);
    else newFollowing.add(userName);
    setFollowingUsers(newFollowing);
  };

  return (
    <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-black relative">
      {reelsData.map((reel) => (
        <ReelItem 
          key={reel.id} 
          reel={reel} 
          isMuted={isMuted} 
          onToggleMute={() => setIsMuted(!isMuted)}
          isLiked={likedReels.has(reel.id)}
          onToggleLike={() => toggleLike(reel.id)}
          isFollowing={followingUsers.has(reel.user.name)}
          onToggleFollow={() => toggleFollow(reel.user.name)}
          onProfileClick={() => onProfileClick?.(reel.user)}
        />
      ))}
    </div>
  );
}

function ReelItem({ reel, isMuted, onToggleMute, isLiked, onToggleLike, isFollowing, onToggleFollow, onProfileClick }: { 
  key?: string,
  reel: typeof reelsData[0], 
  isMuted: boolean, 
  onToggleMute: () => void,
  isLiked: boolean,
  onToggleLike: () => void,
  isFollowing: boolean,
  onToggleFollow: () => void,
  onProfileClick: () => void
}) {
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);

  const handleDoubleTap = () => {
    if (!isLiked) onToggleLike();
    setShowHeartAnimation(true);
    setTimeout(() => setShowHeartAnimation(false), 1000);
  };

  return (
    <div className="h-full w-full snap-start relative flex flex-col justify-end">
      {/* Video Background (Placeholder Image) */}
      <div 
        className="absolute inset-0 z-0"
        onDoubleClick={handleDoubleTap}
      >
        <img 
          src={reel.video} 
          alt="" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
      </div>

      {/* Heart Animation on Double Tap */}
      <AnimatePresence>
        {showHeartAnimation && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
          >
            <Heart fill="#E50914" className="text-[#E50914] w-24 h-24 drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Side Actions */}
      <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-20">
        <div className="flex flex-col items-center gap-1">
          <button 
            onClick={onToggleLike}
            className="p-2 rounded-full transition-all active:scale-125"
          >
            <Heart 
              size={32} 
              fill={isLiked ? "#E50914" : "none"} 
              className={cn(isLiked ? "text-[#E50914]" : "text-white")} 
            />
          </button>
          <span className="text-xs font-bold text-white shadow-sm">{reel.likes}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button className="p-2 rounded-full text-white active:scale-125 transition-all">
            <MessageCircle size={32} />
          </button>
          <span className="text-xs font-bold text-white shadow-sm">{reel.comments}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button className="p-2 rounded-full text-white active:scale-125 transition-all">
            <Share2 size={32} />
          </button>
          <span className="text-xs font-bold text-white shadow-sm">{reel.shares}</span>
        </div>

        <button className="p-2 rounded-full text-white active:scale-125 transition-all">
          <MoreVertical size={28} />
        </button>

        <div 
          onClick={onProfileClick}
          className="w-8 h-8 rounded-lg border-2 border-white overflow-hidden animate-spin-slow cursor-pointer"
        >
          <img src={reel.user.avatar} alt="" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Bottom Info */}
      <div className="p-6 pb-10 z-20 w-full max-w-[80%]">
        <div className="flex items-center gap-3 mb-4">
          <div 
            onClick={onProfileClick}
            className="relative cursor-pointer"
          >
            <img src={reel.user.avatar} alt="" className="w-10 h-10 rounded-full border-2 border-white" />
            <AnimatePresence>
              {!isFollowing && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -bottom-1 -right-1 bg-brand rounded-full p-0.5 border border-black"
                >
                  <UserPlus size={10} className="text-black" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <span 
            onClick={onProfileClick}
            className="font-bold text-white text-sm cursor-pointer"
          >
            @{reel.user.name}
          </span>
          <button 
            onClick={onToggleFollow}
            className={cn(
              "px-3 py-1 border rounded-lg text-[10px] font-bold transition-all",
              isFollowing 
                ? "bg-white/10 border-white/20 text-white" 
                : "border-brand bg-brand text-black hover:bg-brand/90"
            )}
          >
            {isFollowing ? 'Seguindo' : 'Seguir'}
          </button>
        </div>

        <p className="text-white text-sm mb-4 line-clamp-2 leading-relaxed">
          {reel.description}
        </p>

        <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full w-fit max-w-full">
          <Music size={14} className="text-brand animate-pulse" />
          <div className="overflow-hidden w-full">
            <p className="text-[11px] text-white font-medium whitespace-nowrap animate-marquee">
              {reel.music} • Som original
            </p>
          </div>
        </div>
      </div>

      {/* Mute Toggle Overlay */}
      <button 
        onClick={onToggleMute}
        className="absolute top-6 right-6 z-20 p-2 bg-black/20 backdrop-blur-md rounded-full text-white"
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
    </div>
  );
}
