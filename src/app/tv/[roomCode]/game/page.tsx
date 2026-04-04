"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useParty } from "@/lib/useParty";
import { t, avatarColor, playerEmoji } from "@/lib/theme";
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
    <div className={`flex items-center gap-4 ${isWinner ? "opacity-100" : "opacity-60"}`}>
      <span className={`text-white font-bold text-xl w-28 text-right shrink-0 ${isWinner ? t.textTeal : ""}`}>
        {label}
      </span>
      <div className="flex-1 relative h-14 bg-[#2a4a8a] rounded-xl overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full ${color} rounded-xl transition-all duration-1000 ease-out`}
          style={{ width: `${width}%` }}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white font-black text-xl z-10">
          {value}{safePct > 0 ? ` (${Math.round(safePct)}%)` : ""}
        </span>
      </div>
      <span className="w-8 text-center text-2xl shrink-0">
        {isWinner ? <span className={t.textTeal}>✓</span> : null}
      </span>
    </div>
  );
}

function GameOverIntro({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<"in" | "sub" | "out">("in");

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep("sub"), 800),
      setTimeout(() => setStep("out"), 2800),
      setTimeout(() => onDone(), 3400),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center ${t.bgPage} transition-opacity duration-600`}
      style={{ opacity: step === "out" ? 0 : 1 }}
    >
      <div
        className="flex flex-col items-center gap-6 transition-all duration-500"
        style={{
          transform: step === "out" ? "scale(0.9) translateY(-30px)" : "scale(1) translateY(0)",
        }}
      >
        <p
          className={`font-black text-white text-center leading-none transition-all duration-500`}
          style={{ fontSize: "7rem", opacity: 1 }}
        >
          Game Over!
        </p>
        <p
          className={`${t.textYellow} font-black text-4xl text-center tracking-wide transition-all duration-500`}
          style={{ opacity: step === "in" ? 0 : 1, transform: step === "in" ? "translateY(16px)" : "translateY(0)" }}
        >
          What&apos;s the Consensus?
        </p>
      </div>
    </div>
  );
}

function CountdownOverlay({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<"tagline_in" | "tagline_out" | "3" | "2" | "1" | "done">("tagline_in");

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep("tagline_out"), 1800),
      setTimeout(() => setStep("3"), 2600),
      setTimeout(() => setStep("2"), 3600),
      setTimeout(() => setStep("1"), 4600),
      setTimeout(() => { setStep("done"); onDone(); }, 5400),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  const isTagline = step === "tagline_in" || step === "tagline_out";
  const digit = step === "3" ? "3" : step === "2" ? "2" : step === "1" ? "1" : null;

  return (
    <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center ${t.bgPage}`}>
      {isTagline && (
        <div
          className="flex flex-col items-center gap-4 transition-all duration-500"
          style={{
            opacity: step === "tagline_in" ? 1 : 0,
            transform: step === "tagline_in" ? "scale(1) translateY(0)" : "scale(0.9) translateY(-20px)",
          }}
        >
          <span className="text-8xl">🎯</span>
          <p className={`text-5xl font-black text-white text-center leading-tight`}>
            Ready to read<br />the room?
          </p>
        </div>
      )}
      {digit && (
        <div
          key={digit}
          className="flex items-center justify-center"
          style={{ animation: "countdownPop 0.9s ease-out forwards" }}
        >
          <span
            className={`font-black leading-none`}
            style={{
              fontSize: "20rem",
              color: digit === "3" ? "#7862FF" : digit === "2" ? "#4dd9d2" : "#f6dc53",
              textShadow: `0 0 80px ${digit === "3" ? "#7862FF88" : digit === "2" ? "#4dd9d288" : "#f6dc5388"}`,
            }}
          >
            {digit}
          </span>
        </div>
      )}
      <style>{`
        @keyframes countdownPop {
          0%   { transform: scale(1.6); opacity: 0; }
          20%  { transform: scale(1.0); opacity: 1; }
          70%  { transform: scale(1.0); opacity: 1; }
          100% { transform: scale(0.7); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function Phase1View({ game }: { game: GameState }) {
  const total = game.phase1Duration;
  const countdown = useCountdown(game.phaseEndsAt);

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-8 px-8 text-center">
      <div className="flex flex-col items-center gap-2">
        <PromptTypeIcon type={game.prompt!.type} />
        <h2 className="text-5xl font-black text-white leading-tight max-w-4xl mt-2">
          {game.prompt!.text}
        </h2>
      </div>

      {game.prompt!.type === "multiple_choice" && (
        <div className="grid grid-cols-2 gap-4 w-full max-w-2xl mt-4">
          {game.prompt!.options!.map((opt, i) => (
            <div key={i} className={`${t.bgSurface} border ${t.borderSurface} rounded-2xl px-6 py-5 text-white text-xl font-semibold text-center`}>
              <span className={`${t.textMuted} font-black mr-2`}>{String.fromCharCode(65 + i)}.</span>
              {opt}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col items-center gap-3 mt-4">
        <CircleTimer secs={countdown} total={total} />
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

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-8 px-8 text-center">
      <div className="flex flex-col items-center gap-2">
        <span className={`${t.textCyan} text-sm font-bold uppercase tracking-widest`}>What did the room say?</span>
        <PromptTypeIcon type={game.prompt!.type} />
        <h2 className="text-5xl font-black text-white leading-tight max-w-4xl mt-2">
          {game.prompt!.text}
        </h2>
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-[#7a96c8] text-xl">Players are predicting...</p>
        <p className={`${t.textMuted} text-base`}>Double Down available on your phone</p>
      </div>

      <CircleTimer secs={countdown} total={total} />
    </div>
  );
}

function Phase3View({ game }: { game: GameState }) {
  const result = game.roundResult!;
  const prompt = result.prompt;
  const N = game.phase1AnsweredCount || game.N;

  if (prompt.type === "binary") {
    const yesCount = Number(result.actualResult);
    const noCount = N - yesCount;
    const yesPct = N > 0 ? (yesCount / N) * 100 : 0;
    const noPct = N > 0 ? (noCount / N) * 100 : 0;

    return (
      <div className="flex flex-col flex-1 items-center px-8 py-8 gap-8">
        <div className="text-center">
          <PromptTypeIcon type="binary" />
          <h2 className="text-4xl font-black text-white mt-2 leading-tight max-w-4xl mx-auto">
            {prompt.text}
          </h2>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto mt-4">
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
    const winners = new Set(String(result.actualResult).split(","));

    return (
      <div className="flex flex-col flex-1 items-center px-8 py-8 gap-8">
        <div className="text-center">
          <PromptTypeIcon type="multiple_choice" />
          <h2 className="text-4xl font-black text-white mt-2 leading-tight max-w-4xl mx-auto">
            {prompt.text}
          </h2>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto mt-4">
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
        <h2 className="text-4xl font-black text-white mt-2 leading-tight max-w-4xl mx-auto">
          {prompt.text}
        </h2>
      </div>

      <div className="max-w-2xl mx-auto w-full mt-4">
        <div className={`flex justify-between ${t.textMuted} text-sm mb-2 px-1`}>
          <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
          <span>6</span><span>7</span><span>8</span><span>9</span><span>10</span>
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
                  {playerEmoji(name)}
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

function LeaderboardView({ game, title }: { game: GameState; title: string }) {
  const board = game.leaderboard;

  return (
    <div className="flex flex-col flex-1 px-16 py-8 gap-6">
      <h2 className={`text-4xl font-black ${t.textCyan} text-center`}>{title}</h2>

      <div className="flex flex-col gap-3 max-w-2xl mx-auto w-full">
        {board.map((player, i) => {
          const isTop = i === 0;
          return (
            <div
              key={player.nickname}
              className={`flex items-center gap-4 rounded-2xl px-6 py-4 transition-all ${
                isTop
                  ? "bg-[#7862FF]/20 border-2 border-[#7862FF]/60"
                  : `${t.bgSurface}/60 border ${t.borderSurface}`
              }`}
            >
              <span className={`font-black text-2xl w-8 ${isTop ? t.textPrimary : t.textMuted}`}>
                #{player.rank}
              </span>
              <div className={`${avatarColor(player.nickname)} w-12 h-12 rounded-full flex items-center justify-center text-2xl`}>
                {playerEmoji(player.nickname)}
              </div>
              <span className={`font-bold text-xl flex-1 ${isTop ? t.textPrimary : "text-white"}`}>
                {player.nickname}
              </span>
              {player.roundScore > 0 && (
                <span className={`${t.textTeal} font-bold text-lg`}>+{player.roundScore}</span>
              )}
              <span className={`font-black text-2xl ${isTop ? t.textPrimary : "text-white"}`}>
                {player.total}
              </span>
            </div>
          );
        })}
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

  const rank2 = podiumPlayers.filter((p) => p.rank === 2);
  const rank1 = podiumPlayers.filter((p) => p.rank === 1);
  const rank3 = podiumPlayers.filter((p) => p.rank === 3);
  const podiumOrder = [...rank2, ...rank1, ...rank3];

  return (
    <div className="flex flex-col flex-1 px-16 py-6 gap-6">
      <div className="text-center">
        <p className={`${t.textTeal} text-2xl uppercase tracking-widest mb-1`}>Game Over</p>
        <h2 className={`text-6xl text-white`}>CONSENSUS</h2>
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-4 mt-2">
        {podiumOrder.map((p) => {
          const style = TV_RANK_STYLE[p.rank ?? 1];
          return (
            <div key={p.nickname} className="flex flex-col items-center gap-2 flex-1 min-w-0 max-w-[160px]">
              <div className={`${avatarColor(p.nickname)} w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-xl flex-shrink-0`}>
                {playerEmoji(p.nickname)}
              </div>
              <p className="text-white text-xl text-center truncate w-full px-1">{p.nickname}</p>
              <p className={`${style.color} text-lg`}>{p.total} pts</p>
              <div className={`w-full ${style.height} rounded-t-2xl flex flex-col items-center justify-start pt-3 gap-1 ${style.bg}`}>
                <span className="text-3xl">{style.emoji}</span>
                <span className={`${style.color} text-lg`}>{style.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Below podium */}
      {restPlayers.length > 0 && (
        <div className="flex flex-col gap-2 max-w-2xl mx-auto w-full">
          {restPlayers.map((p) => (
            <div key={p.nickname} className={`flex items-center gap-4 ${t.bgSurface}/60 rounded-xl px-5 py-3`}>
              <span className={`${t.textMuted} text-xl w-8`}>#{p.rank}</span>
              <div className={`${avatarColor(p.nickname)} w-10 h-10 rounded-full flex items-center justify-center text-xl`}>
                {playerEmoji(p.nickname)}
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
          <p className={`${t.textCyan} text-xs tracking-widest hidden sm:block`}>Wisdom of the Crowds</p>
        </div>
        {gameState && (
          <div className="flex items-center gap-4 sm:gap-8">
            <div className="text-center">
              <p className={`${t.textFaint} text-xs sm:text-sm uppercase tracking-widest`}>Round</p>
              <p className="text-white font-black text-xl xl:text-3xl leading-tight">{gameState.round}<span className={`${t.textFaint} text-base xl:text-xl`}> / {gameState.totalRounds}</span></p>
            </div>
            <div className="text-center">
              <p className={`${t.textFaint} text-xs sm:text-sm uppercase tracking-widest`}>Room</p>
              <p className={`${t.textYellow} font-black text-xl xl:text-3xl font-mono leading-tight`}>{roomCode}</p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1">
        {!gameState || phase === "lobby" || phase === "countdown" ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center">
            <p className={`${t.textTeal} text-3xl font-black animate-pulse`}>Waiting for game to start...</p>
          </div>
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
          {answeredCount} / {N} answered
        </div>
      )}
    </main>
  );
}
