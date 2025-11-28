export interface DailyStat {
  date: string;
  games: number;
  wagered: number;
  won: number;
  profit: number;
}

export interface DailyStatsSummary {
  totalGames: number;
  totalWagered: number;
  totalWon: number;
  totalProfit: number;
  activeDays: number;
  averageGamesPerDay: string;
  averageWageredPerDay: string;
  winRate: string;
}

export interface DailyStatsPeriod {
  startDate: string;
  endDate: string;
  days: number;
}

export interface DailyStatsResponse {
  dailyStats: DailyStat[];
  summary: DailyStatsSummary;
  period: DailyStatsPeriod;
}
