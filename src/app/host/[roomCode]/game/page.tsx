"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useParty } from "@/lib/useParty";
import { t, avatarColor, resolveAvatarColor, resolveEmoji } from "@/lib/theme";
import type { RoundResult } from "@/lib/types";

function useCountdown(phaseEndsAt: number | null): number {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!phaseEndsAt) { setSecs(0); return; }
    const tick = () => setSecs(Math.max(0, (phaseEndsAt - Date.now()) / 1000));
    tick();
    const id = setInterval(tick, 50);
    return () => clearInterval(id);
  }, [phaseEndsAt]);
  return secs;
}

function CountdownScreen() {
  const [step, setStep] = useState<"tagline_in" | "tagline_out" | "3" | "2" | "1">("tagline_in");

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep("tagline_out"), 1800),
      setTimeout(() => setStep("3"), 2600),
      setTimeout(() => setStep("2"), 3600),
      setTimeout(() => setStep("1"), 4600),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const isTagline = step === "tagline_in" || step === "tagline_out";
  const digit = step === "3" ? "3" : step === "2" ? "2" : step === "1" ? "1" : null;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${t.bgPage}`}>
      {isTagline && (
        <div
          className="flex flex-col items-center gap-4 transition-all duration-500"
          style={{
            opacity: step === "tagline_in" ? 1 : 0,
            transform: step === "tagline_in" ? "scale(1) translateY(0)" : "scale(0.9) translateY(-20px)",
          }}
        >
          <span className="text-7xl">🎯</span>
          <p className="text-4xl font-black text-white text-center leading-tight">
            Ready to read<br />the room?
          </p>
        </div>
      )}
      {digit && (
        <div key={digit} style={{ animation: "cdPop 0.9s ease-out forwards" }}>
          <span
            className="font-black leading-none"
            style={{
              fontSize: "16rem",
              color: digit === "3" ? "#7862FF" : digit === "2" ? "#4dd9d2" : "#f6dc53",
            }}
          >
            {digit}
          </span>
        </div>
      )}
      <style>{`
        @keyframes cdPop {
          0%   { transform: scale(1.5); opacity: 0; }
          20%  { transform: scale(1.0); opacity: 1; }
          70%  { transform: scale(1.0); opacity: 1; }
          100% { transform: scale(0.7); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

type MenuState = "closed" | "main" | "kick" | "end_confirm" | "disband_confirm";

const HOST_SESSION_KEY = "consensus_host_session";
const DEFAULT_NUM_QUESTIONS = 10;
const DEFAULT_PHASE1_TIME = 30;
const DEFAULT_PHASE2_TIME = 45;

export default function HostGamePage() {
  const params = useParams();
  const roomCode = (params.roomCode as string).toUpperCase();
  const router = useRouter();
  const startedRef = useRef(false);

  // Settings carried from lobby via sessionStorage
  const [numQuestions] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_NUM_QUESTIONS;
    return parseInt(sessionStorage.getItem(`${roomCode}_numQ`) ?? "") || DEFAULT_NUM_QUESTIONS;
  });
  const [phase1Time] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_PHASE1_TIME;
    return parseInt(sessionStorage.getItem(`${roomCode}_p1t`) ?? "") || DEFAULT_PHASE1_TIME;
  });
  const [phase2Time] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_PHASE2_TIME;
    return parseInt(sessionStorage.getItem(`${roomCode}_p2t`) ?? "") || DEFAULT_PHASE2_TIME;
  });

  const roundHistoryRef = useRef<RoundResult[]>([]);
  const seenRoundsRef = useRef<Set<number>>(new Set());

  const { sendMsg, lobbyState, gameState } = useParty(
    roomCode,
    () => {
      // Always rejoin first — server will restore our connection and send current game state
      sendMsg({ type: "rejoin", nickname: "Host" });
      // Only start the game if this session hasn't started it yet (not a page refresh)
      const startedKey = `${roomCode}_started`;
      const alreadyStarted = sessionStorage.getItem(startedKey) === "1";
      if (!startedRef.current && !alreadyStarted) {
        startedRef.current = true;
        sessionStorage.setItem(startedKey, "1");
        sendMsg({ type: "start_game", numQuestions, phase1Time, phase2Time });
      }
    },
  );

  // Accumulate round results as they come in (phase3 has roundResult)
  useEffect(() => {
    if (gameState?.phase === "ended") {
      sessionStorage.setItem(`${roomCode}_summary`, JSON.stringify({
        rounds: roundHistoryRef.current,
        leaderboard: gameState.leaderboard,
      }));
      return;
    }
    if (!gameState?.roundResult) return;
    const round = gameState.round;
    if (!seenRoundsRef.current.has(round)) {
      seenRoundsRef.current.add(round);
      roundHistoryRef.current = [...roundHistoryRef.current, gameState.roundResult];
    }
  }, [gameState?.phase, gameState?.round, gameState?.roundResult, roomCode]);

  const countdown = useCountdown(gameState?.phaseEndsAt ?? null);

  const phase = gameState?.phase ?? "lobby";
  const prompt = gameState?.prompt;
  const players = lobbyState?.players ?? [];
  const nonHostPlayers = players.filter((p) => !p.isHost);
  const N = nonHostPlayers.length;

  const [menuState, setMenuState] = useState<MenuState>("closed");

  function closeMenu() { setMenuState("closed"); }

  function handleSkipQuestion() {
    sendMsg({ type: "skip_question" });
    closeMenu();
  }

  function handleKickPlayer(nickname: string) {
    sendMsg({ type: "kick_player", nickname });
    closeMenu();
  }

  function handleEndGame() {
    sendMsg({ type: "end_game" });
    closeMenu();
  }

  function handleDisbandRoom() {
    sessionStorage.removeItem(`${roomCode}_started`);
    sendMsg({ type: "disband_room" });
    localStorage.removeItem(HOST_SESSION_KEY);
    router.push("/");
  }

  function handlePlayAgain() {
    sessionStorage.removeItem(`${roomCode}_started`);
    sendMsg({ type: "reset_to_lobby" });
    router.push(`/host/${roomCode}`);
  }

  const phaseLabel: Record<string, string> = {
    lobby: "Lobby",
    countdown: "Starting...",
    phase1: "Phase 1 — Answer",
    phase2: "Phase 2 — Predict",
    phase3: "Phase 3 — Reveal",
    leaderboard: "Leaderboard",
    ended: "Game Over",
  };

  const canSkip = phase === "phase1" || phase === "phase2";
  const answeredCount = gameState?.answeredCount ?? 0;

  // Timer bar: smooth, red under 5s
  const totalSecs = phase === "phase1" ? (gameState?.phase1Duration ?? 25) : (gameState?.phase2Duration ?? 20);
  const timerPct = gameState?.phaseEndsAt ? Math.min(100, Math.max(0, (countdown / totalSecs) * 100)) : 0;
  const timerUrgent = countdown <= 5 && countdown > 0;

  return (
    <main className={`min-h-screen ${t.bgPage} text-white px-6 py-8`}>
      {phase === "countdown" && <CountdownScreen />}
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className={`${t.textMuted} text-xs uppercase tracking-widest`}>Host Dashboard</p>
            <h1 className={`text-3xl font-black ${t.textYellow} font-mono`}>{roomCode}</h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`/tv/${roomCode}/game`}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-4 py-2 rounded-xl ${t.btnPrimary} font-semibold`}
            >
              TV Screen ↗
            </a>
            <button
              onClick={() => setMenuState("main")}
              className={`px-3 py-2 rounded-xl ${t.btnGhost} font-bold text-xl leading-none`}
              aria-label="Open menu"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Phase status */}
        <div className={`${t.bgSurface} rounded-2xl border ${t.borderSurface} p-6 mb-4`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`${t.textYellow} font-bold text-lg`}>{phaseLabel[phase]}</span>
            {gameState && (
              <span className={`${t.textMuted} text-lg`}>
                Round {gameState.round} / {gameState.totalRounds}
              </span>
            )}
          </div>

          {prompt && (
            <div className="mb-4">
              <p className={`${t.textMuted} text-base uppercase tracking-widest mb-1`}>
                {prompt.type.replace("_", " ")}
              </p>
              <p className="text-white text-lg font-semibold leading-snug">{prompt.text}</p>
            </div>
          )}

          {/* Smooth timer bar */}
          {gameState?.phaseEndsAt && (phase === "phase1" || phase === "phase2") && (
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-[#1a3580] rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-none ${timerUrgent ? "bg-[#c94f7a]" : "bg-[#7862FF]"}`}
                  style={{ width: `${timerPct}%` }}
                />
              </div>
              <span className={`${timerUrgent ? "text-[#c94f7a]" : t.textYellow} font-mono font-bold text-lg w-10 text-right`}>
                {Math.ceil(countdown)}s
              </span>
            </div>
          )}
        </div>

        {/* Inline host controls during answering phases */}
        {(phase === "phase1" || phase === "phase2") && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => sendMsg({ type: "skip_question" })}
              className={`flex-1 py-4 rounded-xl ${t.btnGhost} font-semibold text-sm`}
            >
              Skip
            </button>
            <button
              onClick={() => gameState?.paused ? sendMsg({ type: "resume_timer" }) : sendMsg({ type: "pause_timer" })}
              className={`flex-1 py-4 rounded-xl font-semibold text-sm ${gameState?.paused ? "bg-[#f6dc53] text-[#081c48] hover:bg-[#e5cc3c]" : t.btnGhost}`}
            >
              {gameState?.paused ? "▶ Resume" : "⏸ Pause"}
            </button>
            <button
              onClick={() => sendMsg({ type: "next_round" })}
              className={`flex-1 py-4 rounded-xl ${t.btnPrimary} font-semibold text-sm`}
            >
              Continue
            </button>
          </div>
        )}

        {/* Answer counts */}
        {(phase === "phase1" || phase === "phase2") && gameState && (
          <div className={`${t.bgSurface} rounded-2xl border ${t.borderSurface} p-5 mb-4`}>
            <p className={`${t.textMuted} text-xs uppercase tracking-widest mb-3`}>
              {phase === "phase1" ? "Answers Submitted" : "Predictions Submitted"}
            </p>
            <div className="flex flex-wrap gap-2">
              {nonHostPlayers.map((p) => {
                const hasAnswered = (gameState.answeredNicknames ?? []).includes(p.nickname);
                const isEligible = phase === "phase1" || (gameState.phase1AnsweredNicknames ?? []).includes(p.nickname);
                const ineligible = phase === "phase2" && !isEligible;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                      ineligible
                        ? "bg-[#9a3558]/20 text-[#c94f7a] border border-[#9a3558]/30"
                        : hasAnswered
                        ? "bg-[#25a59f]/20 text-[#4dd9d2] border border-[#25a59f]/30"
                        : `${t.bgPage} ${t.textMuted}`
                    }`}
                  >
                    {p.nickname}
                    {ineligible && <span className="text-[#c94f7a]">✗</span>}
                    {!ineligible && hasAnswered && <span className="text-[#4dd9d2]">✓</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Leaderboard quick view */}
        {(phase === "leaderboard" || phase === "phase3" || phase === "ended") && (gameState?.leaderboard?.length ?? 0) > 0 && gameState && (
          <div className={`${t.bgSurface} rounded-2xl border ${t.borderSurface} p-5 mb-4`}>
            <p className={`${t.textMuted} text-xs uppercase tracking-widest mb-3`}>Leaderboard</p>
            <div className="flex flex-col gap-2">
              {gameState.leaderboard.slice(0, 5).map((s) => (
                <div key={s.nickname} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`${t.textFaint} text-sm w-5`}>#{s.rank}</span>
                    <div className={`${resolveAvatarColor(s.nickname, s.emoji)} w-7 h-7 rounded-full flex items-center justify-center text-base`}>
                      {resolveEmoji(s.nickname, s.emoji)}
                    </div>
                    <span className="text-white text-sm font-medium">{s.nickname}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.roundScore > 0 && (
                      <span className={`${t.textTeal} text-xs font-bold`}>+{s.roundScore}</span>
                    )}
                    <span className={`${t.textYellow} font-bold`}>{s.total}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Phase 3: go to leaderboard first */}
        {phase === "phase3" && (
          <button
            onClick={() => sendMsg({ type: "next_round" })}
            className={`w-full py-5 rounded-2xl ${t.btnYellow} text-2xl shadow-xl`}
          >
            Go to Round Results →
          </button>
        )}

        {/* Leaderboard: advance to next question */}
        {phase === "leaderboard" && (
          <button
            onClick={() => sendMsg({ type: "next_round" })}
            className={`w-full py-5 rounded-2xl ${t.btnYellow} text-2xl shadow-xl`}
          >
            Next Question →
          </button>
        )}

        {/* End state */}
        {phase === "ended" && (
          <div className={`${t.bgSurface} rounded-2xl border border-[#f6dc53]/30 p-6 text-center mb-4`}>
            <p className={`${t.textYellow} text-2xl font-black mb-2`}>CONSENSUS</p>
            <p className={t.textMuted}>Thanks for playing Consensus.</p>
          </div>
        )}

        {phase === "ended" && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push(`/host/${roomCode}/summary`)}
              className={`w-full py-5 rounded-2xl ${t.btnPrimary} text-xl font-black shadow-xl`}
            >
              View Game Summary →
            </button>
            <button
              onClick={handlePlayAgain}
              className={`w-full py-4 rounded-2xl ${t.btnYellow} text-xl shadow-xl`}
            >
              Play Again
            </button>
            <button
              onClick={() => setMenuState("disband_confirm")}
              className={`w-full py-3 rounded-2xl ${t.btnDanger} font-bold`}
            >
              Disband Room
            </button>
          </div>
        )}
        {/* Player connection status */}
        {nonHostPlayers.length > 0 && (
          <div className={`${t.bgSurface} rounded-2xl border ${t.borderSurface} p-4 mt-4`}>
            <p className={`${t.textMuted} text-xs uppercase tracking-widest mb-3`}>Players</p>
            <div className="flex flex-col gap-2">
              {nonHostPlayers.map((p) => {
                const isDisconnected = (lobbyState?.disconnectedNicknames ?? []).includes(p.nickname);
                const pts = gameState?.leaderboard?.find((s) => s.nickname === p.nickname)?.total ?? 0;
                return (
                  <div key={p.nickname} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isDisconnected ? "bg-gray-500" : "bg-green-400"}`} />
                    <span className={`text-sm flex-1 ${isDisconnected ? t.textMuted : "text-white"}`}>{p.nickname}</span>
                    <span className={`text-sm font-bold ${pts > 0 ? t.textYellow : t.textFaint}`}>{pts} pts</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Answered count badge */}
      {(phase === "phase1" || phase === "phase2") && gameState && (
        <div className={`fixed bottom-6 left-6 ${t.bgSurface}/80 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-semibold z-20 border ${t.borderSurface}`}>
          {answeredCount} / {phase === "phase2" ? (gameState.phase1AnsweredCount || N) : N} answered
        </div>
      )}

      {/* Menu overlay */}
      {menuState !== "closed" && (
        <div className="fixed inset-0 bg-black/60 z-30" onClick={closeMenu} />
      )}

      {/* Menu panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 ${t.bgSurface} border-l ${t.borderSurface} z-40 flex flex-col shadow-2xl transition-transform duration-300 ${
          menuState !== "closed" ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className={`flex items-center justify-between px-6 py-5 border-b ${t.borderSurface}`}>
          <h2 className="text-white font-black text-xl">Menu</h2>
          <button onClick={closeMenu} className={`${t.textMuted} hover:text-white text-2xl font-bold transition-colors`} aria-label="Close menu">
            ✕
          </button>
        </div>

        {menuState === "main" && (
          <div className="flex flex-col gap-3 p-6">
            <button
              onClick={() => setMenuState("kick")}
              disabled={nonHostPlayers.length === 0}
              className={`w-full py-4 rounded-xl ${t.btnGhost} font-bold text-base ${t.btnPrimaryDisabled}`}
            >
              Kick Player
            </button>
            <button
              onClick={() => setMenuState("end_confirm")}
              className={`w-full py-4 rounded-xl ${t.btnDanger} font-bold text-base`}
            >
              End Game
            </button>
            <button
              onClick={() => setMenuState("disband_confirm")}
              className={`w-full py-4 rounded-xl ${t.btnDanger} font-bold text-base`}
            >
              Disband Room
            </button>
          </div>
        )}

        {menuState === "kick" && (
          <div className="flex flex-col gap-3 p-6">
            <button onClick={() => setMenuState("main")} className={`flex items-center gap-2 ${t.textMuted} hover:text-white text-sm font-semibold mb-2 transition-colors`}>
              ← Back
            </button>
            <p className={`${t.textMuted} text-sm uppercase tracking-widest mb-2`}>Select player to kick</p>
            {nonHostPlayers.length === 0 && <p className={`${t.textFaint} text-sm`}>No players to kick.</p>}
            {nonHostPlayers.map((p) => (
              <button
                key={p.id}
                onClick={() => handleKickPlayer(p.nickname)}
                className={`w-full py-3 px-4 rounded-xl ${t.btnGhost} font-semibold text-sm hover:bg-[#9a3558]/20 hover:border-[#9a3558]/40 hover:text-[#c94f7a] active:scale-95 transition-all flex items-center gap-3`}
              >
                <div className={`${resolveAvatarColor(p.nickname, p.emoji)} w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0`}>
                  {resolveEmoji(p.nickname, p.emoji)}
                </div>
                {p.nickname}
              </button>
            ))}
          </div>
        )}

        {menuState === "end_confirm" && (
          <div className="flex flex-col gap-4 p-6">
            <button onClick={() => setMenuState("main")} className={`flex items-center gap-2 ${t.textMuted} hover:text-white text-sm font-semibold mb-2 transition-colors`}>
              ← Back
            </button>
            <div className="bg-[#f6dc53]/10 border border-[#f6dc53]/30 rounded-xl p-4">
              <p className={`${t.textYellow} font-bold text-lg mb-1`}>End the game?</p>
              <p className={`${t.textMuted} text-sm`}>This will immediately end the game for all players.</p>
            </div>
            <button onClick={handleEndGame} className={`w-full py-4 rounded-xl ${t.btnYellow} text-base`}>
              Yes, End Game
            </button>
            <button onClick={() => setMenuState("main")} className={`w-full py-3 rounded-xl ${t.btnGhost} font-semibold`}>
              Cancel
            </button>
          </div>
        )}

        {menuState === "disband_confirm" && (
          <div className="flex flex-col gap-4 p-6">
            <button onClick={() => setMenuState("main")} className={`flex items-center gap-2 ${t.textMuted} hover:text-white text-sm font-semibold mb-2 transition-colors`}>
              ← Back
            </button>
            <div className="bg-[#9a3558]/10 border border-[#9a3558]/30 rounded-xl p-4">
              <p className="text-[#c94f7a] font-bold text-lg mb-1">Disband room?</p>
              <p className={`${t.textMuted} text-sm`}>This permanently closes the room. All players will be disconnected.</p>
            </div>
            <button onClick={handleDisbandRoom} className="w-full py-4 rounded-xl bg-[#9a3558] text-white font-black text-base hover:bg-[#7e2b47] active:scale-95 transition-all">
              Yes, Disband
            </button>
            <button onClick={() => setMenuState("main")} className={`w-full py-3 rounded-xl ${t.btnGhost} font-semibold`}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
