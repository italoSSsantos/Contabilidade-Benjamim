import React from 'react';
import { WeekCampaign } from '../types';
import { Trash2, Edit2, Calendar, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

interface HistoryProps {
  weeks: WeekCampaign[];
  onEditWeek: (id: string) => void;
  onDeleteWeek: (id: string) => void;
  deletingId?: string | null;
}

export default function History({ weeks, onEditWeek, onDeleteWeek, deletingId }: HistoryProps) {
  const [expandedWeekId, setExpandedWeekId] = React.useState<string | null>(null);

  const calculateWeekPoints = (week: WeekCampaign) => {
    return week.missions.reduce((acc, mission) => {
      return acc + mission.items.reduce((iAcc, item) => {
        return iAcc + (item.points * item.quantity);
      }, 0);
    }, 0);
  };

  const sortedWeeks = [...weeks].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (weeks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-royal-gold/30">
        <Calendar className="w-16 h-16 mb-4 opacity-20" />
        <p className="font-serif">Nenhum histórico disponível.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in pb-24">
      <div className="flex items-center mb-6">
        <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent to-royal-gold/50"></div>
        <h2 className="text-xl font-bold text-royal-goldLight font-serif mx-4 uppercase tracking-widest drop-shadow-md">Histórico</h2>
        <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent to-royal-gold/50"></div>
      </div>
      
      {sortedWeeks.map(week => {
        const total = calculateWeekPoints(week);
        const isExpanded = expandedWeekId === week.id;
        const isDeletingThis = deletingId === week.id;

        return (
          <div key={week.id} className={`bg-[#1a0505] border ${isDeletingThis ? 'border-red-500/50 opacity-50' : 'border-royal-gold/20'} rounded-lg overflow-hidden shadow-md transition-all`}>
            <div 
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-royal-gold/5 transition-colors"
              onClick={() => setExpandedWeekId(isExpanded ? null : week.id)}
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-royal-goldLight text-lg font-serif tracking-wide">{week.name}</h3>
                  {isDeletingThis && <Loader2 className="w-4 h-4 animate-spin text-red-500" />}
                </div>
                <p className="text-xs text-royal-gold/50 font-sans uppercase tracking-widest">{new Date(week.date).toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="bg-black/40 px-3 py-1 rounded border border-royal-gold/10">
                    <div className="text-lg font-bold text-royal-gold font-serif">{total.toLocaleString()} <span className="text-[10px]">pts</span></div>
                </div>
                <div className="mt-2">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-royal-gold/50" /> : <ChevronDown className="w-4 h-4 text-royal-gold/30" />}
                </div>
              </div>
            </div>

            {isExpanded && !isDeletingThis && (
              <div className="bg-black/30 p-4 border-t border-royal-gold/10 space-y-4 relative">
                <div className="absolute inset-0 bg-pattern opacity-5 pointer-events-none"></div>
                {week.verse && (
                   <p className="text-sm text-royal-gold/70 italic mb-4 border-l-2 border-royal-gold pl-3 font-serif relative z-10">"{week.verse}"</p>
                )}

                <div className="space-y-3 relative z-10">
                  {week.missions.map((mission, idx) => {
                    const mTotal = mission.items.reduce((acc, item) => acc + (item.points * item.quantity), 0);
                    
                    if (mTotal === 0 && !mission.notes) return null;

                    return (
                        <div key={idx} className="text-sm border-b border-royal-gold/10 pb-2 last:border-0">
                            <div className="flex justify-between font-bold text-royal-goldLight/90 font-serif tracking-wide">
                                <span>{mission.title}</span>
                                <span>{mTotal.toLocaleString()} pts</span>
                            </div>
                            <div className="mt-1 space-y-1">
                                {mission.items.filter(i => i.quantity > 0).map(item => (
                                    <div key={item.id} className="flex justify-between text-xs text-royal-gold/50 pl-2 font-sans">
                                        <span>• {item.label} ({item.quantity}x)</span>
                                        <span className="text-royal-gold">{(item.quantity * item.points).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                            {mission.notes && <p className="text-xs text-royal-gold/40 mt-2 italic bg-black/40 p-2 rounded border border-royal-gold/5">{mission.notes}</p>}
                        </div>
                    )
                  })}
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-royal-gold/10 mt-2 relative z-10">
                  <button 
                    type="button"
                    onClick={(e) => { 
                      e.preventDefault();
                      e.stopPropagation(); 
                      onDeleteWeek(week.id); 
                    }}
                    className="flex items-center text-[10px] text-red-400 hover:text-red-300 px-3 py-2 rounded hover:bg-red-900/20 transition-colors cursor-pointer uppercase tracking-widest font-bold"
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Excluir
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => { 
                      e.preventDefault();
                      e.stopPropagation(); 
                      onEditWeek(week.id); 
                    }}
                    className="flex items-center text-[10px] bg-royal-gold/10 hover:bg-royal-gold/20 text-royal-gold border border-royal-gold/30 px-4 py-2 rounded font-bold transition-colors shadow-sm cursor-pointer uppercase tracking-widest"
                  >
                    <Edit2 className="w-3 h-3 mr-1.5" /> Editar
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}