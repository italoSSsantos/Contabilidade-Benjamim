import React, { useState, useEffect, useMemo } from 'react';
import { ViewState, WeekCampaign } from './types';
import { TRIBE_ICON } from './constants';
import Dashboard from './components/Dashboard';
import WeekEditor from './components/WeekEditor';
import History from './components/History';
import { LayoutDashboard, History as HistoryIcon, Plus, Trophy, Loader2, WifiOff, AlertTriangle, X } from 'lucide-react';
import { supabase } from './supabaseClient';

export default function App() {
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [weeks, setWeeks] = useState<WeekCampaign[]>([]);
  const [activeWeekId, setActiveWeekId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado do Modal Global
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    onConfirm: () => {},
    isDanger: false
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // --- CARREGAMENTO DE DADOS ---
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedData: WeekCampaign[] = data.map((row: any) => ({
          id: row.id,
          name: row.name,
          date: row.date,
          verse: row.verse,
          missions: row.missions, 
          isArchived: row.is_archived
        }));
        setWeeks(formattedData);
      }
    } catch (err: any) {
      console.error("Erro ao buscar dados:", err);
      setError("Não foi possível carregar os dados. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  // --- CÁLCULOS ---
  const totalPoints = useMemo(() => {
    return weeks.reduce((acc, week) => {
      const weekTotal = week.missions.reduce((mAcc, mission) => {
        const missionTotal = mission.items.reduce((iAcc, item) => {
          return iAcc + (item.points * item.quantity);
        }, 0);
        return mAcc + missionTotal;
      }, 0);
      return acc + weekTotal;
    }, 0);
  }, [weeks]);

  // --- MODAL HELPERS ---
  const closeModal = () => {
    setModalOpen(false);
    setIsProcessing(false);
  };

  // --- AÇÕES DO BANCO DE DADOS ---
  const handleSaveWeek = async (updatedWeek: WeekCampaign) => {
    setWeeks(prev => {
      const existingIndex = prev.findIndex(w => w.id === updatedWeek.id);
      if (existingIndex >= 0) {
        const newWeeks = [...prev];
        newWeeks[existingIndex] = updatedWeek;
        return newWeeks;
      }
      return [updatedWeek, ...prev];
    });

    setView('DASHBOARD');
    setActiveWeekId(null);

    try {
      const { error } = await supabase
        .from('campaigns')
        .upsert({
          id: updatedWeek.id,
          name: updatedWeek.name,
          date: updatedWeek.date,
          verse: updatedWeek.verse,
          missions: updatedWeek.missions,
          is_archived: updatedWeek.isArchived
        });

      if (error) {
        console.error("Erro ao salvar:", error);
        fetchCampaigns(); 
      }
    } catch (err) {
      console.error("Erro de conexão:", err);
    }
  };

  const askDeleteWeek = (weekId: string) => {
    if (!weekId) return;

    setModalConfig({
      title: 'EXCLUIR CAMPANHA?',
      message: 'Esta ação removerá permanentemente esta campanha e todos os seus pontos. Confirmar?',
      isDanger: true,
      onConfirm: () => executeDeleteWeek(weekId)
    });
    setModalOpen(true);
  };

  const executeDeleteWeek = async (weekId: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', weekId); 
      
      if (error) throw error;

      setWeeks(prev => prev.filter(w => w.id !== weekId));
      
      if (activeWeekId === weekId) {
        setActiveWeekId(null);
        setView('DASHBOARD');
      }
      closeModal();
    } catch (err: any) {
       console.error("Erro crítico ao excluir:", err);
       closeModal();
    }
  };

  const startNewWeek = () => {
    setActiveWeekId(null);
    setView('WEEK_EDITOR');
  };

  const editWeek = (weekId: string) => {
    setActiveWeekId(weekId);
    setView('WEEK_EDITOR');
  };

  // --- RENDERIZAÇÃO ---
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-royal-gold animate-pulse">
          <Loader2 className="w-12 h-12 mb-4 animate-spin drop-shadow-[0_0_10px_rgba(198,156,109,0.8)]" />
          <p className="font-serif tracking-widest text-sm uppercase">Carregando...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-red-300 bg-black/40 rounded-xl p-6 border border-red-900/50 shadow-inner">
          <WifiOff className="w-10 h-10 mb-4" />
          <p className="text-center font-bold mb-2 font-serif">ERRO DE CONEXÃO</p>
          <p className="text-center text-xs mb-4 opacity-70 font-sans">{error}</p>
        </div>
      );
    }

    switch (view) {
      case 'DASHBOARD':
        return (
          <Dashboard 
            totalPoints={totalPoints} 
            weeks={weeks} 
            onEditWeek={editWeek}
            onNewWeek={startNewWeek}
          />
        );
      case 'WEEK_EDITOR':
        const weekToEdit = weeks.find(w => w.id === activeWeekId);
        return (
          <WeekEditor 
            existingWeek={weekToEdit} 
            onSave={handleSaveWeek} 
            onDelete={askDeleteWeek} 
            onCancel={() => setView('DASHBOARD')}
            isDeleting={isProcessing}
          />
        );
      case 'HISTORY':
        return (
          <History 
            weeks={weeks} 
            onEditWeek={editWeek}
            onDeleteWeek={askDeleteWeek} 
            deletingId={isProcessing ? 'processing' : null}
          />
        );
      default:
        return <Dashboard totalPoints={totalPoints} weeks={weeks} onEditWeek={editWeek} onNewWeek={startNewWeek} />;
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-bg-royal-red font-sans relative flex flex-col">
      {/* Background Gradient to match reference (Darker bottom) */}
      <div className="fixed inset-0 bg-red-velvet pointer-events-none z-[-1]"></div>

      {/* Header - Top Bar */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-royal-red to-[#4a0a0a] border-b-2 border-royal-goldDark shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-royal-gold to-transparent opacity-50 absolute top-0"></div>
        
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-3xl filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-royal-goldLight">{TRIBE_ICON}</span>
            <div>
              <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gold-plate uppercase tracking-[0.15em] drop-shadow-sm font-serif leading-none">
                Tribo de Benjamin
              </h1>
              <p className="text-[9px] text-royal-gold/60 font-sans tracking-widest uppercase mt-0.5 ml-0.5">FJU • Gestão de Pontos</p>
            </div>
          </div>
          
          <div className="relative group">
            <div className="absolute inset-0 bg-royal-gold blur-md opacity-20 rounded-full"></div>
            <div className="relative flex items-center bg-black/40 px-3 py-1 rounded-full border border-royal-gold/50 shadow-inset-gold">
              <Trophy className="w-3.5 h-3.5 text-royal-goldLight mr-2" />
              <span className="font-bold text-royal-goldLight font-serif text-sm">{totalPoints.toLocaleString()} <span className="text-[10px] text-royal-gold">pts</span></span>
            </div>
          </div>
        </div>
        
        {/* Decorative thin gold line at bottom of header */}
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-royal-gold/50 to-transparent"></div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 flex-1 w-full">
        {renderContent()}
      </main>

      {/* Navigation - Bottom Bar */}
      {view !== 'WEEK_EDITOR' && (
        <nav className="fixed bottom-0 left-0 right-0 z-50">
           {/* Decorative Top Border Line for Nav */}
           <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-royal-gold to-transparent z-50"></div>
           
           <div className="bg-gradient-to-t from-[#1a0000] to-[#3d0000] pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.8)] relative">
            <div className="max-w-3xl mx-auto flex justify-between items-center h-20 px-12 relative">
              
              {/* Left Button */}
              <button 
                type="button"
                onClick={() => setView('DASHBOARD')}
                className={`flex flex-col items-center justify-center space-y-1 group ${view === 'DASHBOARD' ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
              >
                <LayoutDashboard className="w-5 h-5 text-royal-goldLight group-hover:drop-shadow-[0_0_5px_rgba(243,229,171,0.5)] transition-all" />
                <span className="text-[9px] font-serif font-bold uppercase tracking-widest text-royal-gold">Painel</span>
              </button>
              
              {/* Center Button (Floating) */}
              <div className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2">
                <button 
                  type="button"
                  onClick={startNewWeek}
                  className="relative w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-b from-royal-goldLight via-royal-gold to-royal-goldDark shadow-[0_5px_15px_rgba(0,0,0,0.6)] group transition-transform active:scale-95 border-4 border-[#2A0505]"
                >
                  {/* Inner ring */}
                  <div className="absolute inset-1 rounded-full border border-white/40"></div>
                  <div className="absolute inset-[3px] rounded-full border border-black/20"></div>
                  
                  <Plus className="w-8 h-8 text-[#2A0505] drop-shadow-sm" strokeWidth={3} />
                </button>
              </div>

              {/* Right Button */}
              <button 
                type="button"
                onClick={() => setView('HISTORY')}
                className={`flex flex-col items-center justify-center space-y-1 group ${view === 'HISTORY' ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
              >
                <HistoryIcon className="w-5 h-5 text-royal-goldLight group-hover:drop-shadow-[0_0_5px_rgba(243,229,171,0.5)] transition-all" />
                <span className="text-[9px] font-serif font-bold uppercase tracking-widest text-royal-gold">Histórico</span>
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* --- MODAL GLOBAL --- */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={closeModal} />
          
          <div className="relative bg-[#1a0505] border border-royal-gold rounded-lg p-1 max-w-sm w-full shadow-[0_0_50px_rgba(198,156,109,0.2)] transform transition-all scale-100">
             {/* Inner Border Double */}
             <div className="border border-royal-gold/30 rounded p-6 relative overflow-hidden">
                <button onClick={closeModal} className="absolute top-3 right-3 text-royal-gold/50 hover:text-royal-goldLight">
                  <X className="w-5 h-5" />
                </button>
                
                <div className="flex flex-col items-center text-center">
                  <div className={`mb-4 ${modalConfig.isDanger ? 'text-red-500 drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'text-royal-gold drop-shadow-[0_0_10px_rgba(198,156,109,0.5)]'}`}>
                    {modalConfig.isDanger ? <AlertTriangle className="w-10 h-10" /> : <Loader2 className="w-10 h-10" />}
                  </div>
                  
                  <h3 className="text-xl font-bold text-royal-goldLight mb-3 font-serif uppercase tracking-widest">{modalConfig.title}</h3>
                  <p className="text-sm text-royal-gold/70 mb-8 font-serif leading-relaxed px-2">
                    {modalConfig.message}
                  </p>
                  
                  <div className="flex gap-4 w-full">
                    <button
                      onClick={closeModal}
                      className="flex-1 px-4 py-2 bg-transparent text-royal-gold/60 font-serif font-bold uppercase tracking-wider text-xs border border-royal-gold/30 hover:bg-royal-gold/5 hover:text-royal-gold transition-colors"
                      disabled={isProcessing}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={modalConfig.onConfirm}
                      disabled={isProcessing}
                      className={`flex-1 px-4 py-2 font-serif font-bold uppercase tracking-wider text-xs shadow-lg transition-all active:scale-95 ${
                        modalConfig.isDanger 
                          ? 'bg-gradient-to-r from-red-900 to-red-800 text-white border border-red-500' 
                          : 'bg-gradient-to-b from-royal-gold to-royal-goldDark text-[#2A0505] border border-royal-goldLight'
                      }`}
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirmar'}
                    </button>
                  </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}