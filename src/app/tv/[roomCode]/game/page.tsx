"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useParty } from "@/lib/useParty";
import { t, avatarColor, resolveAvatarColor, resolveEmoji } from "@/lib/theme";
import type { GameState } from "@/lib/types";

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

function CircleTimer({ secs, total }: { secs: number; total: number }) {
  const pct = total > 0 ? secs / total : 0;
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const urgent = secs <= 5;

  return (
    <div className="relative w-28 h-28">
      <svg className="-rotate-90" width="112" height="112" viewBox="0 0 112 112">
        <circle cx="56" cy="56" r={r} fill="none" stroke="#0f2660" strokeWidth="8" />
        <circle
          cx="56" cy="56" r={r} fill="none"
          stroke={urgent ? "#c94f7a" : t.timerNormal}
          strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          className="transition-all duration-300"
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center font-black text-3xl ${urgent ? "text-[#c94f7a]" : t.textPrimary}`}>
        {Math.ceil(secs)}
      </span>
    </div>
  );
}

function PromptTypeIcon({ type }: { type: string }) {
  if (type === "binary") return <span className={`${t.textCyan} text-2xl font-bold uppercase tracking-widest`}>YES / NO</span>;
  if (type === "multiple_choice") return <span className={`${t.textPrimary} text-2xl font-bold uppercase tracking-widest`}>MULTIPLE CHOICE</span>;
  return <span className={`${t.textTeal} text-2xl font-bold uppercase tracking-widest`}>SCALE 1–10</span>;
}

function AnswerBar({ label, value, pct, color, isWinner }: { label: string; value: number | string; pct: number; color: string; isWinner?: boolean }) {
  const safePct = Number.isFinite(pct) ? pct : 0;
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setWidth(safePct), 100);
    return () => clearTimeout(timer);
  }, [safePct]);

  return (
    <div className={`contents ${isWinner ? "opacity-100" : "opacity-60"}`}>
      <span className={`text-white font-bold text-xl text-right whitespace-nowrap self-center ${isWinner ? t.textTeal : ""}`}>
        {label}
      </span>
      <div className="relative h-14 bg-[#2a4a8a] rounded-xl overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full ${color} rounded-xl transition-all duration-1000 ease-out`}
          style={{ width: `${width}%` }}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-xl z-10 text-[#081c48]">
          {value}{safePct > 0 ? ` (${Math.round(safePct)}%)` : ""}
        </span>
      </div>
      <span className="w-16 text-center text-5xl self-center">
        {isWinner ? <span className={t.textTeal}>✓</span> : null}
      </span>
    </div>
  );
}

function GameOverIntro({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<"gameover" | "crossfade" | "consensus" | "fadeout">("gameover");

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep("crossfade"), 2000),
      setTimeout(() => setStep("consensus"), 2500),
      setTimeout(() => setStep("fadeout"), 4500),
      setTimeout(() => onDone(), 5000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  const showGameOver = step === "gameover";
  const showConsensus = step === "consensus";

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center ${t.bgPage} transition-opacity duration-500`}
      style={{ opacity: step === "fadeout" ? 0 : 1 }}
    >
      <div
        className="flex flex-col items-center gap-6 text-center transition-all duration-500"
        style={{ opacity: showGameOver ? 1 : 0, transform: showGameOver ? "translateY(0)" : "translateY(-20px)" }}
      >
        <p className="text-8xl">🏆</p>
        <p className={`font-black ${t.textYellow} text-center`} style={{ fontSize: "7rem", lineHeight: 1 }}>
          Game Over!
        </p>
      </div>
      <div
        className="absolute flex flex-col items-center gap-6 text-center transition-all duration-500"
        style={{ opacity: showConsensus ? 1 : 0, transform: showConsensus ? "translateY(0)" : "translateY(24px)" }}
      >
        <p className="text-8xl">🤔</p>
        <p className={`font-black text-white text-center`} style={{ fontSize: "5rem", lineHeight: 1.1 }}>
          Who figured out<br />the consensus?
        </p>
      </div>
    </div>
  );
}

const RULES = [
  { icon: "💬", color: "#7862FF", label: "Phase 1", title: "Answer", body: "Every round, answer the question honestly for yourself." },
  { icon: "🔮", color: "#4dd9d2", label: "Phase 2", title: "Predict", body: "Guess what the majority of the group answered." },
  { icon: "⚡", color: "#f6dc53", label: "Score", title: "Double Down", body: "Risk your token to double your points — one use per game!" },
];

function JumpWord({ word, color, delay = 0 }: { word: string; color: string; delay?: number }) {
  return (
    <span className="inline-flex gap-[0.05em]" aria-label={word}>
      {word.split("").map((ch, i) => (
        <span
          key={i}
          className="inline-block font-black"
          style={{
            color,
            animation: `wordJump 0.5s ease-out forwards`,
            animationDelay: `${delay + i * 60}ms`,
            opacity: 0,
          }}
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </span>
  );
}

function CountdownOverlay({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<"rules0" | "rules1" | "rules2" | "rules_out" | "tagline_in" | "tagline_out" | "3" | "2" | "1" | "done">("rules0");

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep("rules1"),      5000),
      setTimeout(() => setStep("rules2"),      10000),
      setTimeout(() => setStep("rules_out"),   15000),
      setTimeout(() => setStep("tagline_in"),  15400),
      setTimeout(() => setStep("tagline_out"), 17200),
      setTimeout(() => setStep("3"),           18000),
      setTimeout(() => setStep("2"),           19000),
      setTimeout(() => setStep("1"),           20000),
      setTimeout(() => { setStep("done"); onDone(); }, 20800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  const ruleIndex = step === "rules0" ? 0 : step === "rules1" ? 1 : step === "rules2" ? 2 : null;
  const isRules = ruleIndex !== null || step === "rules_out";
  const isTagline = step === "tagline_in" || step === "tagline_out";
  const digit = step === "3" ? "3" : step === "2" ? "2" : step === "1" ? "1" : null;
  const rule = ruleIndex !== null ? RULES[ruleIndex] : null;

  return (
    <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center ${t.bgPage} overflow-hidden`}>
      <style>{`
        @keyframes countdownPop {
          0%   { transform: scale(1.6); opacity: 0; }
          20%  { transform: scale(1.0); opacity: 1; }
          70%  { transform: scale(1.0); opacity: 1; }
          100% { transform: scale(0.7); opacity: 0; }
        }
        @keyframes ruleSlideIn {
          0%   { transform: translateY(40px) scale(0.95); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes wordJump {
          0%   { transform: translateY(20px) scale(0.8); opacity: 0; }
          60%  { transform: translateY(-8px) scale(1.15); opacity: 1; }
          80%  { transform: translateY(3px) scale(0.97); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>

      {/* Rules cards */}
      {isRules && rule && (
        <div
          key={ruleIndex}
          className="flex flex-col items-center gap-8 text-center px-16"
          style={{ animation: "ruleSlideIn 0.4s ease-out forwards" }}
        >
          {/* Step dots */}
          <div className="flex gap-3">
            {RULES.map((_, i) => (
              <div key={i} className="w-3 h-3 rounded-full transition-all duration-300"
                style={{ background: i === ruleIndex ? rule.color : "#2a4a8a" }} />
            ))}
          </div>
          {/* Card */}
          <div className="rounded-3xl px-20 py-14 flex flex-col items-center gap-6"
            style={{ background: `${rule.color}18`, border: `2px solid ${rule.color}44` }}>
            <span style={{ fontSize: "6rem" }}>{rule.icon}</span>
            <div>
              <p className="text-2xl font-bold uppercase tracking-widest mb-4" style={{ color: rule.color }}>{rule.label}</p>
              <p className="text-7xl mb-6" style={{ lineHeight: 1.1 }}>
                <JumpWord key={`${ruleIndex}-title`} word={rule.title} color="white" delay={200} />
              </p>
              <p className="text-3xl text-[#a8c0e8] max-w-2xl leading-snug">{rule.body}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tagline */}
      {isTagline && (
        <div
          className="flex flex-col items-center gap-4 transition-all duration-500"
          style={{
            opacity: step === "tagline_in" ? 1 : 0,
            transform: step === "tagline_in" ? "scale(1) translateY(0)" : "scale(0.9) translateY(-20px)",
          }}
        >
          <span className="text-8xl">🎯</span>
          <p className="text-5xl font-black text-white text-center leading-tight">
            Ready to read<br />the room?
          </p>
        </div>
      )}

      {/* Digit countdown */}
      {digit && (
        <div key={digit} className="flex items-center justify-center"
          style={{ animation: "countdownPop 0.9s ease-out forwards" }}>
          <span className="font-black leading-none" style={{
            fontSize: "20rem",
            color: digit === "3" ? "#7862FF" : digit === "2" ? "#4dd9d2" : "#f6dc53",
            textShadow: `0 0 80px ${digit === "3" ? "#7862FF88" : digit === "2" ? "#4dd9d288" : "#f6dc5388"}`,
          }}>
            {digit}
          </span>
        </div>
      )}
    </div>
  );
}

function QuestionSubmissionView({ game }: { game: GameState }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-6 text-center px-8">
      <p className={`${t.textCyan} text-2xl font-bold uppercase tracking-widest`}>Players are submitting questions</p>
      <div className="flex items-baseline gap-3">
        <span className={`font-black ${t.textYellow}`} style={{ fontSize: "10rem", lineHeight: 1 }}>
          {game.submittedQuestionCount}
        </span>
        <span className="text-white font-black text-5xl">/ {game.totalRounds}</span>
      </div>
      <p className={`${t.textMuted} text-xl`}>questions submitted</p>
    </div>
  );
}

function Phase1View({ game }: { game: GameState }) {
  const total = game.phase1Duration;
  const countdown = useCountdown(game.phaseEndsAt);
  const frozenSecs = game.paused ? (game.pausedTimeRemaining ?? 0) / 1000 : countdown;

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-8 px-8 text-center">
      <div className="flex flex-col items-center gap-2">
        <PromptTypeIcon type={game.prompt!.type} />
        <h2 className="text-4xl font-semibold text-white leading-tight max-w-4xl mt-2">
          {game.prompt!.text}
        </h2>
      </div>

      {game.prompt!.type === "multiple_choice" && (
        <div className="grid grid-cols-2 gap-4 w-full max-w-2xl mt-4">
          {game.prompt!.options!.map((opt, i) => {
            const c = t.answerChoiceColors[i % t.answerChoiceColors.length];
            return (
              <div key={i} className={`${c.bg} rounded-2xl px-6 py-5 text-xl font-semibold flex items-center gap-3 min-h-[5rem]`}>
                <span className={`${c.text} opacity-40 font-black text-2xl shrink-0`}>{String.fromCharCode(65 + i)}.</span>
                <span className={c.text}>{opt}</span>
              </div>
            );
          })}
        </div>
      )}

      {game.prompt!.type === "scale" && (
        <div className="w-full max-w-2xl mt-2">
          <div className="flex justify-between mb-2 px-1">
            <span className={`${t.textMuted} text-3xl font-semibold`}>1 — {game.prompt!.labelLow ?? ""}</span>
            <span className={`${t.textMuted} text-3xl font-semibold`}>{game.prompt!.labelHigh ?? ""} — 10</span>
          </div>
          <div className="h-3 bg-[#2a4a8a] rounded-full" />
        </div>
      )}

      <div className="flex flex-col items-center gap-3 mt-4">
        <div className="relative">
          <CircleTimer secs={frozenSecs} total={total} />
          {game.paused && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-3xl font-black ${t.textYellow} animate-pulse`}>⏸</span>
            </div>
          )}
        </div>
        <p className="text-[#7a96c8] text-xl">Players are answering...</p>
        <p className={`${t.textMuted} text-lg`}>
          <span className="text-white font-bold">{game.answeredCount}</span> / <span className="text-white font-bold">{game.N}</span> answered
        </p>
      </div>
    </div>
  );
}

function Phase2View({ game }: { game: GameState }) {
  const total = game.phase2Duration;
  const countdown = useCountdown(game.phaseEndsAt);
  const frozenSecs = game.paused ? (game.pausedTimeRemaining ?? 0) / 1000 : countdown;

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-8 px-8 text-center">
      <div className="flex flex-col items-center gap-2">
        <span className={`${t.textCyan} text-3xl font-bold uppercase tracking-widest`}>What did the room say?</span>
        <PromptTypeIcon type={game.prompt!.type} />
        <h2 className="text-4xl font-semibold text-white leading-tight max-w-4xl mt-2">
          {game.prompt!.text}
        </h2>
      </div>

      {game.prompt!.type === "scale" && (
        <div className="w-full max-w-2xl">
          <div className="flex justify-between mb-2 px-1">
            <span className={`${t.textMuted} text-3xl font-semibold`}>1 — {game.prompt!.labelLow ?? ""}</span>
            <span className={`${t.textMuted} text-3xl font-semibold`}>{game.prompt!.labelHigh ?? ""} — 10</span>
          </div>
          <div className="h-3 bg-[#2a4a8a] rounded-full" />
        </div>
      )}

      <div className="flex flex-col items-center gap-2">
        <p className="text-[#7a96c8] text-xl">Players are predicting...</p>
      </div>

      <div className="relative">
        <CircleTimer secs={frozenSecs} total={total} />
        {game.paused && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-3xl font-black ${t.textYellow} animate-pulse`}>⏸</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Phase3View({ game }: { game: GameState }) {
  const result = game.roundResult!;
  const prompt = result.prompt;
  const N = game.phase1AnsweredCount || game.N;

  if (game.phase1AnsweredCount === 0) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-6 px-8 text-center">
        <span className="text-7xl">🦗</span>
        <h2 className="text-4xl font-semibold text-white leading-tight max-w-2xl">
          {prompt.text}
        </h2>
        <p className={`${t.textMuted} text-2xl`}>Nobody answered this round.</p>
      </div>
    );
  }

  if (prompt.type === "binary") {
    const yesCount = Number(result.actualResult);
    const noCount = N - yesCount;
    const yesPct = N > 0 ? (yesCount / N) * 100 : 0;
    const noPct = N > 0 ? (noCount / N) * 100 : 0;

    return (
      <div className="flex flex-col flex-1 items-center px-8 py-8 gap-8">
        <div className="text-center">
          <PromptTypeIcon type="binary" />
          <h2 className="text-4xl font-semibold text-white mt-2 leading-tight max-w-4xl mx-auto">
            {prompt.text}
          </h2>
        </div>

        <p className="text-white text-3xl font-black text-center">
          <span className={t.textTeal}>{yesCount}</span> out of <span className={t.textTeal}>{N}</span> said YES
        </p>

        <div className="grid gap-4 w-full max-w-2xl mx-auto mt-4" style={{ gridTemplateColumns: "auto 1fr auto" }}>
          <AnswerBar label="YES" value={yesCount} pct={yesPct} color="bg-[#25a59f]" isWinner={yesCount >= noCount} />
          <AnswerBar label="NO" value={noCount} pct={noPct} color="bg-[#9a3558]" isWinner={noCount > yesCount} />
        </div>

        <ResultFooter result={result} />
      </div>
    );
  }

  if (prompt.type === "multiple_choice") {
    const counts: Record<string, number> = {};
    prompt.options!.forEach((opt) => { counts[opt] = 0; });
    Object.values(result.phase1Answers).forEach((v) => {
      if (counts[String(v)] !== undefined) counts[String(v)]++;
    });
    const winners = new Set(String(result.actualResult).split("|"));

    return (
      <div className="flex flex-col flex-1 items-center px-8 py-8 gap-8">
        <div className="text-center">
          <PromptTypeIcon type="multiple_choice" />
          <h2 className="text-4xl font-semibold text-white mt-2 leading-tight max-w-4xl mx-auto">
            {prompt.text}
          </h2>
        </div>

        <div className="grid gap-4 w-full max-w-2xl mx-auto mt-4" style={{ gridTemplateColumns: "auto 1fr auto" }}>
          {prompt.options!.map((opt, i) => {
            const count = counts[opt] ?? 0;
            const pct = N > 0 ? (count / N) * 100 : 0;
            return (
              <AnswerBar
                key={opt}
                label={opt}
                value={count}
                pct={pct}
                color={t.answerBarColors[i % t.answerBarColors.length]}
                isWinner={winners.has(opt)}
              />
            );
          })}
        </div>

        <ResultFooter result={result} />
      </div>
    );
  }

  // Scale
  const avg = Number(result.actualResult);

  return (
    <div className="flex flex-col flex-1 items-center px-8 py-8 gap-8">
      <div className="text-center">
        <PromptTypeIcon type="scale" />
        <h2 className="text-4xl font-semibold text-white mt-2 leading-tight max-w-4xl mx-auto">
          {prompt.text}
        </h2>
      </div>

      <div className="max-w-2xl mx-auto w-full mt-4">
        <div className="flex justify-between mb-2 px-1">
          <span className={`${t.textMuted} text-3xl font-semibold`}>{prompt.labelLow ?? "1"}</span>
          <span className={`${t.textMuted} text-3xl font-semibold`}>{prompt.labelHigh ?? "10"}</span>
        </div>
        <div className="relative h-14 bg-[#2a4a8a] rounded-2xl overflow-hidden">
          <ScaleBar avg={avg} />
        </div>
        <div className="text-center mt-4">
          <span className={`${t.textCyan} text-5xl font-black`}>{avg.toFixed(1)}</span>
          <span className={`${t.textMuted} text-2xl`}> / 10</span>
        </div>
      </div>

      <ResultFooter result={result} />
    </div>
  );
}

function ScaleBar({ avg }: { avg: number }) {
  const pct = ((avg - 1) / 9) * 100;
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setWidth(pct), 200);
    return () => clearTimeout(timer);
  }, [pct]);
  return (
    <div
      className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#7862FF] to-[#f6dc53] rounded-2xl transition-all duration-1500 ease-out"
      style={{ width: `${width}%` }}
    />
  );
}

function ResultFooter({ result }: { result: NonNullable<GameState["roundResult"]> }) {
  const topScorers = Object.entries(result.scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="flex flex-wrap items-start gap-6 mt-2">
      {topScorers.length > 0 && (
        <div className={`${t.bgSurface}/50 border ${t.borderSurface} rounded-2xl px-5 py-3 flex-1`}>
          <p className={`${t.textMuted} text-sm uppercase tracking-widest mb-2`}>Top This Round</p>
          <div className="flex gap-4 flex-wrap">
            {topScorers.map(([name, pts]) => (
              <div key={name} className="flex items-center gap-2">
                <div className={`${avatarColor(name)} w-8 h-8 rounded-full flex items-center justify-center text-lg`}>
                  {resolveEmoji(name)}
                </div>
                <span className="text-white font-semibold text-lg">{name}</span>
                <span className={`${t.textTeal} font-black text-lg`}>+{pts}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function useCountUp(target: number, from: number, duration = 2000): number {
  const [value, setValue] = useState(from);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    startRef.current = null;
    setValue(from);
    if (delayTimerRef.current !== null) clearTimeout(delayTimerRef.current);

    function step(ts: number) {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    }

    delayTimerRef.current = setTimeout(() => {
      rafRef.current = requestAnimationFrame(step);
    }, 2000);

    return () => {
      if (delayTimerRef.current !== null) clearTimeout(delayTimerRef.current);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, from, duration]);

  return value;
}

function LeaderboardRow({ player, isTop }: { player: GameState["leaderboard"][0]; isTop: boolean }) {
  const prevTotal = player.total - player.roundScore;
  const animatedTotal = useCountUp(player.total, prevTotal, 2000);

  return (
    <div
      className={`flex items-center gap-4 rounded-2xl px-6 py-4 transition-all ${
        isTop
          ? "bg-[#7862FF]/20 border-2 border-[#7862FF]/60"
          : `${t.bgSurface}/60 border ${t.borderSurface}`
      }`}
    >
      <span className={`font-black text-2xl w-8 ${isTop ? t.textPrimary : t.textMuted}`}>
        #{player.rank}
      </span>
      <div className={`${resolveAvatarColor(player.nickname, player.emoji)} w-12 h-12 rounded-full flex items-center justify-center text-2xl`}>
        {resolveEmoji(player.nickname, player.emoji)}
      </div>
      <span className={`font-bold text-xl flex-1 ${isTop ? t.textPrimary : "text-white"}`}>
        {player.nickname}
      </span>
      {player.roundScore > 0 && (
        <span className={`${t.textTeal} font-bold text-lg`}>+{player.roundScore}</span>
      )}
      <span className={`font-black text-2xl tabular-nums ${isTop ? t.textPrimary : "text-white"}`}>
        {animatedTotal}
      </span>
    </div>
  );
}

function LeaderboardView({ game, title }: { game: GameState; title: string }) {
  const board = game.leaderboard;

  return (
    <div className="flex flex-col flex-1 px-16 py-8 gap-6">
      <h2 className={`text-4xl font-black ${t.textCyan} text-center`}>{title}</h2>

      <div className="flex flex-col gap-3 max-w-2xl mx-auto w-full">
        {board.map((player, i) => (
          <LeaderboardRow key={player.nickname} player={player} isTop={i === 0} />
        ))}
      </div>

      {game.phase === "leaderboard" && (
        <p className={`${t.textFaint} text-center text-lg mt-2 animate-pulse`}>
          Round {game.round + 1} starting soon...
        </p>
      )}
    </div>
  );
}

const TV_RANK_STYLE: Record<number, { color: string; label: string; emoji: string; height: string; bg: string }> = {
  1: { color: t.textYellow,       label: "1st", emoji: "🏆", height: "h-48", bg: "bg-[#f6dc53]/20 border border-[#f6dc53]/40" },
  2: { color: "text-[#7a96c8]",   label: "2nd", emoji: "🥈", height: "h-32", bg: "bg-[#7a96c8]/10 border border-[#7a96c8]/20" },
  3: { color: "text-[#cd853f]",   label: "3rd", emoji: "🥉", height: "h-24", bg: "bg-[#cd853f]/10 border border-[#cd853f]/20" },
};

function EndedView({ game }: { game: GameState }) {
  const lb = game.leaderboard;

  const podiumPlayers = lb.filter((p) => (p.rank ?? 99) <= 3);
  const restPlayers = lb.filter((p) => (p.rank ?? 99) > 3).slice(0, 7);

  const rank1 = podiumPlayers.filter((p) => p.rank === 1);
  const rank2 = podiumPlayers.filter((p) => p.rank === 2);
  const rank3 = podiumPlayers.filter((p) => p.rank === 3);

  // If 2+ tied for 1st: left=rank1[0], center=rank1[1], right=rank2[0] or rank1[2]
  // Normal: left=rank2[0], center=rank1[0], right=rank2[1] or rank3[0]
  const tiedFirst = rank1.length >= 2;
  const leftSlot = tiedFirst ? rank1[0] : (rank2[0] ?? null);
  const centerSlot = tiedFirst ? rank1[1] : (rank1[0] ?? null);
  const rightSlot = tiedFirst ? (rank1[2] ?? rank2[0] ?? null) : (rank2[1] ?? rank3[0] ?? null);

  function TVPodiumSlot({ p }: { p: typeof rank1[0] }) {
    const style = TV_RANK_STYLE[p.rank ?? 1];
    return (
      <div className="flex flex-col items-center gap-2 w-full max-w-[160px]">
        <div className={`${resolveAvatarColor(p.nickname, p.emoji)} w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-xl flex-shrink-0`}>
          {resolveEmoji(p.nickname, p.emoji)}
        </div>
        <p className="text-white text-xl text-center truncate w-full px-1">{p.nickname}</p>
        <p className={`${style.color} text-lg`}>{p.total} pts</p>
        <div className={`w-full ${style.height} rounded-t-2xl flex flex-col items-center justify-start pt-3 gap-1 ${style.bg}`}>
          <span className="text-3xl">{style.emoji}</span>
          <span className={`${style.color} text-lg`}>{style.label}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 px-16 py-6 gap-6">
      <div className="text-center">
        <p className={`${t.textTeal} text-2xl uppercase tracking-widest mb-1`}>Game Over</p>
        <h2 className={`text-6xl text-white`}>CONSENSUS</h2>
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-1 mt-2">
        <div className="flex flex-col items-center w-40 min-w-0">
          {leftSlot && <TVPodiumSlot p={leftSlot} />}
        </div>
        <div className="flex flex-col items-center w-40 min-w-0">
          {centerSlot && <TVPodiumSlot p={centerSlot} />}
        </div>
        <div className="flex flex-col items-center w-40 min-w-0">
          {rightSlot && <TVPodiumSlot p={rightSlot} />}
        </div>
      </div>

      {/* Below podium */}
      {restPlayers.length > 0 && (
        <div className="flex flex-col gap-2 max-w-2xl mx-auto w-full">
          {restPlayers.map((p) => (
            <div key={p.nickname} className={`flex items-center gap-4 ${t.bgSurface}/60 rounded-xl px-5 py-3`}>
              <span className={`${t.textMuted} text-xl w-8`}>#{p.rank}</span>
              <div className={`${resolveAvatarColor(p.nickname, p.emoji)} w-10 h-10 rounded-full flex items-center justify-center text-xl`}>
                {resolveEmoji(p.nickname, p.emoji)}
              </div>
              <span className="text-white text-xl flex-1">{p.nickname}</span>
              <span className="text-white text-xl">{p.total}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TVGamePage() {
  const params = useParams();
  const roomCode = (params.roomCode as string).toUpperCase();

  const [roomNotFound, setRoomNotFound] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [endedVisible, setEndedVisible] = useState(false);
  const prevPhaseRef = useRef<string | null>(null);

  const { gameState } = useParty(roomCode, undefined, (msg) => {
    if (msg.type === "room_not_found" || msg.type === "disbanded") {
      setRoomNotFound(true);
    }
  });

  useEffect(() => {
    fetch(`/api/room/${roomCode}`)
      .then((r) => r.json())
      .then((data: { exists: boolean }) => {
        if (!data.exists) setRoomNotFound(true);
      })
      .catch(() => setRoomNotFound(true));
  }, [roomCode]);

  // When game resets to lobby (host starts a new game), reload TV lobby page
  useEffect(() => {
    if (gameState?.phase === "lobby") {
      window.location.href = `/tv/${roomCode}`;
    }
  }, [gameState?.phase, roomCode]);

  // Show Game Over intro when transitioning to ended phase
  useEffect(() => {
    const prev = prevPhaseRef.current;
    const curr = gameState?.phase ?? null;
    if (curr === "ended") {
      if (prev === null) {
        // page loaded already in ended state (e.g. refresh) — skip intro
        setEndedVisible(true);
      } else if (prev !== "ended") {
        setShowGameOver(true);
        setEndedVisible(false);
      }
    }
    prevPhaseRef.current = curr;
  }, [gameState?.phase]);

  if (roomNotFound) {
    return (
      <main className={`min-h-screen ${t.bgPage} flex flex-col items-center justify-center`}>
        <div className={`${t.bgSurface} border border-[#9a3558]/40 rounded-2xl p-12 text-center max-w-md`}>
          <p className="text-6xl mb-6">📺</p>
          <h2 className="text-3xl font-black text-[#c94f7a] mb-3">Room Not Found</h2>
          <p className={`${t.textMuted} text-lg`}>
            No active game for room <span className="text-white font-mono font-black">{roomCode}</span>.
          </p>
          <p className={`${t.textFaint} text-base mt-2`}>Ask the host to create a new room.</p>
        </div>
      </main>
    );
  }

  const phase = gameState?.phase ?? "lobby";
  const answeredCount = gameState?.answeredCount ?? 0;
  const N = gameState?.N ?? 0;

  return (
    <main className={`min-h-screen ${t.bgPage} flex flex-col relative overflow-hidden`}>
      {phase === "countdown" && (
        <CountdownOverlay onDone={() => {}} />
      )}
      {showGameOver && (
        <GameOverIntro onDone={() => { setShowGameOver(false); setEndedVisible(true); }} />
      )}
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#7862FF]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#25a59f]/5 rounded-full blur-3xl" />
      </div>

      {/* Top bar */}
      <div className={`relative z-10 flex items-center justify-between px-4 sm:px-10 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-[#2a4a8a]`}>
        <div>
          <h1 className={`text-lg sm:text-2xl font-black text-white tracking-tight`}>CONSENSUS</h1>
          <span className="text-[#4dd9d2] text-sm tracking-widest hidden sm:block">Wisdom of the Crowds</span>
        </div>
        {gameState && (
          <div className="flex items-center gap-4 sm:gap-8">
            {gameState.phase !== "question_submission" && (
              <div className="text-center">
                <p className={`${t.textFaint} text-sm uppercase tracking-widest`}>Round</p>
                <p className="text-white font-black text-xl xl:text-3xl leading-tight">{gameState.round}<span className={`${t.textFaint} text-base xl:text-xl`}> / {gameState.totalRounds}</span></p>
              </div>
            )}
            <div className="text-center">
              <p className={`${t.textFaint} text-sm uppercase tracking-widest`}>Room</p>
              <p className={`${t.textYellow} font-black text-xl xl:text-3xl font-mono leading-tight`}>{roomCode}</p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1 pt-6">
        {!gameState || phase === "lobby" || phase === "countdown" ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center">
            <p className={`${t.textTeal} text-3xl font-black animate-pulse`}>Waiting for game to start...</p>
          </div>
        ) : phase === "question_submission" ? (
          <QuestionSubmissionView game={gameState} />
        ) : phase === "phase1" ? (
          <Phase1View game={gameState} />
        ) : phase === "phase2" ? (
          <Phase2View game={gameState} />
        ) : phase === "phase3" ? (
          <Phase3View game={gameState} />
        ) : phase === "leaderboard" ? (
          <LeaderboardView game={gameState} title={`Round ${gameState.round} Results`} />
        ) : (
          <div
            className="flex flex-col flex-1 transition-all duration-700"
            style={{ opacity: endedVisible ? 1 : 0, transform: endedVisible ? "translateY(0)" : "translateY(40px)" }}
          >
            <EndedView game={gameState} />
          </div>
        )}
      </div>

      {/* Answered count badge (phase1/phase2 only) */}
      {(phase === "phase1" || phase === "phase2") && gameState && (
        <div className={`fixed bottom-6 left-6 ${t.bgSurface}/80 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-semibold z-20 border ${t.borderSurface}`}>
          {answeredCount} / {phase === "phase2" ? (gameState.phase1AnsweredCount || N) : N} answered
        </div>
      )}
    </main>
  );
}
