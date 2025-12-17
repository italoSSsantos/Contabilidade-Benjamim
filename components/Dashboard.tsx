import React from 'react';
import { WeekCampaign } from '../types';
import { TRIBE_ICON } from '../constants';
import { ChevronRight, Calendar, TrendingUp, Users } from 'lucide-react';

interface DashboardProps {
  totalPoints: number;
  weeks: WeekCampaign[];
  onEditWeek: (id: string) => void;
  onNewWeek: () => void;
}

export default function Dashboard({ totalPoints, weeks, onEditWeek, onNewWeek }: DashboardProps) {
  const sortedWeeks = [...weeks].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const currentWeek = sortedWeeks[0];

  const calculateWeekPoints = (week: WeekCampaign) => {
    return week.missions.reduce((acc, mission) => {
      return acc + mission.items.reduce((iAcc, item) => {
        return iAcc + (item.points * item.quantity);
      }, 0);
    }, 0);
  };

  return (
    <div className="space-y-8 animate-fade-in px-1">
      
      {/* --- HERO CARD (Golden Plate) --- */}
      <div className="relative group">
        {/* Glow behind */}
        <div className="absolute -inset-1 bg-royal-gold blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
        
        {/* Main Card Body */}
        <div className="relative bg-gold-plate rounded-lg p-[3px] shadow-metal">
          {/* Inner Border (Dark) */}
          <div className="bg-transparent border-2 border-[#8C6B3D] rounded-[5px] p-1 h-full">
            {/* Texture Container */}
            <div className="bg-gold-plate rounded-[3px] p-5 relative overflow-hidden h-32 flex flex-col justify-between border border-[#F3E5AB]/50">
               {/* Micro-dot texture overlay */}
               <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#8C6B3D 1px, transparent 1px)', backgroundSize: '4px 4px' }}></div>
               
               {/* Wolf Watermark */}
               <div className="absolute right-[-20px] top-1/2 transform -translate-y-1/2 opacity-30 mix-blend-overlay text-[#5a3a15]">
                  <span className="text-[120px] leading-none">{TRIBE_ICON}</span>
               </div>

               {/* Content */}
               <div className="relative z-10">
                 <h2 className="font-serif text-xs font-bold text-[#5A3A15] uppercase tracking-[0.2em] mb-1">Pontuação Total</h2>
                 <div className="flex items-baseline space-x-1">
                   <span className="font-serif text-5xl text-[#2A0505] font-bold drop-shadow-sm">{totalPoints.toLocaleString()}</span>
                   <span className="font-serif text-xl text-[#5A3A15] font-bold">pts</span>
                 </div>
               </div>

               <div className="relative z-10 flex items-center justify-between border-t border-[#8C6B3D]/30 pt-2 mt-2">
                 <div className="flex items-center text-[#5A3A15] text-[10px] font-bold uppercase tracking-widest">
                   <span className="mr-2">🐺</span> Tribo de Benjamin
                 </div>
                 <div className="bg-[#8C6B3D]/20 px-2 py-0.5 rounded border border-[#8C6B3D]/30 text-[#2A0505] text-[10px] font-bold">
                   FJU
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- SEMANA ATUAL --- */}
      <div className="relative">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-serif font-bold text-royal-goldLight uppercase tracking-widest flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-2 text-royal-gold" />
            Semana Atual
          </h3>
          <button 
             onClick={onNewWeek}
             className="text-[10px] bg-gradient-to-b from-royal-gold to-royal-goldDark text-[#2A0505] font-bold px-3 py-1 rounded-sm border border-royal-goldLight/50 shadow-md uppercase tracking-wider hover:brightness-110 active:translate-y-0.5 transition-all"
           >
             Criar Nova
           </button>
        </div>

        {/* The Dark Dotted Box */}
        <div className="border-2 border-dashed border-royal-gold/30 bg-black/20 rounded-lg p-1">
            <div className="bg-[#1a0505]/80 rounded p-6 min-h-[120px] flex flex-col items-center justify-center relative overflow-hidden group hover:bg-[#250808] transition-colors cursor-pointer"
                 onClick={currentWeek ? () => onEditWeek(currentWeek.id) : onNewWeek}>
              
              {currentWeek ? (
                <div className="w-full relative z-10">
                   <div className="text-center mb-4">
                      <h4 className="font-serif text-xl text-royal-goldLight font-bold tracking-wide drop-shadow-sm">{currentWeek.name}</h4>
                      <p className="text-xs text-royal-gold/60 font-sans mt-1 uppercase tracking-widest">{new Date(currentWeek.date).toLocaleDateString('pt-BR')}</p>
                   </div>
                   
                   <div className="flex justify-center">
                     <div className="inline-flex items-center px-4 py-2 bg-gradient-to-b from-royal-gold to-royal-goldDark text-[#2A0505] rounded-full border border-royal-goldLight/30 shadow-lg">
                        <span className="font-serif font-bold text-lg">{calculateWeekPoints(currentWeek).toLocaleString()}</span>
                        <span className="text-[10px] ml-1 font-bold uppercase">pts</span>
                     </div>
                   </div>

                   <div className="absolute bottom-[-10px] right-[-10px] opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-5 h-5 text-royal-gold" />
                   </div>
                </div>
              ) : (
                <>
                  <p className="text-royal-gold/40 font-serif italic text-sm mb-4">Nenhuma semana ativa encontrada.</p>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onNewWeek(); }}
                    className="relative bg-gradient-to-b from-royal-gold to-royal-goldDark text-[#2A0505] px-8 py-2 rounded-full font-bold font-serif uppercase tracking-widest shadow-glow border border-white/20 hover:scale-105 transition-transform"
                  >
                    Começar Campanha
                  </button>
                </>
              )}
            </div>
        </div>
      </div>

      {/* --- STATS GRID (Bottom) --- */}
      <div className="grid grid-cols-2 gap-4">
        {/* Card 1 */}
        <div className="relative bg-black/30 rounded-lg p-[1px] border border-royal-gold/20 shadow-inset-gold">
          <div className="bg-gradient-to-br from-[#1a0505] to-[#0f0202] rounded-lg p-4 h-full relative overflow-hidden">
             <div className="absolute right-0 top-0 opacity-5 p-2"><TrendingUp className="w-10 h-10 text-royal-gold" /></div>
             <div className="relative z-10">
               <div className="text-royal-gold/50 text-[9px] font-bold uppercase tracking-[0.2em] mb-1 font-serif">Campanhas</div>
               <div className="text-3xl font-serif font-bold text-white drop-shadow-md">{weeks.length}</div>
             </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="relative bg-black/30 rounded-lg p-[1px] border border-royal-gold/20 shadow-inset-gold">
           <div className="bg-gradient-to-br from-[#1a0505] to-[#0f0202] rounded-lg p-4 h-full relative overflow-hidden">
             <div className="absolute right-0 top-0 opacity-5 p-2"><Users className="w-10 h-10 text-royal-gold" /></div>
             <div className="relative z-10">
               <div className="text-royal-gold/50 text-[9px] font-bold uppercase tracking-[0.2em] mb-1 font-serif">Média / Sem</div>
               <div className="text-3xl font-serif font-bold text-royal-gold drop-shadow-md">
                 {weeks.length > 0 ? Math.floor(totalPoints / weeks.length).toLocaleString() : 0}
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}