"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { t, avatarColor, resolveAvatarColor, resolveEmoji } from "@/lib/theme";
import type { RoundResult, PlayerScore } from "@/lib/types";

type SummaryData = {
  rounds: RoundResult[];
  leaderboard: PlayerScore[];
};

function typeLabel(type: string) {
  if (type === "binary") return "YES / NO";
  if (type === "multiple_choice") return "MULTIPLE CHOICE";
  return "SCALE 1–10";
}

function typeColor(type: string) {
  if (type === "binary") return t.textCyan;
  if (type === "multiple_choice") return t.textPrimary;
  return t.textTeal;
}

function formatAnswer(answer: string | number, type: string): string {
  if (type === "binary") return Number(answer) === 1 ? "YES" : "NO";
  return String(answer);
}

function formatActual(actual: string | number, type: string, N: number): string {
  if (type === "binary") return `${actual} / ${N} said YES`;
  if (type === "scale") return `avg ${Number(actual).toFixed(1)}`;
  return String(actual);
}

export default function HostSummaryPage() {
  const params = useParams();
  const roomCode = (params.roomCode as string).toUpperCase();
  const router = useRouter();
  const [data, setData] = useState<SummaryData | null>(null);
  const [expandedRound, setExpandedRound] = useState<number | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(`${roomCode}_summary`);
    if (raw) {
      try { setData(JSON.parse(raw)); } catch { /* ignore */ }
    }
  }, [roomCode]);

  if (!data) {
    return (
      <main className={`min-h-screen ${t.bgPage} flex flex-col items-center justify-center px-4`}>
        <div className={`${t.bgSurface} border ${t.borderSurface} rounded-2xl p-10 text-center max-w-md`}>
          <p className="text-4xl mb-4">📊</p>
          <p className="text-white text-xl font-bold mb-2">No summary available</p>
          <p className={`${t.textMuted} text-base mb-6`}>Summary is only available right after a game ends.</p>
          <button onClick={() => router.push("/")} className={`w-full py-3 rounded-xl ${t.btnGhost}`}>
            Go Home
          </button>
        </div>
      </main>
    );
  }

  const players = data.leaderboard;

  return (
    <main className={`min-h-screen ${t.bgPage} px-4 py-8`}>
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className={`${t.textMuted} text-base mb-6 hover:text-white transition-colors flex items-center gap-2`}
        >
          ← Back
        </button>

        <div className="mb-8">
          <p className={`${t.textMuted} text-xs uppercase tracking-widest`}>Host Dashboard</p>
          <h1 className={`text-4xl font-black text-white`}>Game Summary</h1>
          <p className={`${t.textYellow} font-mono font-bold text-xl`}>{roomCode}</p>
        </div>

        {/* Final Leaderboard */}
        <h2 className={`${t.textMuted} text-xs uppercase tracking-widest mb-3`}>Final Standings</h2>
        <div className={`${t.bgSurface} border ${t.borderSurface} rounded-2xl overflow-hidden mb-8`}>
          {players.map((p, i) => (
            <div
              key={p.nickname}
              className={`flex items-center gap-4 px-5 py-3 ${i < players.length - 1 ? `border-b ${t.borderSurface}` : ""}`}
            >
              <span className={`font-black text-lg w-7 ${p.rank === 1 ? t.textYellow : t.textMuted}`}>#{p.rank}</span>
              <div className={`${resolveAvatarColor(p.nickname, p.emoji)} w-9 h-9 rounded-full flex items-center justify-center text-xl shrink-0`}>
                {resolveEmoji(p.nickname, p.emoji)}
              </div>
              <span className="text-white font-semibold flex-1 truncate">{p.nickname}</span>
              <span className={`${p.rank === 1 ? t.textYellow : "text-white"} font-black text-lg`}>{p.total} pts</span>
            </div>
          ))}
        </div>

        {/* Round-by-round breakdown */}
        <h2 className={`${t.textMuted} text-xs uppercase tracking-widest mb-3`}>Round Breakdown</h2>
        <div className="flex flex-col gap-3 mb-8">
          {data.rounds.map((round, idx) => {
            const isExpanded = expandedRound === idx;
            const topScorer = Object.entries(round.scores).sort(([, a], [, b]) => b - a)[0];
            return (
              <div key={idx} className={`${t.bgSurface} border ${t.borderSurface} rounded-2xl overflow-hidden`}>
                <button
                  className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-[#1a3580] transition-colors"
                  onClick={() => setExpandedRound(isExpanded ? null : idx)}
                >
                  <span className={`${t.textMuted} font-bold text-base w-5 shrink-0 mt-0.5`}>{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`${typeColor(round.prompt.type)} text-xs font-bold uppercase tracking-widest mb-0.5`}>
                      {typeLabel(round.prompt.type)}
                    </p>
                    <p className="text-white font-semibold text-base leading-snug truncate">{round.prompt.text}</p>
                    <p className={`${t.textFaint} text-sm mt-1`}>
                      Result: <span className="text-white font-semibold">
                        {formatActual(round.actualResult, round.prompt.type, Object.keys(round.phase1Answers).length)}
                      </span>
                    </p>
                  </div>
                  <span className={`${t.textFaint} text-lg shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}>›</span>
                </button>

                {isExpanded && (
                  <div className={`border-t ${t.borderSurface}`}>
                    {/* Player details */}
                    <div className="px-5 py-3 flex flex-col gap-2">
                      {players.map((p) => {
                        const ans = round.phase1Answers[p.nickname];
                        const pred = round.phase2Predictions[p.nickname];
                        const wager = round.phase2Wagers[p.nickname];
                        const pts = round.scores[p.nickname] ?? 0;
                        const didAnswer = ans !== undefined;
                        const didPredict = pred !== undefined;
                        return (
                          <div key={p.nickname} className={`flex items-center gap-3 py-2 border-b ${t.borderSurface} last:border-0`}>
                            <div className={`${resolveAvatarColor(p.nickname, p.emoji)} w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0`}>
                              {resolveEmoji(p.nickname, p.emoji)}
                            </div>
                            <span className={`text-white font-medium text-sm flex-1 truncate`}>{p.nickname}</span>
                            {didAnswer ? (
                              <span className={`${t.textMuted} text-xs`}>
                                answered <span className="text-white font-semibold">{formatAnswer(ans, round.prompt.type)}</span>
                              </span>
                            ) : (
                              <span className={`${t.textFaint} text-xs`}>–</span>
                            )}
                            {didPredict && (
                              <span className={`${t.textMuted} text-xs ml-2`}>
                                predicted <span className="text-white font-semibold">{String(pred)}</span>
                                {wager && <span className={`${t.textYellow} font-bold ml-1`}>⚡2×</span>}
                              </span>
                            )}
                            <span className={`font-black text-sm ml-2 w-14 text-right ${pts > 0 ? t.textTeal : t.textFaint}`}>
                              {pts > 0 ? `+${pts}` : "—"}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Top scorer for round */}
                    {topScorer && topScorer[1] > 0 && (
                      <div className={`px-5 py-3 bg-[#f6dc53]/5 border-t ${t.borderSurface} flex items-center gap-2`}>
                        <span className="text-base">🏅</span>
                        <span className={`${t.textMuted} text-sm`}>Best prediction:</span>
                        <span className="text-white font-bold text-sm">{topScorer[0]}</span>
                        <span className={`${t.textYellow} font-black text-sm`}>+{topScorer[1]} pts</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => router.push("/")}
          className={`w-full py-4 rounded-2xl ${t.btnYellow} text-xl`}
        >
          Back to Home
        </button>
      </div>
    </main>
  );
}
