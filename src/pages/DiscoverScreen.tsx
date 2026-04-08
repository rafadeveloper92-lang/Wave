import React from 'react';
import { motion } from 'motion/react';
import { Search, Users, TrendingUp, Calendar } from 'lucide-react';

const suggestedPeople = [
  { id: 'person-1', name: 'Lucas Silva', avatar: 'https://i.pravatar.cc/150?u=lucas' },
  { id: 'person-2', name: 'João Pereira', avatar: 'https://i.pravatar.cc/150?u=joao' },
  { id: 'person-3', name: 'Maria Souza', avatar: 'https://i.pravatar.cc/150?u=maria' },
  { id: 'person-4', name: 'Pedro Santos', avatar: 'https://i.pravatar.cc/150?u=pedro' },
];

export default function DiscoverScreen() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="px-5 space-y-6"
    >
      <h2 className="text-xl font-bold">Discover</h2>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input 
          type="text" 
          placeholder="Search" 
          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
        />
      </div>

      <section className="space-y-3">
        <h3 className="font-bold text-base">Discover New Connections & Communities</h3>
        <div className="grid grid-cols-3 gap-2">
          <div className="glass p-2.5 rounded-xl flex flex-col items-center gap-1.5 text-center">
            <div className="w-9 h-9 bg-brand/20 text-brand rounded-lg flex items-center justify-center">
              <Users size={18} />
            </div>
            <span className="text-[9px] font-bold leading-tight">Popular Public groups</span>
          </div>
          <div className="glass p-2.5 rounded-xl flex flex-col items-center gap-1.5 text-center">
            <div className="w-9 h-9 bg-orange-500/20 text-orange-500 rounded-lg flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
            <span className="text-[9px] font-bold leading-tight">Trending Posts</span>
          </div>
          <div className="glass p-2.5 rounded-xl flex flex-col items-center gap-1.5 text-center">
            <div className="w-9 h-9 bg-purple-500/20 text-purple-500 rounded-lg flex items-center justify-center">
              <Calendar size={18} />
            </div>
            <span className="text-[9px] font-bold leading-tight">Wave Fest Highlights</span>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-base">Suggested People to</h3>
          <button className="text-brand text-[10px] font-bold">Follow</button>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar">
          {suggestedPeople.map((person) => (
            <div key={person.id} className="flex flex-col items-center gap-1.5 min-w-[70px]">
              <img src={person.avatar} alt="" className="w-14 h-14 rounded-full border-2 border-white/10" referrerPolicy="no-referrer" />
              <span className="text-[9px] font-medium text-center truncate w-full">{person.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-bold text-base">Event Highlights</h3>
        <div className="relative h-36 rounded-2xl overflow-hidden group">
          <img src="https://picsum.photos/seed/concert/500/300" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
          <div className="absolute bottom-3 left-3">
            <p className="text-[10px] font-bold text-brand mb-0.5">Wave Fest 2024</p>
            <h4 className="font-bold text-base">The biggest tech event of the year</h4>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
