import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Settings, Edit3, Grid, Image as ImageIcon, Play, Plus, Camera } from 'lucide-react';

const myPosts = [
  'https://picsum.photos/seed/post1/200/200',
  'https://picsum.photos/seed/post2/200/200',
  'https://picsum.photos/seed/post3/200/200',
  'https://picsum.photos/seed/post4/200/200',
  'https://picsum.photos/seed/post5/200/200',
  'https://picsum.photos/seed/post6/200/200',
];

export default function ProfileScreen() {
  const [profilePic, setProfilePic] = useState('https://i.pravatar.cc/300?u=lucas');
  const [coverPhoto, setCoverPhoto] = useState('https://picsum.photos/seed/city/800/600');
  
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (type === 'profile') setProfilePic(url);
      else setCoverPhoto(url);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-24 bg-[#020617] min-h-screen"
    >
      {/* Hidden Inputs */}
      <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'profile')} />
      <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'cover')} />

      {/* Cover Photo Area */}
      <div className="relative h-60 w-full overflow-hidden">
        <img 
          src={coverPhoto} 
          alt="Cover" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#020617]" />
        
        {/* Header Overlays */}
        <div className="absolute top-6 left-5">
          <h2 className="text-2xl font-bold text-white drop-shadow-lg">Perfil</h2>
        </div>
        
        <button className="absolute top-6 right-5 p-2.5 bg-white/10 backdrop-blur-md rounded-xl text-white border border-white/10 hover:bg-white/20 transition-all">
          <Settings size={20} />
        </button>

        {/* Edit Cover Button (Floating) */}
        <button 
          onClick={() => coverInputRef.current?.click()}
          className="absolute bottom-4 right-5 p-1.5 bg-black/40 backdrop-blur-md rounded-lg text-white/50 border border-white/5 hover:text-white transition-all"
        >
          <Camera size={14} />
        </button>
      </div>

      {/* Profile Content Card */}
      <div className="px-5 -mt-20 relative z-10">
        <div className="flex flex-col items-center">
          {/* Glowing Profile Picture */}
          <div className="relative group">
            <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-brand via-brand/40 to-brand flex items-center justify-center shadow-[0_0_20px_rgba(45,212,191,0.3)]">
              <div className="w-full h-full rounded-full p-0.5 bg-[#020617] flex items-center justify-center">
                <div className="w-full h-full rounded-full p-0.5 border border-brand/30">
                  <img 
                    src={profilePic} 
                    alt="Lucas Silva" 
                    className="w-full h-full rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>
            <button 
              onClick={() => profileInputRef.current?.click()}
              className="absolute bottom-1 right-1 bg-[#1e293b] p-2 rounded-full border-2 border-[#020617] text-brand shadow-xl active:scale-90 transition-transform"
            >
              <Edit3 size={16} />
            </button>
          </div>

          {/* Info Card */}
          <div className="w-full mt-5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 text-center space-y-4 shadow-2xl">
            <div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Lucas Silva</h3>
              <p className="text-gray-400 mt-2 text-sm leading-relaxed max-w-[260px] mx-auto">
                Lucas Silva is a profile profile blogs, and preview connections and community communication.
              </p>
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-between items-center px-2">
              <div className="text-center">
                <p className="text-xl font-bold text-white">1.2K</p>
                <p className="text-[8px] text-gray-500 font-black uppercase tracking-[0.2em] mt-0.5">Seguidores</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white">450</p>
                <p className="text-[8px] text-gray-500 font-black uppercase tracking-[0.2em] mt-0.5">Seguindo</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white">85K</p>
                <p className="text-[8px] text-gray-500 font-black uppercase tracking-[0.2em] mt-0.5">Curtidas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-lg text-white">Meus Posts</h3>
            <div className="flex gap-3">
              <button className="text-brand"><Grid size={18} /></button>
              <button className="text-gray-500"><ImageIcon size={18} /></button>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {myPosts.map((post, i) => (
              <div key={`my-post-${i}`} className="aspect-[3/4] bg-white/5 rounded-2xl overflow-hidden group relative cursor-pointer border border-white/5">
                <img 
                  src={post} 
                  alt="" 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-bold text-white drop-shadow-lg">
                  <Play size={12} fill="white" />
                  {Math.floor(Math.random() * 500)}K
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
