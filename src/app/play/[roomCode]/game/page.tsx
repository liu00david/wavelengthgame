"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
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

function TimerBar({ secs, total, color = "bg-[#7862FF]" }: { secs: number; total: number; color?: string }) {
  const pct = total > 0 ? Math.min(100, Math.max(0, (secs / total) * 100)) : 0;
  const urgent = secs <= 5 && secs > 0;
  return (
    <div className={`w-full h-3 ${t.bgPage} rounded-full overflow-hidden`}>
      <div
        className={`h-full rounded-full transition-none ${urgent ? "bg-[#c94f7a]" : color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ---- Binary Input ----
function BinaryInput({ onSubmit, disabled }: { onSubmit: (val: string) => void; disabled: boolean }) {
  return (
    <div className="flex gap-4 w-full">
      <button
        onClick={() => !disabled && onSubmit("no")}
        disabled={disabled}
        className="flex-1 py-5 rounded-2xl bg-[#9a3558] hover:bg-[#7e2b47] active:scale-95 disabled:opacity-40 transition-all text-white text-3xl font-black shadow-xl"
      >
        NO
      </button>
      <button
        onClick={() => !disabled && onSubmit("yes")}
        disabled={disabled}
        className="flex-1 py-5 rounded-2xl bg-[#25a59f] hover:bg-[#1d8c87] active:scale-95 disabled:opacity-40 transition-all text-white text-3xl font-black shadow-xl"
      >
        YES
      </button>
    </div>
  );
}

// ---- Multiple Choice Input ----
function MultipleChoiceInput({ options, onSubmit, disabled }: { options: string[]; onSubmit: (val: string) => void; disabled: boolean }) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {options.map((opt, i) => {
        const c = t.answerChoiceColors[i % t.answerChoiceColors.length];
        return (
          <button
            key={opt}
            onClick={() => !disabled && onSubmit(opt)}
            disabled={disabled}
            className={`w-full py-5 rounded-2xl ${c.bg} hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all ${c.text} text-xl font-bold shadow-lg px-5 text-left`}
          >
            <span className="opacity-60 font-black mr-2">{String.fromCharCode(65 + i)}.</span>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ---- Scale Input ----
function ScaleInput({ onSubmit, disabled, step = 1, min = 1, max = 10, labelLow, labelHigh }: {
  onSubmit: (val: number) => void;
  disabled: boolean;
  step?: number;
  min?: number;
  max?: number;
  labelLow?: string;
  labelHigh?: string;
}) {
  const [value, setValue] = useState(step === 1 ? 5 : 5.0);

  function adjust(delta: number) {
    setValue((v) => {
      const next = Math.round((v + delta) / step) * step;
      return Math.min(max, Math.max(min, next));
    });
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className={`text-8xl font-black ${t.textYellow}`}>
        {step === 1 ? value : value.toFixed(1)}
        <span className={`text-2xl font-bold ${t.textMuted} ml-2`}>/ 10</span>
      </div>
      <div className="flex flex-col gap-2 w-full mt-4">
        <div className="flex justify-between px-1">
          <span className={`${t.textMuted} text-xl font-semibold`}>{labelLow ?? "1"}</span>
          <span className={`${t.textMuted} text-xl font-semibold`}>{labelHigh ?? "10"}</span>
        </div>
        <div className="flex items-center gap-4 w-full">
          <button onClick={() => adjust(-step)} disabled={disabled}
            className={`w-12 h-12 rounded-full ${t.btnGhost} text-white text-2xl font-black disabled:opacity-40 transition-all shadow leading-none flex items-center justify-center`}>−</button>
          <input type="range" min={min} max={max} step={step} value={value} disabled={disabled}
            onChange={(e) => setValue(parseFloat(e.target.value))}
            className="flex-1 accent-[#7862FF] h-3 cursor-pointer" />
          <button onClick={() => adjust(step)} disabled={disabled}
            className={`w-12 h-12 rounded-full ${t.btnGhost} text-white text-2xl font-black disabled:opacity-40 transition-all shadow leading-none flex items-center justify-center`}>+</button>
        </div>
      </div>
      <button onClick={() => !disabled && onSubmit(value)} disabled={disabled}
        className={`w-full py-5 rounded-2xl ${t.btnYellow} text-xl shadow-xl disabled:opacity-40`}>
        Submit
      </button>
    </div>
  );
}

// ---- Binary Prediction ----
function BinaryPrediction({ N, onSubmit, disabled }: { N: number; onSubmit: (val: number) => void; disabled: boolean }) {
  const [value, setValue] = useState(Math.round(N / 2));
  function adjust(delta: number) { setValue((v) => Math.min(N, Math.max(0, v + delta))); }
  const noCount = N - value;

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <p className={`${t.textMuted} text-lg font-semibold text-center`}>How many people said YES?</p>

      {/* YES / NO split display */}
      <div className="flex items-center justify-center gap-6 w-full">
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-[#9a3558] font-black text-lg uppercase tracking-widest">NO</span>
          <span className="text-white font-black text-6xl leading-none">{noCount}</span>
          <span className={`${t.textFaint} text-sm`}>/ {N}</span>
        </div>
        <div className={`w-px h-16 bg-[#2a4a8a]`} />
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-[#25a59f] font-black text-lg uppercase tracking-widest">YES</span>
          <span className="text-white font-black text-6xl leading-none">{value}</span>
          <span className={`${t.textFaint} text-sm`}>/ {N}</span>
        </div>
      </div>

      {/* Slider */}
      <div className="flex items-center gap-3 w-full">
        <button onClick={() => adjust(-1)} disabled={disabled}
          className={`w-14 h-14 rounded-full ${t.btnGhost} text-white text-3xl font-black disabled:opacity-40 transition-all shadow`}>−</button>
        <input type="range" min={0} max={N} step={1} value={value} disabled={disabled}
          onChange={(e) => setValue(parseInt(e.target.value))}
          className="flex-1 accent-[#7862FF] h-3 cursor-pointer" />
        <button onClick={() => adjust(1)} disabled={disabled}
          className={`w-14 h-14 rounded-full ${t.btnGhost} text-white text-3xl font-black disabled:opacity-40 transition-all shadow`}>+</button>
      </div>

      <button onClick={() => !disabled && onSubmit(value)} disabled={disabled}
        className={`w-full py-5 rounded-2xl ${t.btnYellow} text-xl shadow-xl disabled:opacity-40`}>
        Submit Prediction
      </button>
    </div>
  );
}

// ---- Multiple Choice Prediction ----
function MultipleChoicePrediction({ options, onSubmit, disabled }: { options: string[]; onSubmit: (val: string) => void; disabled: boolean }) {
  return (
    <div className="flex flex-col gap-3 w-full">
      <p className={`${t.textMuted} text-base text-center mb-1`}>Which option was most popular?</p>
      {options.map((opt, i) => {
        const c = t.answerChoiceColors[i % t.answerChoiceColors.length];
        return (
          <button key={opt} onClick={() => !disabled && onSubmit(opt)} disabled={disabled}
            className={`w-full py-5 rounded-2xl ${c.bg} hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all ${c.text} text-xl font-bold shadow-lg px-5 text-left`}>
            <span className="opacity-60 font-black mr-2">{String.fromCharCode(65 + i)}.</span>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ---- Double Down Toggle ----
function DoubleDownToggle({ active, onToggle, disabled }: { active: boolean; onToggle: () => void; disabled: boolean }) {
  return (
    <button onClick={onToggle} disabled={disabled}
      className={`w-full py-4 rounded-2xl font-black text-xl transition-all active:scale-95 shadow ${
        active ? "bg-[#f6dc53] text-[#081c48]" : `${t.btnGhost} text-[#7a96c8]`
      } ${disabled ? "opacity-40" : ""}`}>
      {active ? (
        <>
          Double Down On!
          <p className="text-[#081c48]/70 text-sm font-semibold mt-0.5">Get x2 points if correct</p>
        </>
      ) : (
        <>
          Double Down?
          <p className={`text-sm font-semibold mt-0.5 ${disabled ? "" : "text-[#7a96c8]/70"}`}>One Time Use</p>
        </>
      )}
    </button>
  );
}

// ---- Score Tier ----
function isPerfect(prediction: string | number | undefined, actual: string | number, promptType: string): boolean {
  if (prediction === undefined) return false;
  if (promptType === "scale") return Math.abs(Number(prediction) - Number(actual)) <= 0.1;
  if (promptType === "binary") return Number(prediction) === Number(actual);
  // multiple_choice: prediction matches one of the winners
  return String(actual).split("|").includes(String(prediction));
}

function tierLabel(score: number): string {
  if (score >= 750) return "Great";
  if (score >= 500) return "Good";
  if (score >= 250) return "Close";
  if (score > 0)    return "Miss";
  return "Miss";
}

function tierColor(score: number): string {
  if (score >= 950) return t.textYellow;
  if (score >= 750) return t.textTeal;
  if (score >= 500) return t.textCyan;
  if (score >= 250) return "text-[#7a96c8]";
  return "text-[#c94f7a]";
}

// ---- Phase 1 view ----
function Phase1View({ game, onSubmit, submitted }: {
  game: GameState; nickname: string;
  onSubmit: (val: string | number) => void; submitted: boolean;
}) {
  const countdown = useCountdown(game.phaseEndsAt);
  const prompt = game.prompt!;
  const totalTime = game.phase1Duration;
  const frozenSecs = game.paused ? (game.pausedTimeRemaining ?? 0) / 1000 : countdown;
  const displaySecs = Math.ceil(frozenSecs);

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-6 text-center px-6 py-10">
        <div className="w-20 h-20 bg-[#25a59f] rounded-full flex items-center justify-center text-white text-4xl">✓</div>
        <p className="text-white text-2xl font-bold">Answer submitted!</p>
        <p className={`${t.textMuted} text-lg`}>Waiting for others...</p>
        <div className="w-full mt-4">
          <TimerBar secs={countdown} total={totalTime} />
          <p className={`${t.textFaint} text-xl mt-2 text-center font-mono`}>{displaySecs}s left</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-5 py-6">
      <div>
        <p className={`${t.textCyan} text-xl uppercase tracking-widest mb-2`}>
          {prompt.type === "binary" ? "Yes / No" : prompt.type === "multiple_choice" ? "Multiple Choice" : "Scale 1–10"}
        </p>
        <p className="text-white text-2xl font-bold leading-snug">{prompt.text}</p>
      </div>
      <div>
        <TimerBar secs={frozenSecs} total={totalTime} />
        <p className={`text-xl mt-1 text-right font-mono ${game.paused ? `${t.textYellow} animate-pulse` : t.textFaint}`}>
          {game.paused ? `⏸ ${displaySecs}s` : `${displaySecs}s`}
        </p>
      </div>
      {prompt.type === "binary" && <BinaryInput onSubmit={onSubmit} disabled={submitted} />}
      {prompt.type === "multiple_choice" && <MultipleChoiceInput options={prompt.options!} onSubmit={onSubmit} disabled={submitted} />}
      {prompt.type === "scale" && <ScaleInput onSubmit={onSubmit} disabled={submitted} step={1} labelLow={prompt.labelLow} labelHigh={prompt.labelHigh} />}
    </div>
  );
}

// ---- Phase 2 view ----
function Phase2View({ game, nickname, onSubmit, submitted }: {
  game: GameState; nickname: string;
  onSubmit: (val: string | number, doubleDown: boolean) => void; submitted: boolean;
}) {
  const countdown = useCountdown(game.phaseEndsAt);
  const [doubleDown, setDoubleDown] = useState(false);
  const prompt = game.prompt!;
  const totalTime = game.phase2Duration;
  const frozenSecs = game.paused ? (game.pausedTimeRemaining ?? 0) / 1000 : countdown;
  const displaySecs = Math.ceil(frozenSecs);
  const canDoubleDown = !(game.doubleDownUsed ?? []).includes(nickname);

  function handleSubmit(val: string | number) { onSubmit(val, doubleDown); }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-6 text-center px-6 py-10">
        <div className="w-20 h-20 bg-[#7862FF] rounded-full flex items-center justify-center text-white text-4xl">✓</div>
        <p className="text-white text-2xl font-bold">Prediction locked!</p>
        {doubleDown && <p className={`${t.textYellow} text-lg font-bold`}>Double Down active</p>}
        <p className={`${t.textMuted} text-lg`}>Waiting for reveal...</p>
        <div className="w-full mt-4">
          <TimerBar secs={countdown} total={totalTime} color="bg-[#4dd9d2]" />
          <p className={`${t.textFaint} text-xl mt-2 text-center font-mono`}>{displaySecs}s left</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-5 py-6">
      <div>
        <p className={`${t.textYellow} text-base font-bold uppercase tracking-widest mb-2`}>What did the room say?</p>
        <p className="text-white text-2xl font-bold leading-snug">{prompt.text}</p>
      </div>
      <div>
        <TimerBar secs={frozenSecs} total={totalTime} color="bg-[#4dd9d2]" />
        <p className={`text-base mt-1 text-right ${game.paused ? `${t.textYellow} animate-pulse` : t.textFaint}`}>
          {game.paused ? `⏸ ${displaySecs}s` : `${displaySecs}s`}
        </p>
      </div>
      {prompt.type === "binary" && (
        <div className="flex flex-col gap-4">
          <BinaryPrediction N={game.phase1AnsweredCount || game.N} onSubmit={(v) => handleSubmit(v)} disabled={submitted} />
          {canDoubleDown && <DoubleDownToggle active={doubleDown} onToggle={() => setDoubleDown((d) => !d)} disabled={submitted} />}
        </div>
      )}
      {prompt.type === "multiple_choice" && (
        <div className="flex flex-col gap-4">
          <MultipleChoicePrediction options={prompt.options!} onSubmit={(v) => handleSubmit(v)} disabled={submitted} />
          {canDoubleDown && <DoubleDownToggle active={doubleDown} onToggle={() => setDoubleDown((d) => !d)} disabled={submitted} />}
        </div>
      )}
      {prompt.type === "scale" && (
        <div className="flex flex-col gap-4">
          <ScaleInput onSubmit={(v) => handleSubmit(v)} disabled={submitted} step={0.1} min={1} max={10}
            labelLow={prompt.labelLow} labelHigh={prompt.labelHigh} />
          {canDoubleDown && <DoubleDownToggle active={doubleDown} onToggle={() => setDoubleDown((d) => !d)} disabled={submitted} />}
        </div>
      )}
    </div>
  );
}

// ---- Phase 3 view ----
function Phase3View({ game, nickname }: { game: GameState; nickname: string }) {
  const result = game.roundResult;
  if (!result) return <div className={`${t.textMuted} text-center p-8 text-lg`}>Loading results...</div>;
  const binaryN = game.phase1AnsweredCount || game.N;

  const myScore = result.scores[nickname] ?? 0;
  const myPrediction = result.phase2Predictions[nickname];
  const doubled = result.phase2Wagers[nickname] ?? false;
  const prompt = result.prompt;

  let baseScore = myScore;
  if (doubled && myScore > 0) baseScore = myScore / 2;
  if (doubled && myScore === 0) baseScore = 0;

  const perfect = isPerfect(myPrediction, result.actualResult, prompt.type);
  const tier = perfect ? "PERFECT" : tierLabel(baseScore > 0 ? baseScore : myScore);
  const color = perfect ? t.textYellow : tierColor(myScore);

  // Ranking info
  const myEntry = game.leaderboard.find((p) => p.nickname === nickname);
  const myRank = myEntry?.rank ?? 0;
  const personAhead = myRank > 1 ? game.leaderboard[myRank - 2] : null;
  const pointsBehind = personAhead ? personAhead.total - (myEntry?.total ?? 0) : 0;

  return (
    <div className="flex flex-col items-center gap-6 px-5 py-8 text-center">
      <div>
        <p className={`${t.textMuted} text-lg uppercase tracking-widest mb-2`}>Round {game.round} Score</p>
        <p className={`text-8xl font-black ${color}`}>+{myScore}</p>
        <p className={`text-2xl font-bold mt-2 ${color}`}>{tier}</p>
      </div>

      {doubled && (
        <div className={`px-4 py-3 rounded-xl w-full ${myScore > 0 ? "bg-[#f6dc53]/20 border border-[#f6dc53]/30" : "bg-[#9a3558]/20 border border-[#9a3558]/30"}`}>
          {myScore > 0
            ? <p className={`${t.textYellow} font-bold text-lg`}>Double Down PAID OFF! 2× points</p>
            : <p className="text-[#c94f7a] font-bold text-lg">Double Down FAILED — 0 points</p>}
        </div>
      )}

      {/* Ranking message */}
      {myEntry && (
        <div className={`${t.bgSurface} rounded-2xl border ${t.borderSurface} px-5 py-4 w-full`}>
          {myRank === 1 ? (
            <p className={`${t.textYellow} font-bold text-xl`}>🏆 You're in 1st place!</p>
          ) : (
            <div>
              <p className="text-white font-bold text-xl">You're in {ordinal(myRank)} place</p>
              {personAhead && pointsBehind > 0 && (
                <p className={`${t.textMuted} text-base mt-1`}>
                  {pointsBehind} pts behind <span className="text-white font-semibold">{personAhead.nickname}</span>
                </p>
              )}
            </div>
          )}
          <p className={`${t.textMuted} text-base mt-2`}>
            Total: <span className={`${t.textYellow} font-black text-xl`}>{myEntry.total}</span> pts
          </p>
        </div>
      )}

      <div className={`${t.bgSurface} rounded-2xl border ${t.borderSurface} px-5 py-4 w-full text-left`}>
        <p className={`${t.textMuted} text-sm uppercase tracking-widest mb-2`}>Result</p>
        <p className="text-white font-bold text-lg">
          Actual: <span className={t.textYellow}>
            {prompt.type === "binary"
              ? `${result.actualResult} / ${binaryN} said YES`
              : prompt.type === "scale"
              ? `${Number(result.actualResult).toFixed(1)} avg`
              : String(result.actualResult).split("|").join(" & ")}
          </span>
        </p>
        {myPrediction !== undefined && (
          <p className={`${t.textMuted} text-base mt-1`}>
            Your prediction: <span className="text-white font-semibold">
              {prompt.type === "scale" ? Number(myPrediction).toFixed(1) : String(myPrediction)}
            </span>
          </p>
        )}
      </div>

      <p className={`${t.textFaint} text-base animate-pulse`}>Waiting for host to continue...</p>
    </div>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ---- Leaderboard view ----
function LeaderboardView({ game, nickname }: { game: GameState; nickname: string }) {
  const myEntry = game.leaderboard.find((p) => p.nickname === nickname);
  const myRank = myEntry?.rank ?? 0;
  const personAhead = myRank > 1 ? game.leaderboard[myRank - 2] : null;
  const pointsBehind = personAhead ? personAhead.total - (myEntry?.total ?? 0) : 0;

  return (
    <div className="flex flex-col gap-5 px-5 py-6">
      <div className="text-center">
        <p className={`${t.textMuted} text-base uppercase tracking-widest`}>Round {game.round} of {game.totalRounds}</p>
        <h2 className={`text-3xl font-black ${t.textYellow} mt-1`}>Leaderboard</h2>
      </div>

      {myEntry && (
        <div className={`rounded-2xl px-5 py-4 border-2 ${myEntry.rank === 1 ? "border-[#f6dc53] bg-[#f6dc53]/10" : "border-[#7862FF] bg-[#7862FF]/10"}`}>
          <div className="flex items-center gap-4">
            <span className={`text-3xl font-black ${t.textYellow}`}>#{myEntry.rank}</span>
            <div className={`${resolveAvatarColor(nickname, myEntry?.emoji)} w-12 h-12 rounded-full flex items-center justify-center text-2xl`}>
              {resolveEmoji(nickname, myEntry.emoji)}
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-lg">{nickname}</p>
              {myEntry.roundScore > 0 && <p className={`${t.textTeal} text-base font-bold`}>+{myEntry.roundScore} this round</p>}
            </div>
            <p className={`${t.textYellow} font-black text-2xl`}>{myEntry.total}</p>
          </div>
          {myRank === 1 ? (
            <p className={`${t.textYellow} text-base font-semibold mt-2`}>🏆 You're in the lead!</p>
          ) : personAhead && pointsBehind > 0 ? (
            <p className={`${t.textMuted} text-base mt-2`}>
              {pointsBehind} pts behind <span className="text-white font-semibold">{personAhead.nickname}</span>
            </p>
          ) : null}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {game.leaderboard.map((p) => (
          <div key={p.nickname}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 ${p.nickname === nickname ? "bg-[#7862FF]/20 border border-[#7862FF]/30" : `${t.bgSurface} border ${t.borderSurface}`}`}>
            <span className={`${t.textMuted} w-7 font-bold text-base`}>#{p.rank}</span>
            <div className={`${resolveAvatarColor(p.nickname, p.emoji)} w-9 h-9 rounded-full flex items-center justify-center text-xl`}>
              {resolveEmoji(p.nickname, p.emoji)}
            </div>
            <span className="text-white flex-1 font-medium text-base">{p.nickname}</span>
            {p.roundScore > 0 && <span className={`${t.textTeal} text-base font-bold`}>+{p.roundScore}</span>}
            <span className="text-white font-black text-lg">{p.total}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Podium helpers ----
const RANK_STYLE: Record<number, { color: string; label: string; emoji: string; height: string; bg: string }> = {
  1: { color: t.textYellow,       label: "1st", emoji: "🏆", height: "h-40", bg: "bg-[#f6dc53]/20 border border-[#f6dc53]/40" },
  2: { color: t.textMuted,        label: "2nd", emoji: "🥈", height: "h-28", bg: "bg-[#7a96c8]/10 border border-[#7a96c8]/20" },
  3: { color: "text-[#cd853f]",   label: "3rd", emoji: "🥉", height: "h-20", bg: "bg-[#cd853f]/10 border border-[#cd853f]/20" },
};

// ---- Ended view ----
function EndedView({ game, nickname }: { game: GameState; nickname: string }) {
  const lb = game.leaderboard;

  // Players with rank 1–3 go on the podium; rest go in the list
  const podiumPlayers = lb.filter((p) => (p.rank ?? 99) <= 3);
  const restPlayers = lb.filter((p) => (p.rank ?? 99) > 3);

  // Podium: rank-1 center, rank-2 split left/right, rank-3 on the outside
  const rank1 = podiumPlayers.filter((p) => p.rank === 1);
  const rank2 = podiumPlayers.filter((p) => p.rank === 2);
  const rank3 = podiumPlayers.filter((p) => p.rank === 3);

  const tiedFirst = rank1.length >= 2;
  const leftSlot = tiedFirst ? rank1[0] : (rank2[0] ?? null);
  const centerSlot = tiedFirst ? rank1[1] : (rank1[0] ?? null);
  const rightSlot = tiedFirst ? (rank1[2] ?? rank2[0] ?? null) : (rank2[1] ?? rank3[0] ?? null);

  function PodiumSlot({ p }: { p: typeof rank1[0] }) {
    const style = RANK_STYLE[p.rank ?? 1];
    const isMe = p.nickname === nickname;
    return (
      <div className="flex flex-col items-center gap-1 w-full">
        <div className={`${resolveAvatarColor(p.nickname, p.emoji)} w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-lg flex-shrink-0 ${isMe ? "ring-2 ring-white scale-110" : ""}`}>
          {resolveEmoji(p.nickname, p.emoji)}
        </div>
        {isMe ? (
          <p className="text-white font-black text-base text-center w-full px-1">Me</p>
        ) : (
          <p className="text-white text-xs text-center truncate w-full px-1">{p.nickname}</p>
        )}
        <p className={`${style.color} text-sm`}>{p.total} pts</p>
        <div className={`w-full ${style.height} rounded-t-xl flex flex-col items-center justify-start pt-2 gap-0.5 ${style.bg}`}>
          <span className="text-lg">{style.emoji}</span>
          <span className={`${style.color} text-xs`}>{style.label}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-5 py-8">
      <div className="text-center">
        <h2 className={`text-4xl ${t.textYellow}`}>The Consensus</h2>
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-2 mt-2">
        <div className="flex-1 min-w-0">
          {leftSlot && <PodiumSlot p={leftSlot} />}
        </div>
        <div className="flex-1 min-w-0">
          {centerSlot && <PodiumSlot p={centerSlot} />}
        </div>
        <div className="flex-1 min-w-0">
          {rightSlot && <PodiumSlot p={rightSlot} />}
        </div>
      </div>

      {/* Below podium */}
      {restPlayers.length > 0 && (
        <div className="flex flex-col gap-2">
          {restPlayers.map((p) => {
            const isMe = p.nickname === nickname;
            return (
              <div key={p.nickname}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 ${isMe ? "bg-[#7862FF]/20 border border-[#7862FF]/30" : `${t.bgSurface} border ${t.borderSurface}`}`}>
                <span className={`${t.textMuted} w-7 text-base`}>#{p.rank}</span>
                <div className={`${resolveAvatarColor(p.nickname, p.emoji)} w-9 h-9 rounded-full flex items-center justify-center text-xl`}>
                  {resolveEmoji(p.nickname, p.emoji)}
                </div>
                <span className="text-white flex-1 text-base">{p.nickname}</span>
                <span className="text-white text-lg">{p.total}</span>
              </div>
            );
          })}
        </div>
      )}

      <p className={`${t.textFaint} text-base text-center animate-pulse`}>Waiting for host...</p>
    </div>
  );
}

// ---- Question Submission View ----
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

function PlayerCountdownScreen() {
  const [step, setStep] = useState<"rules0" | "rules1" | "rules2" | "rules_out" | "tagline">("rules0");

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep("rules1"),    5000),
      setTimeout(() => setStep("rules2"),    10000),
      setTimeout(() => setStep("rules_out"), 15000),
      setTimeout(() => setStep("tagline"),   15400),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const ruleIndex = step === "rules0" ? 0 : step === "rules1" ? 1 : step === "rules2" ? 2 : null;
  const rule = ruleIndex !== null ? RULES[ruleIndex] : null;
  const isRules = ruleIndex !== null || step === "rules_out";

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6 gap-6 min-h-[70vh]">
      <style>{`
        @keyframes ruleSlideIn {
          0%   { transform: translateY(24px) scale(0.96); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes wordJump {
          0%   { transform: translateY(20px) scale(0.8); opacity: 0; }
          60%  { transform: translateY(-6px) scale(1.15); opacity: 1; }
          80%  { transform: translateY(2px) scale(0.97); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>

      {isRules && rule && (
        <div key={ruleIndex} className="flex flex-col items-center gap-4 w-full"
          style={{ animation: "ruleSlideIn 0.4s ease-out forwards" }}>
          <div className="flex gap-2 mb-1">
            {RULES.map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full transition-all duration-300"
                style={{ background: i === ruleIndex ? rule.color : "#2a4a8a" }} />
            ))}
          </div>
          <div className="w-full rounded-2xl px-6 py-8 flex flex-col items-center gap-3"
            style={{ background: `${rule.color}18`, border: `2px solid ${rule.color}44` }}>
            <span className="text-5xl">{rule.icon}</span>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: rule.color }}>{rule.label}</p>
            <p className="text-3xl" style={{ lineHeight: 1.1 }}>
              <JumpWord key={`${ruleIndex}-title`} word={rule.title} color="white" delay={200} />
            </p>
            <p className="text-base text-[#a8c0e8] leading-snug">{rule.body}</p>
          </div>
        </div>
      )}

      {step === "tagline" && (
        <div className="flex flex-col items-center gap-4" style={{ animation: "ruleSlideIn 0.4s ease-out forwards" }}>
          <span className="text-6xl">🎯</span>
          <p className="text-3xl font-black text-white text-center leading-tight">
            Ready to read<br />the room?
          </p>
          <p className={`${t.textMuted} text-lg animate-pulse`}>Game starting now!</p>
        </div>
      )}
    </div>
  );
}

function QuestionSubmissionView({ onSubmit, isFull }: { onSubmit: (q: { text: string; questionType: "binary" | "multiple_choice" | "scale"; options?: string[]; labelLow?: string; labelHigh?: string }) => void; isFull: boolean }) {
  const [qType, setQType] = useState<"binary" | "multiple_choice" | "scale">("binary");
  const [qText, setQText] = useState("");
  const [qOptions, setQOptions] = useState<[string, string, string, string]>(["", "", "", ""]);
  const [qLabelLow, setQLabelLow] = useState("");
  const [qLabelHigh, setQLabelHigh] = useState("");
  const [submittedCount, setSubmittedCount] = useState(0);
  const [flashSuccess, setFlashSuccess] = useState(false);

  const typeDescriptions: Record<string, string> = {
    binary: "Players answer Yes or No",
    scale: "Players rate from 1 to 10",
    multiple_choice: "Players choose one of four options",
  };

  const trimmedOptions = qOptions.map((o) => o.trim());
  const hasDuplicateMC = qType === "multiple_choice" && trimmedOptions.some((o, i) => o.length > 0 && trimmedOptions.indexOf(o) !== i);
  const isValid = qText.trim().length > 0 && (qType !== "multiple_choice" || (qOptions.every((o) => o.trim().length > 0) && !hasDuplicateMC));

  function handleSubmit() {
    if (!isValid) return;
    const payload: Parameters<typeof onSubmit>[0] = { text: qText.trim(), questionType: qType };
    if (qType === "multiple_choice") payload.options = qOptions.map((o) => o.trim());
    if (qType === "scale") {
      if (qLabelLow.trim()) payload.labelLow = qLabelLow.trim();
      if (qLabelHigh.trim()) payload.labelHigh = qLabelHigh.trim();
    }
    onSubmit(payload);
    setSubmittedCount((c) => c + 1);
    setFlashSuccess(true);
    setQText("");
    setQOptions(["", "", "", ""]);
    setQLabelLow("");
    setQLabelHigh("");
    setTimeout(() => setFlashSuccess(false), 2000);
  }

  return (
    <div className="flex flex-col gap-5 px-5 py-6">
      <div className="text-center">
        <p className={`${t.textCyan} text-xl uppercase tracking-widest mb-1`}>Submit a Question</p>
        <p className={`${t.textMuted} text-base`}>Help build the question pool for this round!</p>
      </div>

      {/* Type selector */}
      <div className="flex flex-col gap-2">
        <p className={`${t.textMuted} text-sm uppercase tracking-widest`}>Question Type</p>
        <div className="flex gap-2">
          {(["binary", "scale", "multiple_choice"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setQType(type)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                qType === type ? "bg-[#7862FF] text-white" : `${t.btnGhost} ${t.textMuted}`
              }`}
            >
              {type === "binary" ? "Yes/No" : type === "scale" ? "Scale" : "Multi"}
            </button>
          ))}
        </div>
        <p className={`${t.textFaint} text-sm`}>{typeDescriptions[qType]}</p>
      </div>

      {/* Question text */}
      <div className="flex flex-col gap-2">
        <p className={`${t.textMuted} text-sm uppercase tracking-widest`}>Question</p>
        <input
          type="text"
          value={qText}
          onChange={(e) => setQText(e.target.value)}
          placeholder={qType === "binary" ? "Have you drank soda today?" : qType === "scale" ? "How much do you like EDM?" : "What's your favorite pizza topping?"}
          maxLength={60}
          className={`w-full px-4 py-3 rounded-xl bg-[#0f2660] border border-[#2a4a8a] text-white text-base placeholder:italic placeholder:text-[#3a5a9a] outline-none focus:border-[#7862FF]`}
        />
      </div>

      {/* Scale labels */}
      {qType === "scale" && (
        <div className="flex flex-col gap-2">
          <p className={`${t.textMuted} text-sm uppercase tracking-widest`}>Labels (optional)</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={qLabelLow}
              onChange={(e) => setQLabelLow(e.target.value)}
              placeholder="Not at all"
              maxLength={10}
              className={`w-full px-3 py-2 rounded-xl bg-[#0f2660] border border-[#2a4a8a] text-white text-sm placeholder:italic placeholder:text-[#3a5a9a] outline-none focus:border-[#7862FF]`}
            />
            <input
              type="text"
              value={qLabelHigh}
              onChange={(e) => setQLabelHigh(e.target.value)}
              placeholder="My favorite"
              maxLength={10}
              className={`w-full px-3 py-2 rounded-xl bg-[#0f2660] border border-[#2a4a8a] text-white text-sm placeholder:italic placeholder:text-[#3a5a9a] outline-none focus:border-[#7862FF]`}
            />
          </div>
        </div>
      )}

      {/* MC options */}
      {qType === "multiple_choice" && (
        <div className="flex flex-col gap-2">
          <p className={`${t.textMuted} text-sm uppercase tracking-widest`}>Options</p>
          {qOptions.map((opt, i) => {
            const mcPlaceholders = ["Pepperoni", "Green pepper", "Onion", "Pineapple"];
            const isDupe = opt.trim().length > 0 && trimmedOptions.indexOf(opt.trim()) !== i;
            return (
              <div key={i} className="flex items-center gap-2">
                <span className={`${t.textMuted} text-sm font-bold w-4 shrink-0`}>{String.fromCharCode(65 + i)}</span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const next = [...qOptions] as [string, string, string, string];
                    next[i] = e.target.value;
                    setQOptions(next);
                  }}
                  placeholder={mcPlaceholders[i]}
                  maxLength={15}
                  className={`flex-1 min-w-0 px-3 py-2 rounded-xl bg-[#0f2660] border text-white text-sm placeholder:italic placeholder:text-[#3a5a9a] outline-none focus:border-[#7862FF] ${isDupe ? "border-[#c94f7a]" : "border-[#2a4a8a]"}`}
                />
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!isValid || isFull}
        className={`w-full py-5 rounded-2xl ${t.btnYellow} text-xl font-black shadow-xl disabled:opacity-40`}
      >
        {isFull ? "Question limit reached" : "Submit Question"}
      </button>

      {submittedCount > 0 && (
        <p className={`${t.textMuted} text-base text-center`}>
          You&apos;ve submitted <span className="text-white font-bold">{submittedCount}</span> question{submittedCount === 1 ? "" : "s"} — submit more!
        </p>
      )}

      {flashSuccess && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 justify-center bg-[#25a59f] text-white px-6 py-3 rounded-2xl shadow-xl z-50 pointer-events-none">
          <span className="text-xl">✓</span>
          <p className="font-bold">Question submitted!</p>
        </div>
      )}
    </div>
  );
}

// ---- Leave Game Menu ----
function LeaveGameMenu({ onClose, onLeave }: { onClose: () => void; onLeave: () => void }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-30" onClick={onClose} />
      <div className={`fixed top-0 right-0 h-full w-72 ${t.bgSurface} border-l ${t.borderSurface} z-40 flex flex-col shadow-2xl`}>
        <div className={`flex items-center justify-between px-6 py-5 border-b ${t.borderSurface}`}>
          <h2 className="text-white font-black text-xl">Menu</h2>
          <button onClick={onClose} className={`${t.textMuted} hover:text-white text-2xl font-bold transition-colors`}>✕</button>
        </div>
        <div className="flex flex-col gap-3 p-6">
          {!confirming ? (
            <button onClick={() => setConfirming(true)} className={`w-full py-4 rounded-xl ${t.btnDanger} font-bold text-lg`}>
              Leave Game
            </button>
          ) : (
            <>
              <div className="bg-[#f6dc53]/10 border border-[#f6dc53]/30 rounded-xl p-4 mb-2">
                <p className={`${t.textYellow} font-bold text-lg mb-1`}>Leave this game?</p>
                <p className={`${t.textMuted} text-base`}>Your score will be lost.</p>
              </div>
              <button onClick={onLeave} className={`w-full py-4 rounded-xl ${t.btnYellow} text-lg`}>Leave</button>
              <button onClick={() => setConfirming(false)} className={`w-full py-3 rounded-xl ${t.btnGhost} font-semibold text-base`}>Cancel</button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ---- Game Over Intro (player screen) ----
function GameOverIntroPlayer({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<"gameover" | "crossfade" | "consensus" | "fadeout">("gameover");

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep("crossfade"), 2000),
      setTimeout(() => setStep("consensus"), 2500),
      setTimeout(() => setStep("fadeout"), 4500),
      setTimeout(() => onDone(), 5000),
    ];
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showGameOver = step === "gameover";
  const showConsensus = step === "consensus";

  return (
    <div
      className={`absolute inset-0 z-20 flex flex-col items-center justify-center ${t.bgPage} transition-opacity duration-500`}
      style={{ opacity: step === "fadeout" ? 0 : 1 }}
    >
      <div
        className="flex flex-col items-center gap-4 text-center transition-all duration-500"
        style={{ opacity: showGameOver ? 1 : 0, transform: showGameOver ? "translateY(0)" : "translateY(-12px)" }}
      >
        <p className="text-6xl">🏆</p>
        <p className={`text-4xl font-black ${t.textYellow}`}>Game Over!</p>
      </div>
      <div
        className="absolute flex flex-col items-center gap-4 text-center transition-all duration-500"
        style={{ opacity: showConsensus ? 1 : 0, transform: showConsensus ? "translateY(0)" : "translateY(16px)" }}
      >
        <p className="text-5xl">🤔</p>
        <p className={`text-3xl font-black text-white text-center px-6`}>Who figured out the consensus?</p>
      </div>
    </div>
  );
}

// ---- Main page ----
const PLAYER_SESSION_KEY = "consensus_player_session";

function PlayGameContent() {
  const params = useParams();
  const router = useRouter();
  const roomCode = (params.roomCode as string).toUpperCase();

  const nickname = (() => {
    if (typeof window === "undefined") return "";
    try {
      const saved = localStorage.getItem(PLAYER_SESSION_KEY);
      if (saved) {
        const session = JSON.parse(saved) as { roomCode: string; nickname: string };
        if (session.roomCode === roomCode) return session.nickname;
      }
    } catch { /* ignore */ }
    return "";
  })();

  const [phase1Submitted, setPhase1Submitted] = useState(false);
  const [phase2Submitted, setPhase2Submitted] = useState(false);
  const lastRoundRef = useRef<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [kicked, setKicked] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [duplicateTab, setDuplicateTab] = useState(false);
  const removedByHostRef = useRef(false);
  const [showGameOverIntro, setShowGameOverIntro] = useState(false);
  const [endedVisible, setEndedVisible] = useState(false);
  const prevPhaseRef = useRef<string | null>(null);

  const { sendMsg, gameState, lobbyState } = useParty(
    roomCode,
    () => { if (nickname) sendMsg({ type: "rejoin", nickname }); },
    (msg) => {
      if (msg.type === "kicked") {
        removedByHostRef.current = true;
        setKicked(true);
      }
      if (msg.type === "disbanded") {
        removedByHostRef.current = true;
        localStorage.removeItem(PLAYER_SESSION_KEY);
        setNotification("The host ended the game.");
        setTimeout(() => router.push("/"), 2500);
      }
      if (msg.type === "duplicate_tab") {
        removedByHostRef.current = true;
        setDuplicateTab(true);
      }
    },
  );


  // Wake lock: prevent screen dim from killing the WebSocket
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    async function requestWakeLock() {
      try {
        if ("wakeLock" in navigator) wakeLock = await navigator.wakeLock.request("screen");
      } catch { /* not supported or denied */ }
    }
    requestWakeLock();
    function onVisibilityChange() {
      if (document.visibilityState === "visible") requestWakeLock();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      wakeLock?.release();
    };
  }, []);

  const phase = gameState?.phase ?? "lobby";

  // Game-over intro animation
  useEffect(() => {
    const prev = prevPhaseRef.current;
    const curr = gameState?.phase ?? null;
    if (curr === "ended") {
      if (prev === null) {
        setEndedVisible(true); // already ended on load (e.g. refresh)
      } else if (prev !== "ended") {
        setShowGameOverIntro(true);
        setEndedVisible(false);
      }
    }
    prevPhaseRef.current = curr;
  }, [gameState?.phase]);

  useEffect(() => {
    if (gameState && gameState.round !== lastRoundRef.current) {
      lastRoundRef.current = gameState.round;
      setPhase1Submitted(false);
      setPhase2Submitted(false);
    }
  }, [gameState?.round]);

  useEffect(() => {
    if (lobbyState && !lobbyState.locked && phase === "lobby") {
      router.replace(`/play/${roomCode}`);
    }
  }, [lobbyState, phase, router, roomCode]);

  function handleAnswerSubmit(val: string | number) {
    sendMsg({ type: "submit_answer", answer: val });
    setPhase1Submitted(true);
  }

  function handlePredictionSubmit(val: string | number, doubleDown: boolean) {
    sendMsg({ type: "submit_prediction", prediction: val, doubleDown });
    setPhase2Submitted(true);
  }

  function handleLeave() {
    localStorage.removeItem(PLAYER_SESSION_KEY);
    router.push("/");
  }

  if (kicked) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${t.bgPage} text-white gap-6 px-6 text-center`}>
        <div className="text-6xl">🚫</div>
        <h2 className="text-3xl font-black text-[#c94f7a]">You were removed</h2>
        <p className={`${t.textMuted} text-lg`}>The host removed you from the game.</p>
        <button onClick={() => { localStorage.removeItem(PLAYER_SESSION_KEY); router.push("/"); }}
          className={`px-6 py-3 rounded-xl ${t.btnYellow} text-lg`}>
          Back to Home
        </button>
      </div>
    );
  }

  if (duplicateTab) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${t.bgPage} text-white gap-6 px-6 text-center`}>
        <div className="text-6xl">🪟</div>
        <h2 className="text-3xl font-black text-[#c94f7a]">Already Open</h2>
        <p className={`${t.textMuted} text-lg`}>This game is already open in another tab.</p>
        <p className={`${t.textFaint} text-base`}>Close this tab and continue in the other one.</p>
      </div>
    );
  }

  if (notification) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${t.bgPage} text-white gap-6 px-6 text-center`}>
        <div className="text-6xl">📺</div>
        <h2 className="text-3xl font-black text-white">{notification}</h2>
        <p className={`${t.textMuted} text-lg`}>Returning to home...</p>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${t.bgPage} text-white gap-4`}>
        <p className={`${t.textYellow} text-2xl font-black animate-pulse`}>Game loading...</p>
      </div>
    );
  }

  if (!nickname) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${t.bgPage} text-white gap-4 px-6`}>
        <p className={`${t.textMuted} text-lg`}>Session not found — please rejoin.</p>
        <button onClick={() => router.replace(`/play/${roomCode}`)} className={`px-5 py-3 ${t.btnYellow} rounded-xl text-lg`}>
          Rejoin
        </button>
      </div>
    );
  }

  const answeredCount = gameState?.answeredCount ?? 0;
  const N = gameState?.N ?? 0;
  const myTotal = gameState.leaderboard.find((p) => p.nickname === nickname)?.total ?? 0;
  const myLobbyEmoji = lobbyState?.players.find((p) => p.nickname === nickname)?.emoji;

  const phaseBg = phase === "phase1" ? t.bgPhase1 : phase === "phase2" ? t.bgPhase2 : t.bgPage;
  const phaseTopBar = phase === "phase1" ? `${t.bgPhase1} border-[#3a4a9a]` : phase === "phase2" ? `${t.bgPhase2} border-[#1a6060]` : `${t.bgPage} border-[#2a4a8a]`;

  return (
    <main className={`min-h-screen ${phaseBg} text-white transition-colors duration-500`}>
      {/* Top bar */}
      <div className={`flex items-center justify-between px-4 py-3 border-b sticky top-0 z-10 transition-colors duration-500 ${phaseTopBar}`}>
        <div className="flex items-center gap-2">
          <div className={`${resolveAvatarColor(nickname, myLobbyEmoji)} w-9 h-9 rounded-full flex items-center justify-center text-lg`}>
            {resolveEmoji(nickname, myLobbyEmoji)}
          </div>
          <span className="text-white font-semibold text-sm">{nickname}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className={`${t.textYellow} font-black text-base font-mono tracking-widest`}>{roomCode}</span>
          <span className={`${t.textFaint} text-xs`}>{phase === "question_submission" ? "Collecting Questions" : `Round ${gameState.round}/${gameState.totalRounds}`}</span>
        </div>
        <div className="flex items-center gap-2">
          <p className={`${t.textTeal} font-black text-sm`}>{myTotal} pts</p>
          <button onClick={() => setMenuOpen(true)}
            className={`px-3 py-1.5 rounded-lg ${t.btnGhost} font-bold text-lg leading-none`}>☰</button>
        </div>
      </div>

      {/* Phase banner */}
      {(phase === "phase1" || phase === "phase2") && (
        <div className={`w-full text-center py-3 text-2xl font-black uppercase tracking-widest transition-colors duration-500 ${phase === "phase1" ? "bg-[#7862FF]/20 text-[#a99dff]" : "bg-[#25a59f]/25 text-[#4dd9d2]"}`}>
          {phase === "phase1" ? "Phase 1 — Answer" : "Phase 2 — Predict"}
        </div>
      )}

      {/* Content — mobile-width constrained */}
      <div className="pb-8 max-w-md mx-auto w-full">
        {phase === "question_submission" && (
          <QuestionSubmissionView
            onSubmit={(q) => sendMsg({ type: "submit_question", text: q.text, questionType: q.questionType, options: q.options, labelLow: q.labelLow, labelHigh: q.labelHigh })}
            isFull={(gameState.submittedQuestionCount ?? 0) >= gameState.totalRounds}
          />
        )}
        {phase === "phase1" && (
          <Phase1View game={gameState} nickname={nickname} onSubmit={handleAnswerSubmit} submitted={phase1Submitted} />
        )}
        {phase === "phase2" && (
          phase1Submitted
            ? <Phase2View game={gameState} nickname={nickname} onSubmit={handlePredictionSubmit} submitted={phase2Submitted} />
            : (
              <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center px-6 py-16">
                <div className="w-20 h-20 bg-[#9a3558]/30 rounded-full flex items-center justify-center text-4xl">⏱</div>
                <p className="text-white text-2xl font-bold">You missed this round</p>
                <p className={`${t.textMuted} text-lg`}>Answer in time to earn points</p>
              </div>
            )
        )}
        {phase === "phase3" && <Phase3View game={gameState} nickname={nickname} />}
        {phase === "leaderboard" && <LeaderboardView game={gameState} nickname={nickname} />}
        {phase === "ended" && showGameOverIntro && (
          <GameOverIntroPlayer onDone={() => { setShowGameOverIntro(false); setEndedVisible(true); }} />
        )}
        {phase === "ended" && endedVisible && <EndedView game={gameState} nickname={nickname} />}
        {phase === "lobby" && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6 gap-4">
            <span className="text-6xl">⏳</span>
            <p className={`${t.textYellow} text-3xl font-black animate-pulse`}>Waiting to start...</p>
          </div>
        )}
        {phase === "countdown" && <PlayerCountdownScreen />}
      </div>

      {/* Answered count badge */}
      {(phase === "phase1" || phase === "phase2") && (
        <div className={`fixed bottom-6 left-6 ${t.bgSurface}/80 backdrop-blur text-white px-4 py-2 rounded-full text-base font-semibold z-20 border ${t.borderSurface}`}>
          {answeredCount} / {N} answered
        </div>
      )}

      {menuOpen && <LeaveGameMenu onClose={() => setMenuOpen(false)} onLeave={handleLeave} />}
    </main>
  );
}

export default function PlayGamePage() {
  return (
    <Suspense fallback={
      <main className={`min-h-screen ${t.bgPage} flex items-center justify-center`}>
        <div className={`${t.textMuted} text-lg animate-pulse`}>Loading...</div>
      </main>
    }>
      <PlayGameContent />
    </Suspense>
  );
}
