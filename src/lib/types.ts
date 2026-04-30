export type Player = { id: string; nickname: string; isHost: boolean; emoji?: string };

export type LobbyState = {
  players: Player[];
  locked: boolean;
  N: number;
  disconnectedNicknames: string[];
};

export type PromptType = "binary" | "multiple_choice" | "scale";

export type Prompt = {
  id: string;
  text: string;
  type: PromptType;
  options?: string[]; // only for multiple_choice, exactly 4 items
  labelLow?: string;  // only for scale, label for 1
  labelHigh?: string; // only for scale, label for 10
};

export type GamePhase =
  | "lobby"
  | "question_submission"
  | "countdown"
  | "phase1"
  | "phase2"
  | "phase3"
  | "leaderboard"
  | "ended";

export type PlayerScore = {
  nickname: string;
  emoji?: string;
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
  phase1AnsweredCount: number; // how many players answered phase1 (used as N for binary scoring)
  phase1AnsweredNicknames: string[]; // who answered phase1 (used to determine phase2 eligibility)
  answeredCount: number;
  answeredNicknames: string[]; // who has submitted in current phase
  doubleDownUsed: string[]; // nicknames who have already used their one double down
  paused: boolean;
  pausedTimeRemaining: number | null; // ms remaining when paused
  submittedQuestionCount: number;
  mode: "game_questions" | "player_questions";
};

export type ServerMessage =
  | { type: "state"; lobby: LobbyState }
  | { type: "game"; game: GameState }
  | { type: "connected"; roomId: string; isHost: boolean }
  | { type: "room_not_found" }
  | { type: "kicked" }
  | { type: "disbanded" }
  | { type: "duplicate_tab" }
  | { type: "nickname_taken" }
  | { type: "question_received"; question: { id: string; text: string; type: "binary" | "multiple_choice" | "scale"; options?: string[]; labelLow?: string; labelHigh?: string; submittedBy: string } };

export type ClientMessage =
  | { type: "join"; nickname: string; isHost?: boolean }
  | { type: "rejoin"; nickname: string }
  | { type: "lock" }
  | { type: "start_game"; numQuestions: number; phase1Time: number; phase2Time: number; mode: "game_questions" | "player_questions" }
  | { type: "submit_answer"; answer: string | number }
  | { type: "submit_prediction"; prediction: string | number; doubleDown: boolean }
  | { type: "next_round" } // host only
  | { type: "end_game" }
  | { type: "disband_room" } // host only — resets hasHost so room appears gone
  | { type: "play_again"; numQuestions: number; phase1Time: number; phase2Time: number } // host only
  | { type: "reset_to_lobby" } // host only — unlock room, return to lobby phase
  | { type: "kick_player"; nickname: string }
  | { type: "skip_question" }
  | { type: "set_emoji"; emoji: string }
  | { type: "leave" } // player voluntarily leaves lobby
  | { type: "pause_timer" } // host only — pause current phase timer
  | { type: "resume_timer" } // host only — resume current phase timer
  | { type: "submit_question"; text: string; questionType: "binary" | "multiple_choice" | "scale"; options?: string[]; labelLow?: string; labelHigh?: string }
  | { type: "delete_question"; id: string } // host only
  | { type: "begin_game" }; // host only — start countdown after question_submission phase
