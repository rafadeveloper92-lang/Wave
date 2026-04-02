import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Type, Music, Search, Play, Pause, GripHorizontal, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  cover: string;
  previewUrl: string;
  duration: number; // in seconds
}

const mockMusic: MusicTrack[] = [
  // TikTok / Pop
  { id: 'm1', title: 'Flowers', artist: 'Miley Cyrus', cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=200&h=200&fit=crop', previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', duration: 180 },
  { id: 'm2', title: 'As It Was', artist: 'Harry Styles', cover: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=200&h=200&fit=crop', previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', duration: 167 },
  { id: 'm9', title: 'Cruel Summer', artist: 'Taylor Swift', cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=200&h=200&fit=crop', previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3', duration: 178 },
  
  // Sertanejo
  { id: 'm3', title: 'Erro Gostoso', artist: 'Simone Mendes', cover: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?w=200&h=200&fit=crop', previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', duration: 192 },
  { id: 'm4', title: 'Leão', artist: 'Marília Mendonça', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop', previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', duration: 166 },
  { id: 'm10', title: 'Oi Balde', artist: 'Zé Neto & Cristiano', cover: 'https://images.unsplash.com/photo-1453090927415-5f45085b65c0?w=200&h=200&fit=crop', previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', duration: 185 },
  { id: 'm11', title: 'Nosso Quadro', artist: 'Ana Castela', cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=200&h=200&fit=crop', previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3', duration: 174 },
  
  // Funk
  { id: 'm5', title: 'MTG Quero Te Encontrar', artist: 'DJ Topo', cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=200&fit=crop', previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', duration: 150 },
  { id: 'm6', title: 'Automotivo Bibi Fogosa', artist: 'Bibi Babydoll', cover: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?w=200&h=200&fit=crop', previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', duration: 145 },
  { id: 'm12', title: 'Dentro da Hilux', artist: 'Luan Pereira', cover: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=200&h=200&fit=crop', previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3', duration: 160 },
  
  // Rap / Trap
  { id: 'm7', title: 'Vampiro', artist: 'Matuê', cover: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=200&h=200&fit=crop', previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', duration: 210 },
  { id: 'm8', title: 'Conexões de Máfia', artist: 'Matuê ft. Rich the Kid', cover: 'https://images.unsplash.com/photo-1496293455970-f8581aae0e3c?w=200&h=200&fit=crop', previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', duration: 240 },
  { id: 'm13', title: 'Melhor Vibe', artist: 'Filipe Ret', cover: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?w=200&h=200&fit=crop', previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3', duration: 195 },
];

interface OverlayItem {
  id: string;
  type: 'text' | 'music';
  content: string;
  artist?: string;
  cover?: string;
  previewUrl?: string;
  startTime?: number;
  font?: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

interface StatusEditorProps {
  image: string;
  onCancel: () => void;
  onSave: (data: { image: string, overlays: OverlayItem[] }) => void;
}

export default function StatusEditor({ image, onCancel, onSave }: StatusEditorProps) {
  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const [showMusicLibrary, setShowMusicLibrary] = useState(false);
  const [musicSearchQuery, setMusicSearchQuery] = useState('');
  const [editingMusicId, setEditingMusicId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [selectedFont, setSelectedFont] = useState('font-sans');
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Pinch to zoom state
  const [initialDistance, setInitialDistance] = useState<number | null>(null);
  const [initialScale, setInitialScale] = useState<number>(1);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        setPlayingTrackId(null);
      }
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent, overlayId: string) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      setInitialDistance(dist);
      const overlay = overlays.find(o => o.id === overlayId);
      if (overlay) setInitialScale(overlay.scale);
    }
  };

  const handleTouchMove = (e: React.TouchEvent, overlayId: string) => {
    if (e.touches.length === 2 && initialDistance !== null) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      const scaleChange = dist / initialDistance;
      const newScale = Math.min(Math.max(initialScale * scaleChange, 0.5), 4);
      updateOverlay(overlayId, { scale: newScale });
    }
  };

  const togglePreview = (track: MusicTrack) => {
    if (playingTrackId === track.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingTrackId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(track.previewUrl);
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          if (error.name !== 'AbortError') {
            console.error("Playback failed:", error);
          }
        });
      }
      setPlayingTrackId(track.id);
      audioRef.current.onended = () => setPlayingTrackId(null);
    }
  };

  const addText = () => {
    const newText: OverlayItem = {
      id: `text-${Date.now()}`,
      type: 'text',
      content: 'Toque para editar',
      font: 'font-sans',
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0
    };
    setOverlays([...overlays, newText]);
    setEditingTextId(newText.id);
    setTextInput('');
    setSelectedFont('font-sans');
  };

  const addMusic = (track: MusicTrack) => {
    const newMusic: OverlayItem = {
      id: `music-${Date.now()}`,
      type: 'music',
      content: track.title,
      artist: track.artist,
      cover: track.cover,
      previewUrl: track.previewUrl,
      startTime: 30, // Default to 30s (simulating chorus)
      x: 0,
      y: 50,
      scale: 1,
      rotation: 0
    };
    setOverlays([...overlays, newMusic]);
    setShowMusicLibrary(false);
    setMusicSearchQuery('');
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingTrackId(null);
    }
  };

  const filteredMusic = mockMusic.filter(m => 
    m.title.toLowerCase().includes(musicSearchQuery.toLowerCase()) || 
    m.artist.toLowerCase().includes(musicSearchQuery.toLowerCase())
  );

  const updateOverlay = (id: string, updates: Partial<OverlayItem>) => {
    setOverlays(overlays.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const removeOverlay = (id: string) => {
    setOverlays(overlays.filter(o => o.id !== id));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[600] bg-black flex flex-col"
    >
      {/* Header */}
      <header className="px-6 py-8 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent">
        <button onClick={onCancel} className="p-2 text-white/80 hover:text-white">
          <X size={28} />
        </button>
        <div className="flex items-center gap-4">
          <button onClick={addText} className="p-2 text-white/80 hover:text-white bg-white/10 rounded-full">
            <Type size={24} />
          </button>
          <button onClick={() => setShowMusicLibrary(true)} className="p-2 text-white/80 hover:text-white bg-white/10 rounded-full">
            <Music size={24} />
          </button>
          <button 
            onClick={() => onSave({ image, overlays })}
            className="p-3 bg-brand text-[#020617] rounded-full shadow-lg shadow-brand/20"
          >
            <Check size={24} strokeWidth={3} />
          </button>
        </div>
      </header>

      {/* Editor Area */}
      <div ref={editorRef} className="flex-1 relative overflow-hidden flex items-center justify-center">
        <img src={image} alt="" className="w-full h-full object-contain pointer-events-none" />
        
        {overlays.map((overlay) => (
          <motion.div
            key={overlay.id}
            drag
            dragMomentum={false}
            initial={{ scale: 0, x: overlay.x, y: overlay.y }}
            animate={{ scale: overlay.scale, x: overlay.x, y: overlay.y }}
            className="absolute z-20 cursor-grab active:cursor-grabbing"
            onDragEnd={(_, info) => {
              updateOverlay(overlay.id, { x: overlay.x + info.offset.x, y: overlay.y + info.offset.y });
            }}
            onTouchStart={(e) => handleTouchStart(e, overlay.id)}
            onTouchMove={(e) => handleTouchMove(e, overlay.id)}
          >
            {overlay.type === 'text' ? (
              <div 
                onClick={() => {
                  setEditingTextId(overlay.id);
                  setTextInput(overlay.content);
                  setSelectedFont(overlay.font || 'font-sans');
                }}
                className={cn(
                  "bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-white font-bold text-xl shadow-2xl",
                  overlay.font
                )}
              >
                {overlay.content}
              </div>
            ) : (
              <div 
                onClick={() => setEditingMusicId(overlay.id)}
                className="bg-white/10 backdrop-blur-xl p-3 rounded-2xl border border-white/20 flex items-center gap-3 shadow-2xl min-w-[200px]"
              >
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

            {/* Scale/Remove Controls (Visible when not dragging) */}
            <div className="absolute -top-8 -right-8 flex gap-2">
              <button 
                onClick={() => removeOverlay(overlay.id)}
                className="p-1.5 bg-red-500 text-white rounded-full shadow-lg"
              >
                <X size={12} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Music Library Modal */}
      <AnimatePresence>
        {showMusicLibrary && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed inset-0 z-[700] bg-[#020617] flex flex-col"
          >
            <header className="px-6 py-8 flex items-center gap-4 border-b border-white/5">
              <button onClick={() => setShowMusicLibrary(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                <X size={24} />
              </button>
              <h2 className="text-xl font-bold">Música</h2>
            </header>
            <div className="p-6 space-y-6 overflow-y-auto no-scrollbar">
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Pesquisar músicas..." 
                  value={musicSearchQuery}
                  onChange={(e) => setMusicSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                {filteredMusic.map(track => (
                  <div 
                    key={track.id}
                    className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all group"
                  >
                    <div className="relative" onClick={() => togglePreview(track)}>
                      <img src={track.cover} alt="" className="w-14 h-14 rounded-xl object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                        {playingTrackId === track.id ? <Pause size={20} className="text-white" /> : <Play size={20} className="text-white" />}
                      </div>
                    </div>
                    <div className="flex-1 text-left min-w-0" onClick={() => addMusic(track)}>
                      <h4 className="font-bold truncate">{track.title}</h4>
                      <p className="text-xs text-gray-500 truncate">{track.artist}</p>
                    </div>
                    <button 
                      onClick={() => addMusic(track)}
                      className="p-2 bg-white/5 rounded-full hover:bg-brand hover:text-[#020617] transition-all"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text Input Modal */}
      <AnimatePresence>
        {editingTextId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[700] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6"
          >
            <div className="w-full flex-1 flex flex-col items-center justify-center">
              <textarea
                autoFocus
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Escreva algo..."
                className={cn(
                  "w-full bg-transparent text-center text-4xl font-bold text-white focus:outline-none resize-none",
                  selectedFont
                )}
                rows={3}
              />
            </div>

            {/* Font Selection */}
            <div className="w-full overflow-x-auto no-scrollbar py-8 flex gap-4 px-4">
              {[
                { id: 'font-sans', label: 'Classic' },
                { id: 'font-serif', label: 'Elegant' },
                { id: 'font-modern', label: 'Modern' },
                { id: 'font-hand', label: 'Hand' },
                { id: 'font-impact', label: 'Impact' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFont(f.id)}
                  className={cn(
                    "px-4 py-2 rounded-full border transition-all whitespace-nowrap",
                    selectedFont === f.id 
                      ? "bg-brand border-brand text-[#020617] font-bold" 
                      : "bg-white/10 border-white/20 text-white"
                  )}
                >
                  <span className={f.id}>{f.label}</span>
                </button>
              ))}
            </div>

            <div className="mb-10 flex gap-4">
              <button 
                onClick={() => {
                  updateOverlay(editingTextId, { 
                    content: textInput || 'Toque para editar',
                    font: selectedFont
                  });
                  setEditingTextId(null);
                }}
                className="px-12 py-4 bg-brand text-[#020617] font-bold rounded-full shadow-lg text-lg"
              >
                Concluído
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Music Timeline Modal */}
      <AnimatePresence>
        {editingMusicId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[700] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6"
          >
            <div className="w-full max-w-md bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/10 flex flex-col items-center gap-6">
              <img 
                src={overlays.find(o => o.id === editingMusicId)?.cover} 
                alt="" 
                className="w-32 h-32 rounded-2xl shadow-2xl" 
              />
              <div className="text-center">
                <h3 className="text-xl font-bold">{overlays.find(o => o.id === editingMusicId)?.content}</h3>
                <p className="text-white/60">{overlays.find(o => o.id === editingMusicId)?.artist}</p>
              </div>

              <div className="w-full space-y-4">
                <div className="flex justify-between text-xs text-white/40">
                  <span>Início: {Math.floor((overlays.find(o => o.id === editingMusicId)?.startTime || 0) / 60)}:{(overlays.find(o => o.id === editingMusicId)?.startTime || 0) % 60 < 10 ? '0' : ''}{(overlays.find(o => o.id === editingMusicId)?.startTime || 0) % 60}</span>
                  <span>Duração: 30s</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="120" // Assuming max 2 mins for preview start
                  value={overlays.find(o => o.id === editingMusicId)?.startTime || 0}
                  onChange={(e) => updateOverlay(editingMusicId, { startTime: parseInt(e.target.value) })}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none accent-brand cursor-pointer"
                />
                <p className="text-center text-[10px] text-white/40 uppercase tracking-widest">Arraste para escolher o trecho</p>
              </div>

              <button 
                onClick={() => setEditingMusicId(null)}
                className="w-full py-4 bg-brand text-[#020617] font-bold rounded-2xl shadow-lg"
              >
                Confirmar Trecho
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
