import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Share2, Music, UserPlus, MoreVertical, Volume2, VolumeX, Camera, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../services/supabaseClient';

export default function ReelsScreen({ onProfileClick }: { onProfileClick?: (user: any) => void }) {
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reels')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Formata os dados do Supabase para o formato do componente
        const formattedReels = data.map(item => ({
          id: item.id,
          user: { name: item.user_name, avatar: item.user_avatar || `https://i.pravatar.cc/150?u=${item.user_name}` },
          description: item.description,
          music: item.music_name,
          video: item.video_url,
          likes: item.likes_count,
          comments: item.comments_count,
          shares: item.shares_count
        }));
        setReels(formattedReels);
      } else {
        setReels([]);
      }
    } catch (err) {
      console.error('Erro ao buscar reels:', err);
      setReels([]);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-black text-white gap-4">
        <Loader2 className="w-10 h-10 text-brand animate-spin" />
        <p className="text-sm font-medium animate-pulse">Carregando Reels...</p>
      </div>
    );
  }

  if (!loading && reels.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-black text-white px-8 text-center gap-3">
        <p className="text-sm font-medium text-gray-300">Ainda não há reels na base de dados.</p>
        <p className="text-xs text-gray-500 max-w-xs">
          Cria a tabela <code className="text-brand">reels</code> no Supabase e insere linhas com <code className="text-brand">video_url</code>, ou usa o SQL do teu projeto. Enquanto isso, esta secção fica vazia (sem vídeos de demonstração).
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-black relative">
      {reels.map((reel) => (
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
  reel: any, 
  isMuted: boolean, 
  onToggleMute: () => void,
  isLiked: boolean,
  onToggleLike: () => void,
  isFollowing: boolean,
  onToggleFollow: () => void,
  onProfileClick: () => void
}) {
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.7
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          videoRef.current?.play().catch(() => {});
        } else {
          videoRef.current?.pause();
        }
      });
    }, options);

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, []);

  const handleDoubleTap = () => {
    if (!isLiked) onToggleLike();
    setShowHeartAnimation(true);
    setTimeout(() => setShowHeartAnimation(false), 1000);
  };

  return (
    <div className="h-full w-full snap-start relative flex flex-col justify-end">
      {/* Video Background */}
      <div 
        className="absolute inset-0 z-0 bg-black"
        onDoubleClick={handleDoubleTap}
        onClick={onToggleMute}
      >
        <video 
          ref={videoRef}
          src={reel.video} 
          className="w-full h-full object-cover"
          loop
          muted={isMuted}
          playsInline
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
