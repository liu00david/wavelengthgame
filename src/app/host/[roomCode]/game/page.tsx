"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useParty } from "@/lib/useParty";
import { t, avatarColor, resolveAvatarColor, resolveEmoji } from "@/lib/theme";
import type { RoundResult } from "@/lib/types";

type CollectedQuestion = {
  id: string;
  text: string;
  type: string;
  options?: string[];
  labelLow?: string;
  labelHigh?: string;
  submittedBy: string;
};

type QuestionPayload = {
  text: string;
  questionType: "binary" | "multiple_choice" | "scale";
  options?: string[];
  labelLow?: string;
  labelHigh?: string;
};

function HostQuestionForm({ onSubmit }: { onSubmit: (q: QuestionPayload) => void }) {
  const [qType, setQType] = useState<"binary" | "multiple_choice" | "scale">("binary");
  const [text, setText] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [labelLow, setLabelLow] = useState("");
  const [labelHigh, setLabelHigh] = useState("");

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (qType === "multiple_choice" && (options.length < 2 || options.some((o) => !o.trim()))) return;

    const payload: QuestionPayload = { text: trimmed, questionType: qType };
    if (qType === "multiple_choice") payload.options = options.map((o) => o.trim());
    if (qType === "scale") {
      if (labelLow.trim()) payload.labelLow = labelLow.trim();
      if (labelHigh.trim()) payload.labelHigh = labelHigh.trim();
    }
    onSubmit(payload);
    setText("");
    setOptions(["", ""]);
    setLabelLow("");
    setLabelHigh("");
  }

  const typeDescriptions: Record<string, string> = {
    binary: "Players answer Yes or No",
    scale: "Players rate from 1 to 10",
    multiple_choice: "Players choose one of four options",
  };

  const trimmedOptions = options.map((o) => o.trim());
  const hasDuplicateMC = qType === "multiple_choice" && trimmedOptions.some((o, i) => o.length > 0 && trimmedOptions.indexOf(o) !== i);
  const isValid = text.trim().length > 0 && (qType !== "multiple_choice" || (options.length >= 2 && options.every((o) => o.trim().length > 0) && !hasDuplicateMC));

  return (
    <div className={`${t.bgPage} rounded-xl p-4 mb-2`}>
      <p className={`${t.textMuted} text-xs uppercase tracking-widest mb-3`}>Submit a Question</p>
      {/* Type selector */}
      <div className="flex gap-2 mb-3">
        {(["binary", "scale", "multiple_choice"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setQType(type)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              qType === type ? "bg-[#7862FF] text-white" : `${t.btnGhost} ${t.textMuted}`
            }`}
          >
            {type === "binary" ? "Yes/No" : type === "scale" ? "Scale" : "Multi Choice"}
          </button>
        ))}
      </div>
      <p className={`${t.textFaint} text-xs mb-2`}>{typeDescriptions[qType]}</p>

      {/* Question text */}
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={qType === "binary" ? "Have you drank soda today?" : qType === "scale" ? "How much do you like EDM?" : "What's your favorite pizza topping?"}
        maxLength={60}
        className={`w-full px-3 py-2 rounded-lg bg-[#0f2660] border border-[#2a4a8a] text-white text-sm placeholder:italic placeholder:${t.textFaint} outline-none focus:border-[#7862FF] mb-2`}
      />

      {/* Scale labels */}
      {qType === "scale" && (
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input
            type="text"
            value={labelLow}
            onChange={(e) => setLabelLow(e.target.value)}
            placeholder="Not at all"
            maxLength={10}
            className={`w-full px-3 py-2 rounded-lg bg-[#0f2660] border border-[#2a4a8a] text-white text-sm placeholder:italic placeholder:${t.textFaint} outline-none focus:border-[#7862FF]`}
          />
          <input
            type="text"
            value={labelHigh}
            onChange={(e) => setLabelHigh(e.target.value)}
            placeholder="My favorite"
            maxLength={10}
            className={`w-full px-3 py-2 rounded-lg bg-[#0f2660] border border-[#2a4a8a] text-white text-sm placeholder:italic placeholder:${t.textFaint} outline-none focus:border-[#7862FF]`}
          />
        </div>
      )}

      {/* MC options */}
      {qType === "multiple_choice" && (
        <div className="flex flex-col gap-1.5 mb-2">
          {options.map((opt, i) => {
            const mcPlaceholders = ["Pepperoni", "Green pepper", "Onion", "Pineapple"];
            const isDupe = opt.trim().length > 0 && trimmedOptions.indexOf(opt.trim()) !== i;
            return (
              <div key={i} className="flex items-center gap-2">
                <span className={`${t.textMuted} text-sm font-bold w-4 shrink-0`}>{String.fromCharCode(65 + i)}</span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const next = [...options];
                    next[i] = e.target.value;
                    setOptions(next);
                  }}
                  placeholder={mcPlaceholders[i]}
                  maxLength={25}
                  className={`flex-1 min-w-0 px-3 py-2 rounded-lg bg-[#0f2660] border text-white text-sm placeholder:italic placeholder:${t.textFaint} outline-none focus:border-[#7862FF] ${isDupe ? "border-[#c94f7a]" : "border-[#2a4a8a]"}`}
                />
              </div>
            );
          })}
          <div className="flex items-center justify-between mt-0.5">
            {options.length < 4 ? (
              <button onClick={() => setOptions([...options, ""])} className={`${t.textMuted} hover:text-white text-sm font-bold text-left`}>
                + Add choice {String.fromCharCode(65 + options.length)}
              </button>
            ) : <span />}
            {options.length > 2 && (
              <button onClick={() => setOptions(options.slice(0, -1))} className={`${t.textMuted} hover:${t.textRed} text-sm font-bold`}>
                − Remove {String.fromCharCode(65 + options.length - 1)}
              </button>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!isValid}
        className={`w-full py-2 rounded-lg ${t.btnYellow} text-sm font-bold disabled:opacity-40`}
      >
        Submit Question
      </button>
    </div>
  );
}

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

const RULES = [
  { icon: "💬", color: "#7862FF", label: "Phase 1", title: "Answer", body: "Answer the question honestly for yourself." },
  { icon: "🔮", color: "#4dd9d2", label: "Phase 2", title: "Predict", body: "Guess what the majority of the group answered." },
  { icon: "⚡", color: "#f6dc53", label: "Score", title: "Double Down", body: "Risk your token to double your points — one use per game!" },
];

function JumpWord({ word, color, delay = 0 }: { word: string; color: string; delay?: number }) {
  return (
    <span className="inline-flex gap-[0.05em]" aria-label={word}>
      {word.split("").map((ch, i) => (
        <span key={i} className="inline-block font-black" style={{
          color,
          animation: "wordJump 0.5s ease-out forwards",
          animationDelay: `${delay + i * 60}ms`,
          opacity: 0,
        }}>
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </span>
  );
}

function CountdownScreen() {
  const [step, setStep] = useState<"rules0" | "rules1" | "rules2" | "rules_out" | "tagline_in" | "tagline_out" | "ready">("rules0");

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep("rules1"),      4000),
      setTimeout(() => setStep("rules2"),      8000),
      setTimeout(() => setStep("rules_out"),   12000),
      setTimeout(() => setStep("tagline_in"),  12400),
      setTimeout(() => setStep("tagline_out"), 14200),
      setTimeout(() => setStep("ready"),       15000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const ruleIndex = step === "rules0" ? 0 : step === "rules1" ? 1 : step === "rules2" ? 2 : null;
  const isRules = ruleIndex !== null || step === "rules_out";
  const isTagline = step === "tagline_in" || step === "tagline_out";
  const isReady = step === "ready";
  const rule = ruleIndex !== null ? RULES[ruleIndex] : null;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${t.bgPage} overflow-hidden`}>
      <style>{`
        @keyframes cdPop {
          0%   { transform: scale(1.5); opacity: 0; }
          20%  { transform: scale(1.0); opacity: 1; }
          70%  { transform: scale(1.0); opacity: 1; }
          100% { transform: scale(0.7); opacity: 0; }
        }
        @keyframes ruleSlideIn {
          0%   { transform: translateY(30px) scale(0.96); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes wordJump {
          0%   { transform: translateY(20px) scale(0.8); opacity: 0; }
          60%  { transform: translateY(-6px) scale(1.15); opacity: 1; }
          80%  { transform: translateY(2px) scale(0.97); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>

      {/* Rules cards */}
      {isRules && rule && (
        <div key={ruleIndex} className="flex flex-col items-center gap-5 text-center px-8"
          style={{ animation: "ruleSlideIn 0.4s ease-out forwards" }}>
          <div className="flex gap-2">
            {RULES.map((_, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                style={{ background: i === ruleIndex ? rule.color : "#2a4a8a" }} />
            ))}
          </div>
          <div className="rounded-2xl px-8 py-8 flex flex-col items-center gap-4"
            style={{ background: `${rule.color}18`, border: `2px solid ${rule.color}44` }}>
            <span className="text-6xl">{rule.icon}</span>
            <p className="text-sm font-bold uppercase tracking-widest" style={{ color: rule.color }}>{rule.label}</p>
            <p className="text-4xl" style={{ lineHeight: 1.1 }}>
              <JumpWord key={`${ruleIndex}-title`} word={rule.title} color="white" delay={200} />
            </p>
            <p className="text-lg text-[#a8c0e8] max-w-xs leading-snug">{rule.body}</p>
          </div>
        </div>
      )}

      {/* Tagline */}
      {isTagline && (
        <div className="flex flex-col items-center gap-4 transition-all duration-500"
          style={{
            opacity: step === "tagline_in" ? 1 : 0,
            transform: step === "tagline_in" ? "scale(1) translateY(0)" : "scale(0.9) translateY(-20px)",
          }}>
          <span className="text-7xl">🎯</span>
          <p className="text-4xl font-black text-white text-center leading-tight">
            Ready to read<br />the room?
          </p>
        </div>
      )}

      {/* Ready placeholder */}
      {isReady && (
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <p className={`text-5xl font-black ${t.textYellow}`}>Starting Round 1...</p>
        </div>
      )}
    </div>
  );
}

type MenuState = "closed" | "main" | "kick" | "end_confirm" | "disband_confirm";

const HOST_SESSION_KEY = "consensus_host_session";
const DEFAULT_NUM_QUESTIONS = 10;
const DEFAULT_PHASE1_TIME = 20;
const DEFAULT_PHASE2_TIME = 30;

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
  const [gameMode] = useState(() => {
    if (typeof window === "undefined") return "game_questions";
    return sessionStorage.getItem(`${roomCode}_mode`) ?? "game_questions";
  });

  const roundHistoryRef = useRef<RoundResult[]>([]);
  const seenRoundsRef = useRef<Set<number>>(new Set());
  const collectedQuestionsRef = useRef<CollectedQuestion[]>([]);
  const [collectedCount, setCollectedCount] = useState(0);

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
        sendMsg({ type: "start_game", numQuestions, phase1Time, phase2Time, mode: gameMode as "game_questions" | "player_questions" });
      }
    },
    (msg) => {
      if (msg.type === "question_received") {
        collectedQuestionsRef.current = [...collectedQuestionsRef.current, msg.question];
        setCollectedCount((c) => c + 1);
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
    question_submission: "Question Collection",
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
      <div className={`mx-auto w-full ${phase === "question_submission" ? "max-w-3xl" : "max-w-2xl"}`}>
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

        {/* Centered heading for question collection */}
        {phase === "question_submission" && (
          <div className="text-center mb-4">
            <p className={`${t.textMuted} text-xs uppercase tracking-widest mb-1`}>Question Collection</p>
            <h2 className={`text-2xl font-black text-white`}>
              {collectedCount} <span className={t.textCyan}>/ {gameState?.totalRounds}</span> questions
            </h2>
          </div>
        )}

        {/* Phase status */}
        {phase !== "question_submission" && (
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
          {(phase === "phase1" || phase === "phase2") && (gameState?.phaseEndsAt || gameState?.paused) && (
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-[#1a3580] rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-none ${timerUrgent ? "bg-[#c94f7a]" : gameState?.paused ? "bg-[#f6dc53]" : "bg-[#7862FF]"}`}
                  style={{ width: `${gameState?.paused ? (((gameState.pausedTimeRemaining ?? 0) / 1000) / totalSecs) * 100 : timerPct}%` }}
                />
              </div>
              <span className={`${gameState?.paused ? t.textYellow : timerUrgent ? "text-[#c94f7a]" : t.textYellow} font-mono font-bold text-lg w-20 text-right`}>
                {gameState?.paused ? `⏸ ${Math.ceil((gameState.pausedTimeRemaining ?? 0) / 1000)}s` : `${Math.ceil(countdown)}s`}
              </span>
            </div>
          )}
        </div>
        )}

        {/* Question submission phase */}
        {phase === "question_submission" && gameState && (
          <div className={`${t.bgSurface} rounded-2xl border ${t.borderSurface} p-6 mb-4 w-full`}>

            <HostQuestionForm onSubmit={(q) => sendMsg({ type: "submit_question", text: q.text, questionType: q.questionType, options: q.options, labelLow: q.labelLow, labelHigh: q.labelHigh })} />

            <div className="flex flex-col gap-2 mt-4">
              {collectedQuestionsRef.current.map((q) => (
                <div key={q.id} className={`flex items-start justify-between gap-3 ${t.bgPage} rounded-xl px-4 py-3`}>
                  <div className="flex-1 min-w-0">
                    <span className={`${t.textMuted} text-xs uppercase tracking-widest`}>{q.type.replace("_", " ")} · {q.submittedBy}</span>
                    <p className="text-white text-sm mt-0.5 leading-snug">{q.text}</p>
                    {q.options && <p className={`${t.textFaint} text-xs mt-0.5`}>{q.options.join(" / ")}</p>}
                  </div>
                  <button
                    onClick={() => {
                      collectedQuestionsRef.current = collectedQuestionsRef.current.filter((x) => x.id !== q.id);
                      setCollectedCount(collectedQuestionsRef.current.length);
                      sendMsg({ type: "delete_question", id: q.id });
                    }}
                    className={`shrink-0 px-3 py-1 rounded-lg text-xs font-semibold text-[#c94f7a] border border-[#9a3558]/30 hover:bg-[#9a3558]/20 active:scale-95 transition-all`}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => sendMsg({ type: "begin_game" })}
              disabled={collectedCount < (gameState?.totalRounds ?? 0)}
              className={`w-full py-4 rounded-2xl ${t.btnYellow} text-xl font-black mt-4 disabled:opacity-40`}
            >
              {collectedCount >= (gameState?.totalRounds ?? 0) ? "Start Game! →" : `Need ${(gameState?.totalRounds ?? 0) - collectedCount} more question${(gameState?.totalRounds ?? 0) - collectedCount === 1 ? "" : "s"}`}
            </button>
          </div>
        )}

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
            className={`w-full py-3 rounded-xl ${t.btnYellow} text-base shadow-xl`}
          >
            {gameState?.round === gameState?.totalRounds ? "Go to game summary! 🏆" : "Go to Round Results →"}
          </button>
        )}

        {/* Leaderboard: advance to next question */}
        {phase === "leaderboard" && (
          <button
            onClick={() => sendMsg({ type: "next_round" })}
            className={`w-full py-3 rounded-xl ${t.btnYellow} text-base shadow-xl`}
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
              className={`w-full py-4 rounded-2xl ${t.btnPrimary} text-base font-bold shadow-xl`}
            >
              View Game Summary →
            </button>
            <button
              onClick={handlePlayAgain}
              className={`w-full py-4 rounded-2xl ${t.btnYellow} text-base shadow-xl`}
            >
              Play Again
            </button>
            <button
              onClick={() => setMenuState("disband_confirm")}
              className={`w-full py-4 rounded-2xl ${t.btnDanger} text-base font-bold`}
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
