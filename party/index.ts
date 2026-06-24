import type * as Party from "partykit/server";
import { createClient } from "@supabase/supabase-js";
import { PROMPTS, getPromptsForGame } from "../src/lib/prompts";
import type { Prompt, PromptType } from "../src/lib/prompts";

type Player = { id: string; nickname: string; isHost: boolean; emoji?: string };
type LobbyState = { players: Player[]; locked: boolean; N: number; disconnectedNicknames: string[] };

type GamePhase = "lobby" | "question_submission" | "countdown" | "phase1" | "phase2" | "phase3" | "leaderboard" | "ended";

type PlayerScore = {
  nickname: string;
  emoji?: string;
  total: number;
  roundScore: number;
  rank?: number;
};

type RoundResult = {
  prompt: Prompt;
  phase1Answers: Record<string, string | number>;
  phase2Predictions: Record<string, string | number>;
  phase2Wagers: Record<string, boolean>;
  actualResult: string | number;
  scores: Record<string, number>;
  chaosBonusAwarded: boolean;
};

type GameState = {
  phase: GamePhase;
  round: number;
  totalRounds: number;
  prompt: Prompt | null;
  phaseEndsAt: number | null;
  phase1Duration: number; // seconds
  phase2Duration: number; // seconds
  roundResult: RoundResult | null;
  leaderboard: PlayerScore[];
  N: number;
  phase1AnsweredCount: number;
  phase1AnsweredNicknames: string[];
  answeredCount: number;
  answeredNicknames: string[];
  doubleDownUsed: string[];
  paused: boolean;
  pausedTimeRemaining: number | null; // ms remaining when paused
  submittedQuestionCount: number;
  mode: "game_questions" | "player_questions";
};

type ClientMessage =
  | { type: "join"; nickname: string; isHost?: boolean; hostToken?: string }
  | { type: "rejoin"; nickname: string; hostToken?: string }
  | { type: "lock" }
  | { type: "start_game"; numQuestions: number; phase1Time: number; phase2Time: number; mode: "game_questions" | "player_questions" }
  | { type: "submit_answer"; answer: string | number }
  | { type: "submit_prediction"; prediction: string | number; doubleDown: boolean }
  | { type: "next_round" }
  | { type: "end_game" }
  | { type: "disband_room" }
  | { type: "play_again"; numQuestions: number; phase1Time: number; phase2Time: number }
  | { type: "reset_to_lobby" }
  | { type: "kick_player"; nickname: string }
  | { type: "skip_question" }
  | { type: "set_emoji"; emoji: string }
  | { type: "leave" }
  | { type: "pause_timer" }
  | { type: "resume_timer" }
  | { type: "submit_question"; text: string; questionType: "binary" | "multiple_choice" | "scale"; options?: string[]; labelLow?: string; labelHigh?: string }
  | { type: "delete_question"; id: string }
  | { type: "begin_game" };


function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}


function calculateProximityScore(
  prediction: string | number,
  actual: string | number,
  N: number,
  type: PromptType,
  voteCounts?: Map<string, number>
): number {
  if (type === "multiple_choice") {
    // actual may be comma-joined tied winners
    const predStr = String(prediction).trim();
    const winners = String(actual).split("|").map((w) => w.trim());
    if (!winners.includes(predStr)) return 0;
    // Points = 1125 - 500 * (votes_for_winner / N), min 0
    const votes = voteCounts?.get(predStr) ?? 0;
    const score = N > 0 ? 1125 - 500 * (votes / N) : 1000;
    return Math.max(0, Math.round(score));
  }

  const pred = Number(prediction);
  const act = Number(actual);
  const diff = Math.abs(pred - act);

  if (type === "binary") {
    // 1000 - 2000 * (diff / N), min 0
    const score = N > 0 ? 1000 - 2000 * (diff / N) : (diff === 0 ? 1000 : 0);
    return Math.max(0, Math.round(score));
  }

  // scale: 1000 - 250 * diff^2, min 0
  const score = 1000 - 250 * diff * diff;
  return Math.max(0, Math.round(score));
}

function isHighlyAccurate(baseScore: number): boolean {
  // Double Down threshold: 750+
  return baseScore >= 750;
}

function computeActualResult(
  prompt: Prompt,
  answers: Map<string, string | number>
): string | number {
  if (prompt.type === "binary") {
    let yesCount = 0;
    answers.forEach((v) => {
      if (v === "yes" || v === 1 || v === "1") yesCount++;
    });
    return yesCount;
  }

  if (prompt.type === "multiple_choice") {
    // Find most common answer(s), including ties
    const counts = new Map<string, number>();
    answers.forEach((v) => {
      const key = String(v);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    let maxCount = 0;
    counts.forEach((count) => { if (count > maxCount) maxCount = count; });
    const winners: string[] = [];
    counts.forEach((count, option) => { if (count === maxCount) winners.push(option); });
    return winners.join("|");
  }

  // scale — average
  let sum = 0;
  let count = 0;
  answers.forEach((v) => {
    sum += Number(v);
    count++;
  });
  if (count === 0) return 5;
  return Math.round((sum / count) * 10) / 10;
}

function computeVoteCounts(answers: Map<string, string | number>): Map<string, number> {
  const counts = new Map<string, number>();
  answers.forEach((v) => {
    const key = String(v);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return counts;
}

function computeScores(
  prompt: Prompt,
  answers: Map<string, string | number>,
  predictions: Map<string, string | number>,
  wagers: Map<string, boolean>,
  actual: string | number,
  N: number,
): Record<string, number> {
  const voteCounts = prompt.type === "multiple_choice" ? computeVoteCounts(answers) : undefined;
  const scores: Record<string, number> = {};

  predictions.forEach((prediction, nickname) => {
    let base = calculateProximityScore(prediction, actual, N, prompt.type, voteCounts);
    const doubled = wagers.get(nickname) ?? false;

    if (doubled) {
      base = base * 2;
    }

    scores[nickname] = Math.round(base);
  });

  return scores;
}


export default class GameServer implements Party.Server {
  private lobby: LobbyState = { players: [], locked: false, N: 0, disconnectedNicknames: [] };
  private hasHost = false; // true once a host has joined this room
  private rejoinTimers: Map<string, ReturnType<typeof setTimeout>> = new Map(); // nickname -> timer
  private game: GameState = {
    phase: "lobby",
    round: 0,
    totalRounds: 10,
    prompt: null,
    phaseEndsAt: null,
    phase1Duration: 25,
    phase2Duration: 20,
    roundResult: null,
    leaderboard: [],
    N: 0,
    phase1AnsweredCount: 0,
    phase1AnsweredNicknames: [],
    answeredCount: 0,
    answeredNicknames: [],
    doubleDownUsed: [],
    paused: false,
    pausedTimeRemaining: null,
    submittedQuestionCount: 0,
    mode: "game_questions",
  };
  private submittedQuestions: (Prompt & { submittedBy: string })[] = [];
  private prompts: Prompt[] = [];
  private phase1Answers: Map<string, string | number> = new Map();
  private phase2Predictions: Map<string, string | number> = new Map();
  private phase2Wagers: Map<string, boolean> = new Map();
  private phaseTimer: ReturnType<typeof setTimeout> | null = null;
  private totalScores: Map<string, number> = new Map();
  private roundResults: RoundResult[] = [];
  private gameStartedAt: number = 0;
  private hostName: string = "Host";
  private validatedHostToken: string | null = null;

  constructor(readonly room: Party.Room) {}

  private broadcastLobby() {
    const visibleLobby = {
      ...this.lobby,
      players: this.lobby.players.filter((p) => !p.isHost),
      N: this.lobby.players.filter((p) => !p.isHost).length,
      disconnectedNicknames: [...this.rejoinTimers.keys()],
    };
    const msg = JSON.stringify({ type: "state", lobby: visibleLobby });
    this.room.broadcast(msg);
  }

  private broadcastGame() {
    const msg = JSON.stringify({ type: "game", game: this.game });
    this.room.broadcast(msg);
  }

  private clearTimer() {
    if (this.phaseTimer !== null) {
      clearTimeout(this.phaseTimer);
      this.phaseTimer = null;
    }
  }

  private getNickname(senderId: string): string | null {
    const player = this.lobby.players.find((p) => p.id === senderId);
    return player?.nickname ?? null;
  }

  private buildLeaderboard(roundScores?: Record<string, number>): PlayerScore[] {
    const players = this.lobby.players.filter((p) => !p.isHost);
    const scores: PlayerScore[] = players.map((p) => ({
      nickname: p.nickname,
      emoji: p.emoji,
      total: this.totalScores.get(p.nickname) ?? 0,
      roundScore: roundScores?.[p.nickname] ?? 0,
    }));
    scores.sort((a, b) => b.total - a.total);
    // Dense ranking: tied scores get the same rank
    let rank = 1;
    scores.forEach((s, i) => {
      if (i > 0 && s.total < scores[i - 1].total) rank = i + 1;
      s.rank = rank;
    });
    return scores;
  }

  private startPhase1() {
    const promptIndex = this.game.round - 1;
    if (promptIndex >= this.prompts.length) {
      this.endGame();
      return;
    }

    this.phase1Answers.clear();
    this.phase2Predictions.clear();
    this.phase2Wagers.clear();

    const prompt = this.prompts[promptIndex];
    const ms = this.game.phase1Duration * 1000;
    const phaseEndsAt = Date.now() + ms;

    this.game = {
      ...this.game,
      phase: "phase1",
      prompt,
      phaseEndsAt,
      roundResult: null,
      answeredCount: 0,
      answeredNicknames: [],
      phase1AnsweredCount: 0,
      phase1AnsweredNicknames: [],
      doubleDownUsed: this.game.doubleDownUsed,
      paused: false,
      pausedTimeRemaining: null,
    };
    this.broadcastGame();

    this.clearTimer();
    this.phaseTimer = setTimeout(() => this.startPhase2(), ms);
  }

  private startPhase2() {
    this.clearTimer();
    // If nobody answered phase1, skip phase2 entirely — everyone gets 0
    if (this.phase1Answers.size === 0) {
      this.startPhase3();
      return;
    }
    const ms = this.game.phase2Duration * 1000;
    const phaseEndsAt = Date.now() + ms;
    this.game = {
      ...this.game,
      phase: "phase2",
      phaseEndsAt,
      phase1AnsweredCount: this.phase1Answers.size,
      phase1AnsweredNicknames: [...this.phase1Answers.keys()],
      answeredCount: 0,
      answeredNicknames: [],
      doubleDownUsed: this.game.doubleDownUsed,
      paused: false,
      pausedTimeRemaining: null,
    };
    this.broadcastGame();
    this.phaseTimer = setTimeout(() => this.startPhase3(), ms);
  }

  private startPhase3() {
    this.clearTimer();
    const prompt = this.game.prompt!;
    const N = this.lobby.N;

    const actual = computeActualResult(prompt, this.phase1Answers);
    // Always use actual answerers as N — vote share and YES count are both relative to who answered
    const scoringN = this.phase1Answers.size || N;

    const scores = computeScores(
      prompt,
      this.phase1Answers,
      this.phase2Predictions,
      this.phase2Wagers,
      actual,
      scoringN,
    );
    console.log("[scoring] type:", prompt.type, "actual:", JSON.stringify(actual), "scoringN:", scoringN);
    console.log("[scoring] phase1Answers:", JSON.stringify(Object.fromEntries(this.phase1Answers)));
    console.log("[scoring] phase2Predictions:", JSON.stringify(Object.fromEntries(this.phase2Predictions)));
    console.log("[scoring] scores:", JSON.stringify(scores));

    // Update totals
    Object.entries(scores).forEach(([nickname, pts]) => {
      this.totalScores.set(nickname, (this.totalScores.get(nickname) ?? 0) + pts);
    });

    const roundResult: RoundResult = {
      prompt,
      phase1Answers: Object.fromEntries(this.phase1Answers),
      phase2Predictions: Object.fromEntries(this.phase2Predictions),
      phase2Wagers: Object.fromEntries(this.phase2Wagers),
      actualResult: actual,
      scores,
      chaosBonusAwarded: false,
    };

    this.roundResults.push(roundResult);

    const leaderboard = this.buildLeaderboard(scores);

    this.game = {
      ...this.game,
      phase: "phase3",
      phaseEndsAt: null,
      roundResult,
      leaderboard,
    };
    this.broadcastGame();
    // No auto-advance — host clicks "Next Round" to go to leaderboard
  }

  private startLeaderboard() {
    this.clearTimer();
    const isLastRound = this.game.round >= this.game.totalRounds;

    if (isLastRound) {
      this.endGame();
      return;
    }

    // No auto-advance — host clicks "Next Round"
    this.game = { ...this.game, phase: "leaderboard", phaseEndsAt: null };
    this.broadcastGame();
  }

  private advanceToNextRound() {
    this.clearTimer();
    this.game = { ...this.game, round: this.game.round + 1 };
    this.startPhase1();
  }

  private endGame() {
    this.clearTimer();
    const leaderboard = this.buildLeaderboard();
    this.game = { ...this.game, phase: "ended", phaseEndsAt: null, leaderboard };
    this.broadcastGame();
    this.saveGameToSupabase(leaderboard).catch((e) =>
      console.error("[supabase] save failed:", e)
    );
  }

  private async saveGameToSupabase(leaderboard: PlayerScore[]) {
    const url = this.room.env.SUPABASE_URL as string;
    const key = this.room.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!url || !key) return;

    const supabase = createClient(url, key);
    const endedAt = new Date();
    const startedAt = new Date(this.gameStartedAt);
    const durationSeconds = Math.round((endedAt.getTime() - startedAt.getTime()) / 1000);

    const finalScores = leaderboard.map((p) => ({
      nickname: p.nickname,
      emoji: p.emoji,
      total: p.total,
      rank: p.rank,
    }));

    const { data: gameRow, error: gameError } = await supabase
      .from("games")
      .insert({
        room_code: this.room.id,
        host_name: this.hostName,
        started_at: startedAt.toISOString(),
        ended_at: endedAt.toISOString(),
        duration_seconds: durationSeconds,
        player_count: this.lobby.players.filter((p) => !p.isHost).length,
        total_rounds: this.game.totalRounds,
        mode: this.game.mode,
        final_scores: finalScores,
      })
      .select("id")
      .single();

    if (gameError || !gameRow) {
      console.error("[supabase] games insert error:", gameError);
      return;
    }

    const gameId = gameRow.id;

    if (this.roundResults.length > 0) {
      const roundRows = this.roundResults.map((r, i) => ({
        game_id: gameId,
        round_number: i + 1,
        question_text: r.prompt.text,
        question_type: r.prompt.type,
        question_options: r.prompt.options ?? null,
        actual_result: String(r.actualResult),
        phase1_answers: r.phase1Answers,
        phase2_predictions: r.phase2Predictions,
        phase2_wagers: r.phase2Wagers,
        scores: r.scores,
      }));

      const { error: roundsError } = await supabase.from("game_rounds").insert(roundRows);
      if (roundsError) console.error("[supabase] game_rounds insert error:", roundsError);
    }

    if (this.game.mode === "player_questions" && this.submittedQuestions.length > 0) {
      const questionRows = this.submittedQuestions.map((q) => ({
        game_id: gameId,
        submitted_by: q.submittedBy,
        text: q.text,
        question_type: q.type,
        options: q.options ?? null,
        label_low: q.labelLow ?? null,
        label_high: q.labelHigh ?? null,
        created_at: new Date().toISOString(),
      }));

      const { error: questionsError } = await supabase.from("custom_questions").insert(questionRows);
      if (questionsError) console.error("[supabase] custom_questions insert error:", questionsError);
    }
  }

  private async deactivateRoom() {
    const url = this.room.env.SUPABASE_URL as string;
    const key = this.room.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!url || !key) return;
    const supabase = createClient(url, key);
    await supabase.from("hosts").update({ active: false }).eq("room_code", this.room.id).eq("active", true);
  }

  private async validateHostToken(token: string | undefined): Promise<boolean> {
    if (!token) return false;
    // Use cached value if already validated this session
    if (this.validatedHostToken !== null) return token === this.validatedHostToken;

    const url = this.room.env.SUPABASE_URL as string;
    const key = this.room.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!url || !key) return false;

    const supabase = createClient(url, key);
    const { data } = await supabase
      .from("hosts")
      .select("host_token")
      .eq("room_code", this.room.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!data?.host_token) return false;
    this.validatedHostToken = data.host_token;
    return token === this.validatedHostToken;
  }

  private checkAllAnswered(phase: "phase1" | "phase2") {
    if (phase === "phase1") {
      const players = this.lobby.players.filter((p) => !p.isHost);
      if (players.length === 0) return false;
      return players.every((p) => this.phase1Answers.has(p.nickname));
    }
    // phase2: only players who answered phase1 AND are still in the lobby are eligible
    if (this.phase1Answers.size === 0) return true;
    const currentNicknames = new Set(this.lobby.players.filter((p) => !p.isHost).map((p) => p.nickname));
    return [...this.phase1Answers.keys()]
      .filter((nick) => currentNicknames.has(nick))
      .every((nick) => this.phase2Predictions.has(nick));
  }

  onConnect(conn: Party.Connection) {
    console.log("[server] onConnect", conn.id, "room:", this.room.id, "hasHost:", this.hasHost, "players:", this.lobby.players.length);
    const visibleLobby = {
      ...this.lobby,
      players: this.lobby.players.filter((p) => !p.isHost),
      disconnectedNicknames: [...this.rejoinTimers.keys()],
    };
    conn.send(JSON.stringify({ type: "state", lobby: visibleLobby }));
    if (this.game.phase !== "lobby") {
      conn.send(JSON.stringify({ type: "game", game: this.game }));
    }
  }

  async onMessage(message: string, sender: Party.Connection) {
    if (message.length > 2048) return;
    let msg: ClientMessage;
    try {
      msg = JSON.parse(message) as ClientMessage;
    } catch {
      return;
    }

    // ---- Lobby messages ----
    if (msg.type === "join") {
      console.log("[server] join from", sender.id, "nickname:", msg.nickname, "isHost:", msg.isHost, "locked:", this.lobby.locked, "hasHost:", this.hasHost);

      // Allow takeover of a disconnected player slot regardless of locked state
      const takenPlayer = this.lobby.players.find(
        (p) => p.nickname.toLowerCase() === msg.nickname.toLowerCase()
      );
      if (takenPlayer) {
        const isDisconnected = this.rejoinTimers.has(takenPlayer.nickname);
        if (isDisconnected) {
          const timer = this.rejoinTimers.get(takenPlayer.nickname);
          if (timer !== undefined) { clearTimeout(timer); this.rejoinTimers.delete(takenPlayer.nickname); }
          takenPlayer.id = sender.id;
          sender.send(JSON.stringify({ type: "connected", roomId: this.room.id, isHost: takenPlayer.isHost }));
          this.broadcastLobby();
          if (this.game.phase !== "lobby") {
            sender.send(JSON.stringify({ type: "game", game: this.game }));
          }
        } else {
          sender.send(JSON.stringify({ type: "nickname_taken" }));
        }
        return;
      }

      if (this.lobby.locked) return;
      const existing = this.lobby.players.find((p) => p.id === sender.id);
      if (existing) return;

      const joiningAsHost = msg.isHost === true;

      // Reject non-host joins to rooms that have no host yet
      if (!joiningAsHost && !this.hasHost) {
        sender.send(JSON.stringify({ type: "room_not_found" }));
        return;
      }

      // Validate host token before granting host privileges
      if (joiningAsHost) {
        const tokenValid = await this.validateHostToken(msg.hostToken);
        if (!tokenValid) {
          sender.send(JSON.stringify({ type: "unauthorized" }));
          return;
        }
      }

      const isFirst = this.lobby.players.length === 0;
      const playerIsHost = joiningAsHost || isFirst;
      this.lobby.players.push({
        id: sender.id,
        nickname: msg.nickname.trim(),
        isHost: playerIsHost,
      });
      if (playerIsHost) {
        this.hasHost = true;
        this.hostName = msg.nickname.trim();
      }
      this.lobby.N = this.lobby.players.length;
      this.broadcastLobby();

      const player = this.lobby.players.find((p) => p.id === sender.id);
      if (player) {
        sender.send(
          JSON.stringify({
            type: "connected",
            roomId: this.room.id,
            isHost: player.isHost,
          })
        );
      }
      return;
    }

    if (msg.type === "rejoin") {
      console.log("[server] rejoin from", sender.id, "nickname:", msg.nickname, "players:", this.lobby.players.map(p => p.nickname));
      const player = this.lobby.players.find((p) => p.nickname === msg.nickname);
      if (player) {
        // Validate token when the host rejoins
        if (player.isHost) {
          const tokenValid = await this.validateHostToken(msg.hostToken);
          if (!tokenValid) {
            sender.send(JSON.stringify({ type: "unauthorized" }));
            return;
          }
        }
        // If the previous connection is still open, this is a duplicate tab
        if (player.id !== sender.id) {
          const existingConn = this.room.getConnection(player.id);
          if (existingConn) {
            sender.send(JSON.stringify({ type: "duplicate_tab" }));
            return;
          }
        }
        player.id = sender.id;
        if (player.isHost) this.hasHost = true;
        // Cancel any pending kick timer for this player
        const timer = this.rejoinTimers.get(msg.nickname);
        if (timer !== undefined) {
          clearTimeout(timer);
          this.rejoinTimers.delete(msg.nickname);
        }
        sender.send(
          JSON.stringify({
            type: "connected",
            roomId: this.room.id,
            isHost: player.isHost,
          })
        );
        this.broadcastLobby();
        if (this.game.phase !== "lobby") {
          sender.send(JSON.stringify({ type: "game", game: this.game }));
        }
      } else {
        // No matching player — room doesn't exist or server restarted
        sender.send(JSON.stringify({ type: "room_not_found" }));
      }
      return;
    }

    if (msg.type === "lock") {
      const player = this.lobby.players.find((p) => p.id === sender.id);
      if (!player?.isHost) return;
      this.lobby.locked = true;
      this.broadcastLobby();
      return;
    }

    if (msg.type === "set_emoji") {
      const player = this.lobby.players.find((p) => p.id === sender.id);
      if (!player || player.isHost) return;
      player.emoji = msg.emoji;
      this.broadcastLobby();
      // Also refresh leaderboard emoji in game state so TV game page reflects the change
      if (this.game.phase !== "lobby" && this.game.leaderboard.length > 0) {
        const updated = this.game.leaderboard.map((s) =>
          s.nickname === player.nickname ? { ...s, emoji: player.emoji } : s
        );
        this.game = { ...this.game, leaderboard: updated };
        this.broadcastGame();
      }
      return;
    }

    // ---- Game messages ----
    if (msg.type === "start_game") {
      const player = this.lobby.players.find((p) => p.id === sender.id);
      if (!player?.isHost) return;
      if (this.game.phase !== "lobby") return;

      const playerCount = this.lobby.players.filter((p) => !p.isHost).length;
      const totalRounds = Math.min(msg.numQuestions, PROMPTS.length);
      const phase1Duration = Math.max(10, Math.min(60, msg.phase1Time));
      const phase2Duration = Math.max(10, Math.min(60, msg.phase2Time));
      const mode = msg.mode ?? "game_questions";

      if (mode === "player_questions") {
        this.submittedQuestions = [];
        this.totalScores.clear();
        this.roundResults = [];
        this.gameStartedAt = Date.now();
        this.lobby.locked = true;
        this.game = {
          phase: "question_submission",
          round: 0,
          totalRounds,
          prompt: null,
          phaseEndsAt: null,
          phase1Duration,
          phase2Duration,
          roundResult: null,
          leaderboard: [],
          N: playerCount,
          phase1AnsweredCount: 0,
          phase1AnsweredNicknames: [],
          answeredCount: 0,
          answeredNicknames: [],
          doubleDownUsed: [],
          paused: false,
          pausedTimeRemaining: null,
          submittedQuestionCount: 0,
          mode: "player_questions",
        };
        this.broadcastGame();
        return;
      }

      this.prompts = getPromptsForGame(totalRounds);
      this.totalScores.clear();
      this.roundResults = [];
      this.gameStartedAt = Date.now();

      this.lobby.players
        .filter((p) => !p.isHost)
        .forEach((p) => this.totalScores.set(p.nickname, 0));

      this.game = {
        phase: "countdown",
        round: 1,
        totalRounds,
        prompt: null,
        phaseEndsAt: null,
        phase1Duration,
        phase2Duration,
        roundResult: null,
        leaderboard: [],
        N: playerCount,
        phase1AnsweredCount: 0,
        phase1AnsweredNicknames: [],
        answeredCount: 0,
        answeredNicknames: [],
        doubleDownUsed: [],
        paused: false,
        pausedTimeRemaining: null,
        submittedQuestionCount: 0,
        mode: "game_questions",
      };
      this.broadcastGame();

      this.clearTimer();
      this.phaseTimer = setTimeout(() => this.startPhase1(), 13600);
      return;
    }

    if (msg.type === "submit_question") {
      if (this.game.phase !== "question_submission") return;
      if (this.submittedQuestions.length >= this.game.totalRounds) return;
      const senderPlayer = this.lobby.players.find((p) => p.id === sender.id);
      if (!senderPlayer) return;
      const nickname = senderPlayer.isHost ? "Host" : senderPlayer.nickname;

      // Validate
      const text = msg.text?.trim() ?? "";
      if (!text || text.length > 60) return;
      const validTypes = ["binary", "multiple_choice", "scale"] as const;
      if (!validTypes.includes(msg.questionType)) return;
      if (msg.questionType === "multiple_choice") {
        if (!Array.isArray(msg.options) || msg.options.length < 2 || msg.options.length > 4) return;
        if (msg.options.some((o) => !o || !String(o).trim())) return;
      }

      const id = "pq_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
      const prompt: Prompt = {
        id,
        text,
        type: msg.questionType,
        ...(msg.questionType === "multiple_choice" ? { options: msg.options!.map((o) => String(o).trim()) } : {}),
        ...(msg.questionType === "scale" && msg.labelLow ? { labelLow: msg.labelLow } : {}),
        ...(msg.questionType === "scale" && msg.labelHigh ? { labelHigh: msg.labelHigh } : {}),
      };

      this.submittedQuestions.push({ ...prompt, submittedBy: nickname });
      this.game = { ...this.game, submittedQuestionCount: this.submittedQuestions.length };
      this.broadcastGame();

      // Send privately to host
      const hostPlayer = this.lobby.players.find((p) => p.isHost);
      if (hostPlayer) {
        const hostConn = this.room.getConnection(hostPlayer.id);
        if (hostConn) {
          hostConn.send(JSON.stringify({
            type: "question_received",
            question: { ...prompt, submittedBy: nickname },
          }));
        }
      }
      return;
    }

    if (msg.type === "delete_question") {
      const player = this.lobby.players.find((p) => p.id === sender.id);
      if (!player?.isHost) return;
      if (this.game.phase !== "question_submission") return;
      this.submittedQuestions = this.submittedQuestions.filter((q) => q.id !== msg.id);
      this.game = { ...this.game, submittedQuestionCount: this.submittedQuestions.length };
      this.broadcastGame();
      return;
    }

    if (msg.type === "begin_game") {
      const player = this.lobby.players.find((p) => p.id === sender.id);
      if (!player?.isHost) return;
      if (this.game.phase !== "question_submission") return;
      if (this.submittedQuestions.length < this.game.totalRounds) return;

      this.prompts = shuffleArray(this.submittedQuestions).slice(0, this.game.totalRounds);
      this.totalScores.clear();
      this.lobby.players
        .filter((p) => !p.isHost)
        .forEach((p) => this.totalScores.set(p.nickname, 0));

      this.game = {
        ...this.game,
        phase: "countdown",
        round: 1,
        phase1AnsweredCount: 0,
        phase1AnsweredNicknames: [],
        answeredCount: 0,
        answeredNicknames: [],
        doubleDownUsed: [],
        paused: false,
        pausedTimeRemaining: null,
      };
      this.broadcastGame();

      this.clearTimer();
      this.phaseTimer = setTimeout(() => this.startPhase1(), 13600);
      return;
    }

    if (msg.type === "submit_answer") {
      if (this.game.phase !== "phase1") return;
      const nickname = this.getNickname(sender.id);
      if (!nickname) return;
      if (this.phase1Answers.has(nickname)) return; // already answered

      this.phase1Answers.set(nickname, msg.answer);
      this.game = {
        ...this.game,
        answeredCount: this.game.answeredCount + 1,
        answeredNicknames: [...this.game.answeredNicknames, nickname],
      };
      this.broadcastGame(); // so TV can update count

      if (this.checkAllAnswered("phase1")) {
        this.clearTimer();
        this.startPhase2();
      }
      return;
    }

    if (msg.type === "submit_prediction") {
      if (this.game.phase !== "phase2") return;
      const nickname = this.getNickname(sender.id);
      if (!nickname) return;
      if (this.phase2Predictions.has(nickname)) return;
      // Must have answered phase1 to participate in phase2
      if (!this.phase1Answers.has(nickname)) return;

      // Ignore double down if player already used it this game
      const doubleDown = msg.doubleDown && !this.game.doubleDownUsed.includes(nickname);
      this.phase2Predictions.set(nickname, msg.prediction);
      this.phase2Wagers.set(nickname, doubleDown);
      this.game = {
        ...this.game,
        answeredCount: this.game.answeredCount + 1,
        answeredNicknames: [...this.game.answeredNicknames, nickname],
        doubleDownUsed: doubleDown ? [...this.game.doubleDownUsed, nickname] : this.game.doubleDownUsed,
      };
      this.broadcastGame();

      if (this.checkAllAnswered("phase2")) {
        this.clearTimer();
        this.startPhase3();
      }
      return;
    }

    if (msg.type === "next_round") {
      const player = this.lobby.players.find((p) => p.id === sender.id);
      if (!player?.isHost) return;
      if (this.game.phase === "phase1") {
        this.clearTimer();
        this.startPhase2();
        return;
      }
      if (this.game.phase === "phase2") {
        this.clearTimer();
        this.startPhase3();
        return;
      }
      if (this.game.phase === "phase3") {
        this.startLeaderboard();
        return;
      }
      if (this.game.phase !== "leaderboard") return;
      this.clearTimer();
      this.advanceToNextRound();
      return;
    }

    if (msg.type === "end_game") {
      const player = this.lobby.players.find((p) => p.id === sender.id);
      if (!player?.isHost) return;
      this.endGame();
      return;
    }

    if (msg.type === "disband_room") {
      const player = this.lobby.players.find((p) => p.id === sender.id);
      if (!player?.isHost) return;
      this.hasHost = false;
      this.clearTimer();
      this.submittedQuestions = [];
      // Reset state so room appears gone
      this.lobby = { players: [], locked: false, N: 0, disconnectedNicknames: [] };
      this.game = {
        phase: "lobby", round: 0, totalRounds: 10,
        prompt: null, phaseEndsAt: null, phase1Duration: 25, phase2Duration: 20,
        roundResult: null, leaderboard: [], N: 0, phase1AnsweredCount: 0, phase1AnsweredNicknames: [], answeredCount: 0, answeredNicknames: [], doubleDownUsed: [], paused: false, pausedTimeRemaining: null,
        submittedQuestionCount: 0, mode: "game_questions",
      };
      this.room.broadcast(JSON.stringify({ type: "disbanded" }));
      return;
    }

    if (msg.type === "play_again") {
      const player = this.lobby.players.find((p) => p.id === sender.id);
      if (!player?.isHost) return;
      if (this.game.phase !== "ended") return;

      const playerCount = this.lobby.players.filter((p) => !p.isHost).length;
      const totalRounds = Math.min(msg.numQuestions, PROMPTS.length);
      const phase1Duration = Math.max(10, Math.min(60, msg.phase1Time));
      const phase2Duration = Math.max(10, Math.min(60, msg.phase2Time));
      this.prompts = getPromptsForGame(totalRounds);
      this.totalScores.clear();
      this.roundResults = [];
      this.gameStartedAt = Date.now();
      this.lobby.players
        .filter((p) => !p.isHost)
        .forEach((p) => this.totalScores.set(p.nickname, 0));

      this.game = {
        phase: "lobby",
        round: 1,
        totalRounds,
        prompt: null,
        phaseEndsAt: null,
        phase1Duration,
        phase2Duration,
        roundResult: null,
        leaderboard: [],
        N: playerCount,
        phase1AnsweredCount: 0,
        phase1AnsweredNicknames: [],
        answeredCount: 0,
        answeredNicknames: [],
        doubleDownUsed: [],
        paused: false,
        pausedTimeRemaining: null,
        submittedQuestionCount: 0,
        mode: "game_questions",
      };
      this.startPhase1();
      return;
    }

    if (msg.type === "reset_to_lobby") {
      const player = this.lobby.players.find((p) => p.id === sender.id);
      if (!player?.isHost) return;
      this.clearTimer();
      this.submittedQuestions = [];
      this.lobby.locked = false;
      this.lobby.N = this.lobby.players.length;
      this.game = {
        phase: "lobby", round: 0, totalRounds: 10,
        prompt: null, phaseEndsAt: null, phase1Duration: 25, phase2Duration: 20,
        roundResult: null, leaderboard: [], N: 0, phase1AnsweredCount: 0, phase1AnsweredNicknames: [], answeredCount: 0, answeredNicknames: [], doubleDownUsed: [], paused: false, pausedTimeRemaining: null,
        submittedQuestionCount: 0, mode: "game_questions",
      };
      this.broadcastLobby();
      this.room.broadcast(JSON.stringify({ type: "game", game: this.game }));
      return;
    }

    if (msg.type === "kick_player") {
      const player = this.lobby.players.find((p) => p.id === sender.id);
      if (!player?.isHost) return;
      // Notify the kicked player before removing
      const kickedPlayer = this.lobby.players.find((p) => p.nickname === msg.nickname);
      if (kickedPlayer) {
        const kickedConn = this.room.getConnection(kickedPlayer.id);
        kickedConn?.send(JSON.stringify({ type: "kicked" }));
        // Cancel any pending rejoin timer
        const timer = this.rejoinTimers.get(msg.nickname);
        if (timer !== undefined) { clearTimeout(timer); this.rejoinTimers.delete(msg.nickname); }
      }
      this.lobby.players = this.lobby.players.filter((p) => p.nickname !== msg.nickname);
      this.lobby.N = this.lobby.players.filter((p) => !p.isHost).length;
      if (this.game.phase !== "lobby") {
        // Update leaderboard to remove kicked player
        this.game = {
          ...this.game,
          leaderboard: this.game.leaderboard.filter((s) => s.nickname !== msg.nickname),
          N: this.lobby.N,
        };
        let rank = 1;
        this.game.leaderboard.forEach((s, i) => {
          if (i > 0 && s.total < this.game.leaderboard[i - 1].total) rank = i + 1;
          s.rank = rank;
        });
      }
      this.broadcastLobby();
      // If a phase is active, re-check whether all remaining players have answered
      if (this.game.phase === "phase1" && this.checkAllAnswered("phase1")) {
        this.clearTimer();
        this.startPhase2();
      } else if (this.game.phase === "phase2" && this.checkAllAnswered("phase2")) {
        this.clearTimer();
        this.startPhase3();
      }
      return;
    }

    if (msg.type === "leave") {
      const player = this.lobby.players.find((p) => p.id === sender.id);
      if (!player || player.isHost) return;
      // Cancel any pending rejoin timer and remove immediately
      const timer = this.rejoinTimers.get(player.nickname);
      if (timer !== undefined) { clearTimeout(timer); this.rejoinTimers.delete(player.nickname); }
      this.lobby.players = this.lobby.players.filter((p) => p.id !== sender.id);
      this.lobby.N = this.lobby.players.filter((p) => !p.isHost).length;
      this.broadcastLobby();
      return;
    }

    if (msg.type === "pause_timer") {
      const player = this.lobby.players.find((p) => p.id === sender.id);
      if (!player?.isHost) return;
      if (this.game.phase !== "phase1" && this.game.phase !== "phase2") return;
      if (this.game.paused) return;
      const remaining = this.game.phaseEndsAt ? Math.max(0, this.game.phaseEndsAt - Date.now()) : 0;
      this.clearTimer();
      this.game = { ...this.game, paused: true, pausedTimeRemaining: remaining, phaseEndsAt: null };
      this.broadcastGame();
      return;
    }

    if (msg.type === "resume_timer") {
      const player = this.lobby.players.find((p) => p.id === sender.id);
      if (!player?.isHost) return;
      if (!this.game.paused) return;
      const remaining = this.game.pausedTimeRemaining ?? 0;
      const phaseEndsAt = Date.now() + remaining;
      const phase = this.game.phase;
      this.game = { ...this.game, paused: false, pausedTimeRemaining: null, phaseEndsAt };
      this.broadcastGame();
      this.phaseTimer = setTimeout(
        () => phase === "phase1" ? this.startPhase2() : this.startPhase3(),
        remaining
      );
      return;
    }

    if (msg.type === "skip_question") {
      const player = this.lobby.players.find((p) => p.id === sender.id);
      if (!player?.isHost) return;
      if (this.game.phase !== "phase1" && this.game.phase !== "phase2") return;
      this.clearTimer();
      const isLastRound = this.game.round >= this.game.totalRounds;
      if (isLastRound) {
        this.endGame();
      } else {
        this.advanceToNextRound();
      }
      return;
    }
  }

  async onRequest(req: Party.Request) {
    if (req.method === "GET") {
      const inProgress = this.hasHost && this.lobby.locked;
      const playerNicknames = this.lobby.players.filter((p) => !p.isHost).map((p) => p.nickname);
      return new Response(JSON.stringify({
        exists: this.hasHost,
        hostActive: this.hasHost && !this.rejoinTimers.has(this.hostName),
        inProgress,
        playerNicknames,
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response("Method not allowed", { status: 405 });
  }

  onClose(conn: Party.Connection) {
    const player = this.lobby.players.find((p) => p.id === conn.id);
    if (!player) return;
    const nickname = player.nickname;

    // Grace period: wait 2 minutes before removing the player
    // This handles screen dim, brief disconnects, page refreshes
    const timer = setTimeout(() => {
      this.rejoinTimers.delete(nickname);
      if (player.isHost) {
        // Host timed out — disband the room and free the room code in Supabase
        this.hasHost = false;
        this.clearTimer();
        this.submittedQuestions = [];
        this.lobby = { players: [], locked: false, N: 0, disconnectedNicknames: [] };
        this.game = {
          phase: "lobby", round: 0, totalRounds: 10,
          prompt: null, phaseEndsAt: null, phase1Duration: 25, phase2Duration: 20,
          roundResult: null, leaderboard: [], N: 0, phase1AnsweredCount: 0, phase1AnsweredNicknames: [], answeredCount: 0, answeredNicknames: [], doubleDownUsed: [], paused: false, pausedTimeRemaining: null,
          submittedQuestionCount: 0, mode: "game_questions",
        };
        this.room.broadcast(JSON.stringify({ type: "disbanded" }));
        this.deactivateRoom().catch((e) => console.error("[supabase] deactivate failed:", e));
      } else {
        this.lobby.players = this.lobby.players.filter((p) => p.nickname !== nickname);
        this.lobby.N = this.lobby.players.filter((p) => !p.isHost).length;
        this.broadcastLobby();
      }
    }, 10 * 60 * 1000);

    // Cancel any existing timer for this nickname
    const existing = this.rejoinTimers.get(nickname);
    if (existing !== undefined) clearTimeout(existing);
    this.rejoinTimers.set(nickname, timer);

    // Broadcast immediately so host sees the grey dot right away
    this.broadcastLobby();
  }
}
