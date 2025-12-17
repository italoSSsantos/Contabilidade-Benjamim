export interface MissionItem {
  id: string;
  label: string; // Ex: "Jovem firme presente"
  points: number; // Ex: 300
  quantity: number; // User inputs this
}

export interface Mission {
  id: string;
  title: string; // Ex: "REUNIÃO DO ALGO A +"
  items: MissionItem[];
  notes?: string;
}

export interface WeekCampaign {
  id: string;
  name: string; // e.g., "Rally dos Vencedores - 2ª Semana"
  date: string;
  verse?: string;
  missions: Mission[];
  isArchived: boolean;
}

export type ViewState = 'DASHBOARD' | 'WEEK_EDITOR' | 'HISTORY';