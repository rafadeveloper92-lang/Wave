import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Settings, Edit3, Grid, Image as ImageIcon, Play, Plus, Camera } from 'lucide-react';
import { loadProfile, saveProfile, type PersistedProfile } from '../lib/waveLocalUi';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<PersistedProfile>(() => loadProfile());
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const postInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  const persist = (next: PersistedProfile) => {
    setProfile(next);
    saveProfile(next);
    window.dispatchEvent(new Event('wave-profile-changed'));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      const url = URL.createObjectURL(file);
      if (type === 'profile') persist({ ...profile, profilePic: url });
      else persist({ ...profile, coverPhoto: url });
    }
  };

  const handleAddPost = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    persist({ ...profile, posts: [...profile.posts, url] });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-24 bg-[#020617] min-h-screen"
    >
      <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'profile')} />
      <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'cover')} />
      <input type="file" ref={postInputRef} className="hidden" accept="image/*" onChange={handleAddPost} />

      <div className="relative h-60 w-full overflow-hidden">
        <img 
          src={profile.coverPhoto} 
          alt="Capa" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#020617]" />
        
        <div className="absolute top-6 left-5">
          <h2 className="text-2xl font-bold text-white drop-shadow-lg">Perfil</h2>
        </div>
        
        <button type="button" className="absolute top-6 right-5 p-2.5 bg-white/10 backdrop-blur-md rounded-xl text-white border border-white/10 hover:bg-white/20 transition-all">
          <Settings size={20} />
        </button>

        <button 
          type="button"
          onClick={() => coverInputRef.current?.click()}
          className="absolute bottom-4 right-5 p-1.5 bg-black/40 backdrop-blur-md rounded-lg text-white/50 border border-white/5 hover:text-white transition-all"
        >
          <Camera size={14} />
        </button>
      </div>

      <div className="px-5 -mt-20 relative z-10">
        <div className="flex flex-col items-center">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-brand via-brand/40 to-brand flex items-center justify-center shadow-[0_0_20px_rgba(45,212,191,0.3)]">
              <div className="w-full h-full rounded-full p-0.5 bg-[#020617] flex items-center justify-center">
                <div className="w-full h-full rounded-full p-0.5 border border-brand/30">
                  <img 
                    src={profile.profilePic} 
                    alt={profile.displayName} 
                    className="w-full h-full rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => profileInputRef.current?.click()}
              className="absolute bottom-1 right-1 bg-[#1e293b] p-2 rounded-full border-2 border-[#020617] text-brand shadow-xl active:scale-90 transition-transform"
            >
              <Edit3 size={16} />
            </button>
          </div>

          <div className="w-full mt-5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 text-center space-y-4 shadow-2xl">
            <div>
              <h3 className="text-2xl font-bold text-white tracking-tight">{profile.displayName}</h3>
              <p className="text-gray-400 mt-2 text-sm leading-relaxed max-w-[260px] mx-auto">
                Fotos guardadas neste dispositivo. Conta e mensagens vêm do Supabase.
              </p>
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-between items-center px-2">
              <div className="text-center">
                <p className="text-xl font-bold text-white">{profile.posts.length}</p>
                <p className="text-[8px] text-gray-500 font-black uppercase tracking-[0.2em] mt-0.5">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white">—</p>
                <p className="text-[8px] text-gray-500 font-black uppercase tracking-[0.2em] mt-0.5">Seguidores</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white">—</p>
                <p className="text-[8px] text-gray-500 font-black uppercase tracking-[0.2em] mt-0.5">Seguindo</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void signOut()}
              className="w-full py-3 rounded-2xl border border-white/15 text-sm font-bold text-gray-300 hover:bg-white/5 transition-colors"
            >
              Terminar sessão
            </button>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-lg text-white">Meus Posts</h3>
            <div className="flex gap-3">
              <button type="button" onClick={() => postInputRef.current?.click()} className="text-brand" title="Adicionar">
                <Plus size={18} />
              </button>
              <span className="text-brand"><Grid size={18} /></span>
              <span className="text-gray-500"><ImageIcon size={18} /></span>
            </div>
          </div>
          
          {profile.posts.length === 0 ? (
            <p className="text-center text-xs text-gray-500 py-8">Toca em + para adicionar fotos ao grid.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {profile.posts.map((post, i) => (
                <div key={`my-post-${i}`} className="aspect-[3/4] bg-white/5 rounded-2xl overflow-hidden group relative cursor-pointer border border-white/5">
                  <img 
                    src={post} 
                    alt="" 
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-bold text-white drop-shadow-lg">
                    <Play size={12} fill="white" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
