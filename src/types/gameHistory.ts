export interface GameHistoryEntry {
  id: string;
  gameType: 'mine' | 'coinflip' | 'crash' | 'roulette';
  gameName: string;
  date: string;
  betAmount: number;
  payoutAmount?: number;
  result: 'win' | 'loss' | 'pending';
  profitLoss: number;
  multiplier?: number;
  description: string;
  gameId: string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  metadata?: {
    multiplier?: number;
    originalBet?: number;
    houseEdge?: number;
    gameResult?: any;
    [key: string]: any;
  };
}

export interface GameHistoryFilters {
  gameType?: string;
  result?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface GameHistoryResponse {
  success: boolean;
  data: {
    transactions: GameHistoryEntry[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}

export interface GameHistoryStats {
  totalGames: number;
  winRate: number;
  netProfit: number;
  totalWagered: number;
  totalWon: number;
  totalLost: number;
}
