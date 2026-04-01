export type Player = { id: string; nickname: string; isHost: boolean };

export type LobbyState = {
  players: Player[];
  locked: boolean;
  N: number;
};

export type PromptType = "binary" | "multiple_choice" | "scale";

export type Prompt = {
  id: string;
  text: string;
  type: PromptType;
  options?: string[]; // only for multiple_choice, exactly 4 items
};

export type GamePhase =
  | "lobby"
  | "phase1"
  | "phase2"
  | "phase3"
  | "leaderboard"
  | "ended";

export type PlayerScore = {
  nickname: string;
  total: number;
  roundScore: number; // points earned this round
  rank?: number;
};

export type RoundResult = {
  prompt: Prompt;
  phase1Answers: Record<string, string | number>; // nickname -> answer
  phase2Predictions: Record<string, string | number>; // nickname -> prediction
  phase2Wagers: Record<string, boolean>; // nickname -> doubled down?
  actualResult: string | number; // the real answer (count/average/winner)
  scores: Record<string, number>; // nickname -> points this round
  chaosBonusAwarded: boolean;
};

export type GameState = {
  phase: GamePhase;
  round: number; // 1-indexed
  totalRounds: number;
  prompt: Prompt | null;
  phaseEndsAt: number | null; // unix ms timestamp
  phase1Duration: number; // seconds
  phase2Duration: number; // seconds
  roundResult: RoundResult | null;
  leaderboard: PlayerScore[];
  N: number;
  answeredCount: number;
};

export type ServerMessage =
  | { type: "state"; lobby: LobbyState }
  | { type: "game"; game: GameState }
  | { type: "connected"; roomId: string; isHost: boolean }
  | { type: "room_not_found" }
  | { type: "kicked" }
  | { type: "disbanded" }
  | { type: "duplicate_tab" };

export type ClientMessage =
  | { type: "join"; nickname: string; isHost?: boolean }
  | { type: "rejoin"; nickname: string }
  | { type: "lock" }
  | { type: "start_game"; numQuestions: number; phase1Time: number; phase2Time: number }
  | { type: "submit_answer"; answer: string | number }
  | { type: "submit_prediction"; prediction: string | number; doubleDown: boolean }
  | { type: "next_round" } // host only
  | { type: "end_game" }
  | { type: "disband_room" } // host only — resets hasHost so room appears gone
  | { type: "play_again"; numQuestions: number; phase1Time: number; phase2Time: number } // host only
  | { type: "reset_to_lobby" } // host only — unlock room, return to lobby phase
  | { type: "kick_player"; nickname: string }
  | { type: "skip_question" };
