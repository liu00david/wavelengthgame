import type * as Party from "partykit/server";

type Player = { id: string; nickname: string; isHost: boolean };
type LobbyState = { players: Player[]; locked: boolean; N: number };

type PromptType = "binary" | "multiple_choice" | "scale";
type Prompt = {
  id: string;
  text: string;
  type: PromptType;
  options?: string[];
};

type GamePhase = "lobby" | "phase1" | "phase2" | "phase3" | "leaderboard" | "ended";

type PlayerScore = {
  nickname: string;
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
  answeredCount: number;
  answeredNicknames: string[];
};

type ClientMessage =
  | { type: "join"; nickname: string; isHost?: boolean }
  | { type: "rejoin"; nickname: string }
  | { type: "lock" }
  | { type: "start_game"; numQuestions: number; phase1Time: number; phase2Time: number }
  | { type: "submit_answer"; answer: string | number }
  | { type: "submit_prediction"; prediction: string | number; doubleDown: boolean }
  | { type: "next_round" }
  | { type: "end_game" }
  | { type: "disband_room" }
  | { type: "play_again"; numQuestions: number; phase1Time: number; phase2Time: number }
  | { type: "reset_to_lobby" }
  | { type: "kick_player"; nickname: string }
  | { type: "skip_question" };

// Inline prompt bank (mirrors src/lib/prompts.ts)
const PROMPTS: Prompt[] = [
  { id: "b1", text: "Have you ever pulled an all-nighter for something non-work related?", type: "binary" },
  { id: "b2", text: "Do you think you could survive a week without your phone?", type: "binary" },
  { id: "b3", text: "Have you ever lied to get out of a social event?", type: "binary" },
  { id: "b4", text: "Do you believe in love at first sight?", type: "binary" },
  { id: "b5", text: "Have you ever eaten an entire pizza by yourself?", type: "binary" },
  { id: "mc1", text: "What's your go-to comfort food?", type: "multiple_choice", options: ["Pizza", "Ice Cream", "Ramen", "Tacos"] },
  { id: "mc2", text: "How do you prefer to spend a free Saturday?", type: "multiple_choice", options: ["Outdoors/Active", "Netflix binge", "Social hangout", "Doing nothing"] },
  { id: "mc3", text: "What's your sleep schedule like?", type: "multiple_choice", options: ["Early bird (before 10pm)", "Normal (10pm-midnight)", "Night owl (after midnight)", "It varies wildly"] },
  { id: "mc4", text: "Which superpower would you pick?", type: "multiple_choice", options: ["Flight", "Invisibility", "Mind reading", "Teleportation"] },
  { id: "mc5", text: "Pick your vibe this week:", type: "multiple_choice", options: ["Thriving", "Surviving", "Barely functioning", "On another planet"] },
  { id: "s1", text: "How messy is your room right now? (1 = spotless, 10 = disaster zone)", type: "scale" },
  { id: "s2", text: "How spicy do you like your food? (1 = no spice, 10 = maximum heat)", type: "scale" },
  { id: "s3", text: "How extroverted are you feeling today? (1 = hermit mode, 10 = social butterfly)", type: "scale" },
  { id: "s4", text: "Rate your current life satisfaction. (1 = rock bottom, 10 = thriving)", type: "scale" },
  { id: "s5", text: "How likely are you to cancel plans last minute? (1 = never, 10 = always)", type: "scale" },
];

function getPromptsForGame(n: number): Prompt[] {
  const shuffled = [...PROMPTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

function getRoundMultiplier(round: number): number {
  if (round <= 4) return 1;
  if (round <= 8) return 1.5;
  return 3;
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
    const winners = String(actual).split(",");
    if (!winners.includes(String(prediction))) return 0;
    // Points = 1125 - 500 * (votes_for_winner / N), min 0
    const votes = voteCounts?.get(String(prediction)) ?? 0;
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
    return winners.join(",");
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
  round: number,
): Record<string, number> {
  const multiplier = getRoundMultiplier(round);
  const voteCounts = prompt.type === "multiple_choice" ? computeVoteCounts(answers) : undefined;
  const scores: Record<string, number> = {};

  predictions.forEach((prediction, nickname) => {
    let base = calculateProximityScore(prediction, actual, N, prompt.type, voteCounts);
    const doubled = wagers.get(nickname) ?? false;

    if (doubled) {
      base = isHighlyAccurate(base) ? base * 2 : 0;
    }

    scores[nickname] = Math.round(base * multiplier);
  });

  return scores;
}


export default class GameServer implements Party.Server {
  private lobby: LobbyState = { players: [], locked: false, N: 0 };
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
    answeredCount: 0,
    answeredNicknames: [],
  };
  private prompts: Prompt[] = [];
  private phase1Answers: Map<string, string | number> = new Map();
  private phase2Predictions: Map<string, string | number> = new Map();
  private phase2Wagers: Map<string, boolean> = new Map();
  private phaseTimer: ReturnType<typeof setTimeout> | null = null;
  private totalScores: Map<string, number> = new Map();

  constructor(readonly room: Party.Room) {}

  private broadcastLobby() {
    // Filter out the host from the player list sent to clients
    const visibleLobby = {
      ...this.lobby,
      players: this.lobby.players.filter((p) => !p.isHost),
      N: this.lobby.players.filter((p) => !p.isHost).length,
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
    };
    this.broadcastGame();

    this.clearTimer();
    this.phaseTimer = setTimeout(() => this.startPhase2(), ms);
  }

  private startPhase2() {
    this.clearTimer();
    const ms = this.game.phase2Duration * 1000;
    const phaseEndsAt = Date.now() + ms;
    this.game = { ...this.game, phase: "phase2", phaseEndsAt, answeredCount: 0, answeredNicknames: [] };
    this.broadcastGame();
    this.phaseTimer = setTimeout(() => this.startPhase3(), ms);
  }

  private startPhase3() {
    this.clearTimer();
    const prompt = this.game.prompt!;
    const N = this.lobby.N;

    const actual = computeActualResult(prompt, this.phase1Answers);

    const scores = computeScores(
      prompt,
      this.phase1Answers,
      this.phase2Predictions,
      this.phase2Wagers,
      actual,
      N,
      this.game.round,
    );

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
  }

  private checkAllAnswered(phase: "phase1" | "phase2") {
    const players = this.lobby.players.filter((p) => !p.isHost);
    if (players.length === 0) return false;
    const map = phase === "phase1" ? this.phase1Answers : this.phase2Predictions;
    return players.every((p) => map.has(p.nickname));
  }

  onConnect(conn: Party.Connection) {
    console.log("[server] onConnect", conn.id, "room:", this.room.id, "hasHost:", this.hasHost, "players:", this.lobby.players.length);
    conn.send(JSON.stringify({ type: "state", lobby: this.lobby }));
    if (this.game.phase !== "lobby") {
      conn.send(JSON.stringify({ type: "game", game: this.game }));
    }
  }

  onMessage(message: string, sender: Party.Connection) {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(message) as ClientMessage;
    } catch {
      return;
    }

    // ---- Lobby messages ----
    if (msg.type === "join") {
      console.log("[server] join from", sender.id, "nickname:", msg.nickname, "isHost:", msg.isHost, "locked:", this.lobby.locked, "hasHost:", this.hasHost);
      if (this.lobby.locked) return;
      const existing = this.lobby.players.find((p) => p.id === sender.id);
      if (existing) return;

      const joiningAsHost = msg.isHost === true;

      // Reject non-host joins to rooms that have no host yet
      if (!joiningAsHost && !this.hasHost) {
        sender.send(JSON.stringify({ type: "room_not_found" }));
        return;
      }

      // Reject duplicate nicknames (case-insensitive)
      const takenPlayer = this.lobby.players.find(
        (p) => p.nickname.toLowerCase() === msg.nickname.toLowerCase()
      );
      if (takenPlayer) {
        sender.send(JSON.stringify({ type: "nickname_taken" }));
        return;
      }

      const isFirst = this.lobby.players.length === 0;
      const playerIsHost = joiningAsHost || isFirst;
      this.lobby.players.push({
        id: sender.id,
        nickname: msg.nickname,
        isHost: playerIsHost,
      });
      if (playerIsHost) this.hasHost = true;
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

    // ---- Game messages ----
    if (msg.type === "start_game") {
      const player = this.lobby.players.find((p) => p.id === sender.id);
      if (!player?.isHost) return;
      if (this.game.phase !== "lobby") return;

      const playerCount = this.lobby.players.filter((p) => !p.isHost).length;
      const totalRounds = Math.min(msg.numQuestions, PROMPTS.length);
      const phase1Duration = Math.max(10, Math.min(60, msg.phase1Time));
      const phase2Duration = Math.max(10, Math.min(60, msg.phase2Time));
      this.prompts = getPromptsForGame(totalRounds);
      this.totalScores.clear();

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
        answeredCount: 0,
        answeredNicknames: [],
      };

      this.startPhase1();
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

      this.phase2Predictions.set(nickname, msg.prediction);
      this.phase2Wagers.set(nickname, msg.doubleDown);
      this.game = {
        ...this.game,
        answeredCount: this.game.answeredCount + 1,
        answeredNicknames: [...this.game.answeredNicknames, nickname],
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
      // Reset state so room appears gone
      this.lobby = { players: [], locked: false, N: 0 };
      this.game = {
        phase: "lobby", round: 0, totalRounds: 10,
        prompt: null, phaseEndsAt: null, phase1Duration: 25, phase2Duration: 20,
        roundResult: null, leaderboard: [], N: 0, answeredCount: 0, answeredNicknames: [],
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
        answeredCount: 0,
        answeredNicknames: [],
      };
      this.startPhase1();
      return;
    }

    if (msg.type === "reset_to_lobby") {
      const player = this.lobby.players.find((p) => p.id === sender.id);
      if (!player?.isHost) return;
      this.clearTimer();
      this.lobby.locked = false;
      this.lobby.N = this.lobby.players.length;
      this.game = {
        phase: "lobby", round: 0, totalRounds: 10,
        prompt: null, phaseEndsAt: null, phase1Duration: 25, phase2Duration: 20,
        roundResult: null, leaderboard: [], N: 0, answeredCount: 0, answeredNicknames: [],
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
        this.game.leaderboard.forEach((s, i) => { s.rank = i + 1; });
      }
      this.broadcastLobby();
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
      return new Response(JSON.stringify({ exists: this.hasHost }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response("Method not allowed", { status: 405 });
  }

  onClose(conn: Party.Connection) {
    if (this.lobby.locked) {
      return;
    }
    this.lobby.players = this.lobby.players.filter((p) => p.id !== conn.id);
    this.lobby.N = this.lobby.players.length;
    this.broadcastLobby();
  }
}
