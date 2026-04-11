import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Share2, Music, UserPlus, MoreVertical, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../services/supabaseClient';
import { fetchYouTubeReelSources, youtubeEmbedUrl } from '../lib/youtubeReels';

type ReelRow = {
  id: string;
  user: { name: string; avatar: string };
  description: string;
  music: string;
  /** URL direta (mp4 / Supabase) */
  video?: string | null;
  /** Short do YouTube */
  youtubeId?: string;
  likes: string;
  comments: string;
  shares: string;
};

export default function ReelsScreen({ onProfileClick }: { onProfileClick?: (user: any) => void }) {
  const [reels, setReels] = useState<ReelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());

  const fetchReels = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('reels').select('*').order('created_at', { ascending: false });

      if (error) throw error;

      let list: ReelRow[] = [];

      if (data && data.length > 0) {
        list = data.map((item) => ({
          id: String(item.id),
          user: {
            name: item.user_name,
            avatar: item.user_avatar || `https://i.pravatar.cc/150?u=${encodeURIComponent(String(item.user_name))}`,
          },
          description: item.description,
          music: item.music_name,
          video: item.video_url,
          likes: String(item.likes_count ?? '—'),
          comments: String(item.comments_count ?? '—'),
          shares: String(item.shares_count ?? '—'),
        }));
      }

      if (list.length === 0) {
        const yt = await fetchYouTubeReelSources();
        list = yt.map((s) => ({
          id: s.id,
          user: {
            name: s.channelTitle.replace(/\s+/g, '_').slice(0, 28) || 'youtube',
            avatar: s.channelThumb || `https://i.pravatar.cc/150?u=${encodeURIComponent(s.channelTitle)}`,
          },
          description: s.title,
          music: 'YouTube Shorts',
          youtubeId: s.youtubeId,
          likes: '—',
          comments: '—',
          shares: '—',
        }));
      }

      setReels(list);
    } catch (err) {
      console.error('Erro ao buscar reels:', err);
      try {
        const yt = await fetchYouTubeReelSources();
        setReels(
          yt.map((s) => ({
            id: s.id,
            user: {
              name: s.channelTitle.replace(/\s+/g, '_').slice(0, 28) || 'youtube',
              avatar: s.channelThumb || `https://i.pravatar.cc/150?u=${encodeURIComponent(s.channelTitle)}`,
            },
            description: s.title,
            music: 'YouTube Shorts',
            youtubeId: s.youtubeId,
            likes: '—',
            comments: '—',
            shares: '—',
          }))
        );
      } catch {
        setReels([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReels();
  }, [fetchReels]);

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
        <p className="text-sm font-medium animate-pulse">A carregar Reels…</p>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-black text-white px-8 text-center gap-3">
        <p className="text-sm font-medium text-gray-300">Não foi possível carregar vídeos.</p>
        <p className="text-xs text-gray-500 max-w-xs">
          Configura <code className="text-brand">VITE_YOUTUBE_API_KEY</code> (e opcionalmente playlist ou pesquisa) no{' '}
          <code className="text-brand">.env</code>, ou preenche a tabela <code className="text-brand">reels</code> no Supabase.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-black relative">
      {reels.map((reel) => (
        <React.Fragment key={reel.id}>
          <ReelItem
            reel={reel}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(!isMuted)}
            isLiked={likedReels.has(reel.id)}
            onToggleLike={() => toggleLike(reel.id)}
            isFollowing={followingUsers.has(reel.user.name)}
            onToggleFollow={() => toggleFollow(reel.user.name)}
            onProfileClick={() => onProfileClick?.(reel.user)}
          />
        </React.Fragment>
      ))}
    </div>
  );
}

function ReelItem({
  reel,
  isMuted,
  onToggleMute,
  isLiked,
  onToggleLike,
  isFollowing,
  onToggleFollow,
  onProfileClick,
}: {
  reel: ReelRow;
  isMuted: boolean;
  onToggleMute: () => void;
  isLiked: boolean;
  onToggleLike: () => void;
  isFollowing: boolean;
  onToggleFollow: () => void;
  onProfileClick: () => void;
}) {
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [ytActive, setYtActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = reel.youtubeId ? ytRootRef.current : videoRef.current;
    if (!el) return;

    const options = { root: null, rootMargin: '0px', threshold: 0.55 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (reel.youtubeId) {
          setYtActive(entry.isIntersecting);
        } else if (videoRef.current) {
          if (entry.isIntersecting) {
            void videoRef.current.play().catch(() => {});
          } else {
            videoRef.current.pause();
          }
        }
      });
    }, options);

    observer.observe(el);
    return () => observer.disconnect();
  }, [reel.youtubeId]);

  const handleDoubleTap = () => {
    if (!isLiked) onToggleLike();
    setShowHeartAnimation(true);
    setTimeout(() => setShowHeartAnimation(false), 1000);
  };

  const embedSrc =
    reel.youtubeId && ytActive
      ? youtubeEmbedUrl(reel.youtubeId, { autoplay: true, muted: isMuted })
      : null;

  return (
    <div className="h-full w-full snap-start relative flex flex-col justify-end">
      <div
        ref={reel.youtubeId ? ytRootRef : undefined}
        className="absolute inset-0 z-0 bg-black"
        onDoubleClick={handleDoubleTap}
        onClick={onToggleMute}
      >
        {reel.youtubeId ? (
          <>
            {embedSrc ? (
              <iframe
                key={`${reel.youtubeId}-${isMuted}`}
                title={reel.description}
                src={embedSrc}
                className="absolute left-1/2 top-1/2 min-w-full min-h-full w-[177.78vh] h-[56.25vw] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-brand/60 animate-spin" />
              </div>
            )}
          </>
        ) : (
          <video
            ref={videoRef}
            src={reel.video || undefined}
            className="w-full h-full object-cover"
            loop
            muted={isMuted}
            playsInline
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />
      </div>

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

      <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-20">
        <div className="flex flex-col items-center gap-1">
          <button type="button" onClick={onToggleLike} className="p-2 rounded-full transition-all active:scale-125">
            <Heart size={32} fill={isLiked ? '#E50914' : 'none'} className={cn(isLiked ? 'text-[#E50914]' : 'text-white')} />
          </button>
          <span className="text-xs font-bold text-white shadow-sm">{reel.likes}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button type="button" className="p-2 rounded-full text-white active:scale-125 transition-all">
            <MessageCircle size={32} />
          </button>
          <span className="text-xs font-bold text-white shadow-sm">{reel.comments}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button type="button" className="p-2 rounded-full text-white active:scale-125 transition-all">
            <Share2 size={32} />
          </button>
          <span className="text-xs font-bold text-white shadow-sm">{reel.shares}</span>
        </div>

        <button type="button" className="p-2 rounded-full text-white active:scale-125 transition-all">
          <MoreVertical size={28} />
        </button>

        <div onClick={onProfileClick} className="w-8 h-8 rounded-lg border-2 border-white overflow-hidden animate-spin-slow cursor-pointer">
          <img src={reel.user.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
      </div>

      <div className="p-6 pb-10 z-20 w-full max-w-[80%]">
        <div className="flex items-center gap-3 mb-4">
          <div onClick={onProfileClick} className="relative cursor-pointer">
            <img src={reel.user.avatar} alt="" className="w-10 h-10 rounded-full border-2 border-white" referrerPolicy="no-referrer" />
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
          <span onClick={onProfileClick} className="font-bold text-white text-sm cursor-pointer">
            @{reel.user.name}
          </span>
          <button
            type="button"
            onClick={onToggleFollow}
            className={cn(
              'px-3 py-1 border rounded-lg text-[10px] font-bold transition-all',
              isFollowing ? 'bg-white/10 border-white/20 text-white' : 'border-brand bg-brand text-black hover:bg-brand/90'
            )}
          >
            {isFollowing ? 'Seguindo' : 'Seguir'}
          </button>
        </div>

        <p className="text-white text-sm mb-4 line-clamp-2 leading-relaxed">{reel.description}</p>

        <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full w-fit max-w-full">
          <Music size={14} className="text-brand animate-pulse" />
          <div className="overflow-hidden w-full">
            <p className="text-[11px] text-white font-medium whitespace-nowrap animate-marquee">
              {reel.music}
              {reel.youtubeId ? '' : ' • Som original'}
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggleMute}
        className="absolute top-6 right-6 z-20 p-2 bg-black/20 backdrop-blur-md rounded-full text-white"
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
    </div>
  );
}
