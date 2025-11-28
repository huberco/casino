export interface GameStatus {
  gameType: string;
  activePlayers: number;
  status: string;
  lastUpdated: string;
}

export interface GameStatusResponse {
  gameStatuses: GameStatus[];
  totalActivePlayers: number;
  lastUpdated: string;
}

export interface SingleGameStatus {
  gameType: string;
  activePlayers: number;
  status: string;
  lastUpdated: string;
}
