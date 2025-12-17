import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { WeekCampaign, Mission, MissionItem } from '../types';
import { Save, Plus, Trash2, ArrowLeft, Target, Sparkles, Wand2, Loader2, Bot, ChevronRight, AlertTriangle, X, Check } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

interface WeekEditorProps {
  existingWeek?: WeekCampaign;
  onSave: (week: WeekCampaign) => void;
  onDelete?: (id: string) => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export default function WeekEditor({ existingWeek, onSave, onDelete, onCancel, isDeleting = false }: WeekEditorProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [verse, setVerse] = useState('');
  const [missions, setMissions] = useState<Mission[]>([]);
  const [expandedMissionId, setExpandedMissionId] = useState<string | null>(null);
  
  // AI Agent States
  const [aiInputMode, setAiInputMode] = useState(!existingWeek); 
  const [rawText, setRawText] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  // --- MODAL LOCAL STATE ---
  const [localModal, setLocalModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
    isDanger?: boolean;
    showCancel?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: undefined,
    isDanger: false,
    showCancel: true
  });

  useEffect(() => {
    if (existingWeek) {
      setName(existingWeek.name);
      setDate(existingWeek.date);
      setVerse(existingWeek.verse || '');
      setMissions(existingWeek.missions);
      setAiInputMode(false);
    }
  }, [existingWeek]);

  // --- Helpers do Modal Local ---
  const closeLocalModal = () => {
    setLocalModal(prev => ({ ...prev, isOpen: false }));
  };

  const showValidationModal = (msg: string) => {
    setLocalModal({
      isOpen: true,
      title: 'ATENÇÃO',
      message: msg,
      isDanger: false,
      showCancel: false,
      onConfirm: () => closeLocalModal()
    });
  };

  // --- Lógica da IA ---
  const handleAIParse = async () => {
    if (!rawText.trim()) return;
    
    setIsThinking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        Analise o seguinte texto de missões da FJU (Força Jovem Universal).
        Extraia o título da campanha (semana), o versículo bíblico (se houver), e a lista de missões.
        Para cada missão, identifique o título da missão e as regras de pontuação (label e pontos).
        
        Texto:
        ${rawText}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              weekTitle: { type: Type.STRING },
              verse: { type: Type.STRING },
              missions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    rules: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          description: { type: Type.STRING },
                          points: { type: Type.NUMBER }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      
      if (data) {
        if (data.weekTitle) setName(data.weekTitle);
        if (data.verse) setVerse(data.verse);
        
        if (data.missions && Array.isArray(data.missions)) {
          const newMissions: Mission[] = data.missions.map((m: any) => ({
            id: uuidv4(),
            title: m.title || 'Missão sem nome',
            items: Array.isArray(m.rules) ? m.rules.map((r: any) => ({
              id: uuidv4(),
              label: r.description,
              points: r.points,
              quantity: 0
            })) : [],
            notes: ''
          }));
          setMissions(newMissions);
          if (newMissions.length > 0) setExpandedMissionId(newMissions[0].id);
        }
        setAiInputMode(false);
      }
    } catch (error) {
      console.error("AI Error:", error);
      showValidationModal("Houve um erro ao processar o texto da IA. Tente novamente.");
    } finally {
      setIsThinking(false);
    }
  };

  // --- CRUD de Missões ---
  const addMission = () => {
    const newMission: Mission = {
      id: uuidv4(),
      title: `Nova Missão ${missions.length + 1}`,
      items: [
        { id: uuidv4(), label: 'Jovem presente', points: 0, quantity: 0 }
      ],
      notes: ''
    };
    setMissions([...missions, newMission]);
    setExpandedMissionId(newMission.id);
  };

  const addMissionItem = (missionId: string) => {
    setMissions(prev => prev.map(m => {
      if (m.id !== missionId) return m;
      return {
        ...m,
        items: [...m.items, { id: uuidv4(), label: 'Nova Regra', points: 100, quantity: 0 }]
      };
    }));
  };

  const updateMissionItem = (missionId: string, itemId: string, field: keyof MissionItem, value: any) => {
    setMissions(prev => prev.map(m => {
      if (m.id !== missionId) return m;
      return {
        ...m,
        items: m.items.map(item => item.id === itemId ? { ...item, [field]: value } : item)
      };
    }));
  };

  const removeMissionItem = (missionId: string, itemId: string) => {
    setMissions(prev => prev.map(m => {
      if (m.id !== missionId) return m;
      return { ...m, items: m.items.filter(i => i.id !== itemId) };
    }));
  };

  const updateMissionTitle = (missionId: string, title: string) => {
    setMissions(prev => prev.map(m => m.id === missionId ? { ...m, title } : m));
  };

  const updateMissionNotes = (missionId: string, notes: string) => {
    setMissions(prev => prev.map(m => m.id === missionId ? { ...m, notes } : m));
  };

  // --- Ações com Modais ---

  const askRemoveMission = (e: React.MouseEvent, missionId: string) => {
    e.stopPropagation();
    setLocalModal({
      isOpen: true,
      title: 'EXCLUIR MISSÃO?',
      message: 'Isso removerá esta missão e todas as regras de pontuação dela.',
      isDanger: true,
      showCancel: true,
      onConfirm: () => {
        setMissions(prev => prev.filter(m => m.id !== missionId));
        closeLocalModal();
      }
    });
  };

  const askClearMissions = (e: React.MouseEvent) => {
    setLocalModal({
      isOpen: true,
      title: 'LIMPAR TUDO?',
      message: 'Isso apagará todas as missões da lista atual.',
      isDanger: true,
      showCancel: true,
      onConfirm: () => {
        setMissions([]);
        closeLocalModal();
      }
    });
  };

  const handleSave = () => {
    if (!name.trim()) {
      showValidationModal("Por favor, dê um nome para a semana/campanha.");
      return;
    }

    const weekData: WeekCampaign = {
      id: existingWeek?.id || uuidv4(),
      name,
      date,
      verse,
      missions,
      isArchived: false
    };

    onSave(weekData);
  };

  const askDeleteCampaign = () => {
    if (existingWeek && onDelete && !isDeleting) {
      onDelete(existingWeek.id);
    }
  };

  const calculateMissionTotal = (mission: Mission) => {
    return mission.items.reduce((acc, item) => acc + (item.points * item.quantity), 0);
  };
  const totalWeekPoints = missions.reduce((acc, m) => acc + calculateMissionTotal(m), 0);

  // --- RENDERIZAR: MODO IA ---
  if (aiInputMode) {
    return (
      <>
        <div className="space-y-6 animate-fade-in pb-10">
           {/* ... Header IA ... */}
           <div className="flex items-center space-x-4 mb-2">
              <button type="button" onClick={onCancel} className="p-2 rounded-full hover:bg-black/40 transition-colors">
                <ArrowLeft className="w-6 h-6 text-royal-gold" />
              </button>
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gold-plate flex items-center font-serif uppercase tracking-widest">
                <Sparkles className="w-5 h-5 mr-2 text-royal-gold" />
                Lobo Mascote (IA)
              </h2>
            </div>

            <div className="bg-[#1a0505] p-6 rounded-lg border border-royal-gold/40 shadow-glow relative overflow-hidden">
              <div className="absolute inset-0 bg-royal-gold/5 pointer-events-none"></div>
              
              <div className="flex justify-center mb-6 relative z-10">
                 <div className="bg-gradient-to-br from-royal-gold to-royal-goldDark p-0.5 rounded-full shadow-lg">
                    <div className="bg-[#1a0505] p-4 rounded-full">
                       <Bot className="w-10 h-10 text-royal-gold" />
                    </div>
                 </div>
              </div>
              <h3 className="text-center text-lg font-bold text-royal-goldLight mb-2 relative z-10 font-serif uppercase tracking-wide">Descreva a Campanha</h3>
              <textarea 
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Cole o texto da missão aqui. Ex: 'Campanha FJU, Rally dos Vencedores. Jovem presente: 500pts, Visitante: 1000pts...'"
                className="w-full h-64 bg-black/40 border border-royal-gold/30 rounded p-4 text-royal-goldLight resize-none focus:border-royal-gold focus:ring-1 focus:ring-royal-gold transition-all relative z-10 font-sans shadow-inner"
              />
              <div className="space-y-3 mt-4 relative z-10">
                <button 
                  type="button"
                  onClick={handleAIParse}
                  disabled={isThinking || !rawText.trim()}
                  className="w-full bg-gradient-to-r from-royal-goldDark to-royal-gold hover:to-royal-goldLight text-[#2A0505] font-bold py-4 rounded shadow-lg flex items-center justify-center transition-all disabled:opacity-50 border border-royal-goldLight/20 font-serif uppercase tracking-widest"
                >
                  {isThinking ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Wand2 className="w-5 h-5 mr-2" />}
                  {isThinking ? 'Processando...' : 'Criar Automaticamente'}
                </button>
                <button 
                  type="button"
                  onClick={() => setAiInputMode(false)}
                  className="w-full py-3 text-royal-gold/50 text-xs font-medium hover:text-royal-gold uppercase tracking-widest"
                >
                  Preencher Manualmente
                </button>
              </div>
            </div>
        </div>
        
        {/* Modal Local */}
        {localModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-fade-in">
             <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={closeLocalModal} />
             <div className="relative bg-[#1a0505] border border-royal-gold rounded p-6 max-w-sm w-full shadow-glow">
                <div className="flex flex-col items-center text-center">
                   <h3 className="text-lg font-bold text-royal-goldLight mb-2 font-serif uppercase tracking-widest">{localModal.title}</h3>
                   <p className="text-sm text-royal-gold/70 mb-6">{localModal.message}</p>
                   <button onClick={localModal.onConfirm} className="w-full bg-royal-gold text-[#2A0505] font-serif font-bold uppercase py-2 rounded">OK</button>
                </div>
             </div>
          </div>
        )}
      </>
    );
  }

  // --- RENDERIZAR: EDITOR ---
  return (
    <div className="space-y-6 animate-fade-in pb-32">
      <div className="flex items-center space-x-4 mb-6">
        <button type="button" onClick={onCancel} className="p-2 rounded-full hover:bg-black/30 transition-colors">
          <ArrowLeft className="w-6 h-6 text-royal-gold" />
        </button>
        <h2 className="text-xl font-bold text-royal-goldLight font-serif uppercase tracking-widest">
          {existingWeek ? 'Editar Campanha' : 'Nova Campanha'}
        </h2>
      </div>

      {/* Detalhes da Semana */}
      <div className="bg-[#1a0505]/90 p-5 rounded-lg border border-royal-gold/30 space-y-4 shadow-metal relative overflow-hidden">
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-royal-gold/10 to-transparent pointer-events-none"></div>

        <div>
          <label className="block text-[10px] font-bold text-royal-gold uppercase mb-1 tracking-widest">Nome da Campanha</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Rally dos Vencedores"
            className="w-full bg-black/60 border border-royal-gold/20 rounded p-3 text-royal-goldLight focus:border-royal-gold focus:outline-none transition-colors shadow-inner"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-royal-gold uppercase mb-1 tracking-widest">Data</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-black/60 border border-royal-gold/20 rounded p-3 text-royal-goldLight focus:border-royal-gold focus:outline-none transition-colors shadow-inner"
            />
          </div>
          <div className="flex items-center justify-end">
            <div className="bg-black/60 px-4 py-2 rounded border border-royal-gold/20 shadow-inner">
              <span className="block text-[9px] text-royal-gold/50 uppercase font-bold text-right tracking-widest">Total</span>
              <span className="text-xl font-bold text-royal-gold font-serif">{totalWeekPoints.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <textarea 
          value={verse}
          onChange={(e) => setVerse(e.target.value)}
          placeholder="Versículo bíblico (opcional)..."
          rows={2}
          className="w-full bg-black/60 border border-royal-gold/20 rounded p-3 text-royal-goldLight/80 placeholder-royal-gold/20 focus:border-royal-gold focus:outline-none transition-colors font-serif italic shadow-inner"
        />
      </div>

      {/* Lista de Missões */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-royal-gold/20 pb-2">
          <h3 className="text-lg font-bold text-royal-goldLight flex items-center font-serif uppercase tracking-widest">
            <Target className="w-5 h-5 mr-2 text-royal-gold" />
            Missões
          </h3>
          <div className="flex items-center space-x-2">
            {missions.length > 0 && (
                <button 
                type="button"
                onClick={askClearMissions}
                className="text-[10px] text-red-400 border border-red-900/50 px-3 py-1.5 rounded flex items-center hover:bg-red-900/20 cursor-pointer transition-colors uppercase tracking-wider"
                >
                <Trash2 className="w-3 h-3 mr-1" /> Limpar
                </button>
            )}
            <button 
                type="button"
                onClick={addMission}
                className="text-[10px] bg-royal-gold/10 text-royal-gold border border-royal-gold/40 px-3 py-1.5 rounded flex items-center hover:bg-royal-gold/20 cursor-pointer transition-colors uppercase tracking-wider font-bold"
                style={{ boxShadow: '0 0 10px rgba(198,156,109,0.1)' }}
            >
                <Plus className="w-3 h-3 mr-1" /> Nova Missão
            </button>
          </div>
        </div>

        {missions.map((mission) => {
          const isExpanded = expandedMissionId === mission.id;
          const missionTotal = calculateMissionTotal(mission);

          return (
            <div key={mission.id} className={`bg-[#120404] border ${isExpanded ? 'border-royal-gold shadow-glow' : 'border-royal-gold/20'} rounded-lg overflow-hidden transition-all duration-300`}>
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-royal-gold/5"
                onClick={() => setExpandedMissionId(isExpanded ? null : mission.id)}
              >
                <div className="flex-1 mr-4">
                  {isExpanded ? (
                    <input 
                      type="text"
                      value={mission.title}
                      onChange={(e) => updateMissionTitle(mission.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-black/60 text-royal-goldLight font-bold px-2 py-1 rounded border border-royal-gold/30 focus:border-royal-gold focus:outline-none"
                    />
                  ) : (
                    <h4 className="font-bold text-royal-goldLight font-serif tracking-wide">{mission.title}</h4>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-mono font-bold text-royal-gold">{missionTotal.toLocaleString()}</span>
                  <button
                    type="button"
                    onClick={(e) => askRemoveMission(e, mission.id)}
                    className="p-2 text-royal-gold/30 hover:text-red-400 rounded-full cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className={`w-5 h-5 text-royal-gold/40 transition-transform ${isExpanded ? 'rotate-90 text-royal-gold' : ''}`} />
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 bg-black/40 border-t border-royal-gold/20 space-y-3 relative">
                   <div className="absolute inset-0 bg-pattern opacity-5 pointer-events-none"></div>
                  {mission.items.map(item => (
                    <div key={item.id} className="flex flex-col sm:flex-row items-center bg-[#1a0505] p-3 rounded gap-3 border border-royal-gold/10 relative z-10">
                        <div className="flex-1 w-full">
                            <input 
                              value={item.label}
                              onChange={(e) => updateMissionItem(mission.id, item.id, 'label', e.target.value)}
                              className="w-full bg-transparent text-sm text-royal-goldLight border-b border-royal-gold/20 mb-1 focus:border-royal-gold focus:outline-none"
                            />
                            <div className="flex items-center text-xs text-royal-gold/70">
                               <input 
                                  type="number"
                                  value={item.points}
                                  onChange={(e) => updateMissionItem(mission.id, item.id, 'points', Number(e.target.value))}
                                  className="w-16 bg-black/50 border border-royal-gold/20 rounded px-1 mr-1 text-royal-goldLight focus:border-royal-gold text-right"
                               /> pts
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                             <div className="flex items-center bg-black/80 rounded border border-royal-gold/20">
                                <button type="button" className="w-8 h-8 flex items-center justify-center text-royal-gold/50 hover:text-royal-gold hover:bg-white/5 cursor-pointer transition-colors"
                                  onClick={() => updateMissionItem(mission.id, item.id, 'quantity', Math.max(0, item.quantity - 1))}>-</button>
                                <span className="w-8 text-center text-royal-goldLight font-bold">{item.quantity}</span>
                                <button type="button" className="w-8 h-8 flex items-center justify-center text-royal-gold/50 hover:text-royal-gold hover:bg-white/5 cursor-pointer transition-colors"
                                  onClick={() => updateMissionItem(mission.id, item.id, 'quantity', item.quantity + 1)}>+</button>
                              </div>
                              <button type="button" onClick={() => removeMissionItem(mission.id, item.id)} className="text-royal-gold/20 hover:text-red-400 cursor-pointer transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                        </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => addMissionItem(mission.id)} className="w-full py-2 border border-dashed border-royal-gold/20 rounded text-royal-gold/40 text-[10px] font-bold uppercase hover:border-royal-gold hover:text-royal-gold cursor-pointer transition-colors tracking-widest">
                     + Adicionar Regra
                  </button>
                  <textarea
                        value={mission.notes || ''}
                        onChange={(e) => updateMissionNotes(mission.id, e.target.value)}
                        placeholder="Observações..."
                        rows={1}
                        className="w-full bg-black/30 text-sm border border-royal-gold/10 rounded p-2 text-royal-gold/60 mt-2 focus:border-royal-gold focus:outline-none shadow-inner"
                     />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Área de Perigo (Delete Fallback) */}
      {existingWeek && onDelete && (
        <div className="pt-8 pb-4">
             <div className="bg-red-950/20 border border-red-500/20 rounded p-4 flex items-center justify-between">
                <div className="flex items-center text-red-500/70">
                   <AlertTriangle className="w-5 h-5 mr-3" />
                   <span className="text-xs font-bold uppercase tracking-widest">Zona de Perigo</span>
                </div>
                <button 
                  type="button"
                  onClick={askDeleteCampaign}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-900/20 hover:bg-red-900/50 text-red-400 text-[10px] font-bold rounded transition-colors cursor-pointer border border-red-500/30 uppercase tracking-widest"
                >
                  {isDeleting ? 'Excluindo...' : 'Excluir Campanha'}
                </button>
             </div>
        </div>
      )}

      {/* Botões Flutuantes (Footer Fixo) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#1a0505] to-[#2a0505] border-t-2 border-royal-gold/40 flex justify-center gap-3 z-50 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
        {existingWeek && onDelete && (
             <button 
             type="button"
             onClick={askDeleteCampaign}
             disabled={isDeleting}
             className="flex items-center justify-center bg-red-900/80 hover:bg-red-800 disabled:opacity-50 text-white font-bold w-12 h-12 rounded-full shadow-lg transition-all cursor-pointer border-2 border-red-500/50"
             title="Excluir Semana Inteira"
           >
             {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
           </button>
        )}
        <button 
          type="button"
          onClick={handleSave}
          className="flex-1 max-w-xs flex items-center justify-center bg-gradient-to-r from-royal-gold to-royal-goldDark text-[#2A0505] font-serif font-bold uppercase tracking-widest h-12 rounded-full shadow-glow hover:brightness-110 cursor-pointer transition-all border border-royal-goldLight/50"
        >
          <Save className="w-5 h-5 mr-2" />
          Salvar
        </button>
      </div>

      {/* --- MODAL LOCAL --- */}
      {localModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={closeLocalModal} />
          
          <div className="relative bg-[#1a0505] border border-royal-gold rounded p-6 max-w-sm w-full shadow-glow">
             <div className="flex flex-col items-center text-center">
                <div className={`p-4 rounded-full mb-4 ${localModal.isDanger ? 'bg-red-900/20 text-red-500' : 'bg-royal-gold/10 text-royal-gold'}`}>
                   {localModal.isDanger ? <AlertTriangle className="w-8 h-8" /> : <Check className="w-8 h-8" />}
                </div>

                <h3 className="text-xl font-bold text-royal-goldLight mb-2 font-serif uppercase tracking-widest">{localModal.title}</h3>
                <p className="text-sm text-royal-gold/70 mb-6 font-serif">{localModal.message}</p>

                <div className="flex gap-3 w-full">
                    {localModal.showCancel && (
                        <button 
                          onClick={closeLocalModal}
                          className="flex-1 px-4 py-3 bg-transparent hover:bg-white/5 text-royal-gold/50 font-bold rounded border border-royal-gold/20 uppercase tracking-widest text-xs"
                        >
                            Cancelar
                        </button>
                    )}
                    <button 
                      onClick={localModal.onConfirm}
                      className={`flex-1 px-4 py-3 font-bold rounded uppercase tracking-widest text-xs transition-colors ${
                          localModal.isDanger 
                          ? 'bg-red-900 hover:bg-red-800 text-white border border-red-500'
                          : 'bg-royal-gold hover:bg-royal-goldLight text-[#2A0505]'
                      }`}
                    >
                        {localModal.isDanger ? 'Confirmar' : 'OK'}
                    </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}