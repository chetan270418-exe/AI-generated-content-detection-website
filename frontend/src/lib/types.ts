export interface User {
  id: string;
  email: string;
  plan: 'free_trial' | 'vip' | 'expired';
  analyses_count: number;
  created_at: string;
}

export interface Analysis {
  id: string;
  file_type: 'image' | 'text' | 'pdf' | 'video';
  original_filename?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  verdict?: 'ai_generated' | 'human_made' | 'inconclusive';
  confidence_score?: number;
  explanation?: string;
  detailed_results?: Record<string, any>;
  created_at: string;
  completed_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface HistoryResponse {
  analyses: Analysis[];
  total: number;
  page: number;
  pages: number;
}
