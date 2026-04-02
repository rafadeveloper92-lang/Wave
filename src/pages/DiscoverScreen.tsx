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
      className="px-6 space-y-8"
    >
      <h2 className="text-2xl font-bold">Discover</h2>

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input 
          type="text" 
          placeholder="Search" 
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
        />
      </div>

      <section className="space-y-4">
        <h3 className="font-bold text-lg">Discover New Connections & Communities</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="glass p-3 rounded-2xl flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 bg-brand/20 text-brand rounded-xl flex items-center justify-center">
              <Users size={20} />
            </div>
            <span className="text-[10px] font-bold leading-tight">Popular Public groups</span>
          </div>
          <div className="glass p-3 rounded-2xl flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 bg-orange-500/20 text-orange-500 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <span className="text-[10px] font-bold leading-tight">Trending Posts</span>
          </div>
          <div className="glass p-3 rounded-2xl flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 bg-purple-500/20 text-purple-500 rounded-xl flex items-center justify-center">
              <Calendar size={20} />
            </div>
            <span className="text-[10px] font-bold leading-tight">Wave Fest Highlights</span>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">Suggested People to</h3>
          <button className="text-brand text-xs font-bold">Follow</button>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar">
          {suggestedPeople.map((person) => (
            <div key={person.id} className="flex flex-col items-center gap-2 min-w-[80px]">
              <img src={person.avatar} alt="" className="w-16 h-16 rounded-full border-2 border-white/10" referrerPolicy="no-referrer" />
              <span className="text-[10px] font-medium text-center truncate w-full">{person.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-bold text-lg">Event Highlights</h3>
        <div className="relative h-40 rounded-3xl overflow-hidden group">
          <img src="https://picsum.photos/seed/concert/500/300" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
          <div className="absolute bottom-4 left-4">
            <p className="text-xs font-bold text-brand mb-1">Wave Fest 2024</p>
            <h4 className="font-bold text-lg">The biggest tech event of the year</h4>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
