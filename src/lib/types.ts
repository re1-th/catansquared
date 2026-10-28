export type Player = {
  id: number;
  name: string;
};

export type GameResult = {
  playerId: number;
  score: number;
  isWinner: boolean;
  longestRoad: boolean;
  largestArmy: boolean;
};

export type Game = {
  id: number;
  /** YYYY-MM-DD */
  playedOn: string;
  /** 1-based position in chronological order across all games. */
  number: number;
  results: GameResult[];
};

export type GameInput = {
  playedOn: string;
  results: GameResult[];
};
