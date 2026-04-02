"use client";

import { useEffect, useState } from "react";
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
      <span className={`text-white font-bold text-xl w-44 text-right shrink-0 ${isWinner ? t.textTeal : ""}`}>
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
  const N = game.N;

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
      {result.chaosBonusAwarded && (
        <div className="bg-[#25a59f]/20 border border-[#25a59f]/30 rounded-2xl px-5 py-3">
          <p className={`${t.textTeal} font-black text-lg`}>CHAOS BONUS!</p>
          <p className="text-[#7a96c8] text-sm">+200 pts everyone</p>
        </div>
      )}
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

function EndedView({ game }: { game: GameState }) {
  const lb = game.leaderboard;
  const podium = lb.slice(0, 3);
  const rest = lb.slice(3, 10);
  const podiumOrder = [podium[1], podium[0], podium[2]].filter(Boolean); // 2nd, 1st, 3rd
  const podiumHeights = ["h-32", "h-48", "h-24"];
  const podiumColors = ["text-[#7a96c8]", t.textYellow, "text-[#cd853f]"];
  const podiumEmojis = ["🥈", "🏆", "🥉"];
  const podiumLabels = ["2nd", "1st", "3rd"];

  return (
    <div className="flex flex-col flex-1 px-16 py-6 gap-6">
      <div className="text-center">
        <p className={`${t.textTeal} text-2xl uppercase tracking-widest mb-1`}>Game Over</p>
        <h2 className={`text-6xl text-white`}>CONSENSUS</h2>
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-6 mt-2">
        {podiumOrder.map((p, i) => (
          <div key={p.nickname} className="flex flex-col items-center gap-2" style={{ width: 180 }}>
            <div className={`${avatarColor(p.nickname)} w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-xl`}>
              {playerEmoji(p.nickname)}
            </div>
            <p className={`text-white text-xl text-center truncate w-full px-1`}>{p.nickname}</p>
            <p className={`${podiumColors[i]} text-lg`}>{p.total} pts</p>
            <div className={`w-full ${podiumHeights[i]} rounded-t-2xl flex flex-col items-center justify-start pt-3 gap-1 ${
              i === 1 ? "bg-[#f6dc53]/20 border border-[#f6dc53]/40" :
              i === 0 ? "bg-[#7a96c8]/10 border border-[#7a96c8]/20" :
              "bg-[#cd853f]/10 border border-[#cd853f]/20"
            }`}>
              <span className="text-3xl">{podiumEmojis[i]}</span>
              <span className={`${podiumColors[i]} text-lg`}>{podiumLabels[i]}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 4th–10th */}
      {rest.length > 0 && (
        <div className="flex flex-col gap-2 max-w-2xl mx-auto w-full">
          {rest.map((p) => (
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
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#7862FF]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#25a59f]/5 rounded-full blur-3xl" />
      </div>

      {/* Top bar */}
      <div className={`relative z-10 flex items-center justify-between px-10 pt-6 pb-4 border-b border-[#2a4a8a]`}>
        <div>
          <h1 className={`text-2xl font-black text-white tracking-tight`}>CONSENSUS</h1>
          <p className={`${t.textCyan} text-xs tracking-widest`}>Wisdom of the Crowds</p>
        </div>
        {gameState && (
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className={`${t.textFaint} text-sm uppercase tracking-widest`}>Round</p>
              <p className="text-white font-black text-3xl leading-tight">{gameState.round}<span className={`${t.textFaint} text-xl`}> / {gameState.totalRounds}</span></p>
            </div>
            <div className="text-center">
              <p className={`${t.textFaint} text-sm uppercase tracking-widest`}>Room</p>
              <p className="text-white font-black text-3xl font-mono leading-tight">{roomCode}</p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1">
        {!gameState || phase === "lobby" ? (
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
          <EndedView game={gameState} />
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
