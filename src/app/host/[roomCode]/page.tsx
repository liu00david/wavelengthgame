"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useParty } from "@/lib/useParty";
import { t, avatarColor, playerEmoji } from "@/lib/theme";
import type { Player } from "@/lib/types";

function PlayerAvatar({ player }: { player: Player }) {
  const color = avatarColor(player.nickname);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`${color} w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-lg`}>
        {playerEmoji(player.nickname)}
      </div>
      <span className="text-[#7a96c8] text-base font-medium truncate max-w-[72px]">{player.nickname}</span>
      {player.isHost && <span className={`${t.textYellow} text-sm font-bold -mt-1`}>HOST</span>}
    </div>
  );
}

const HOST_SESSION_KEY = "consensus_host_session";

const QUESTION_OPTIONS = [5, 7, 10, 12, 15];
const TIME_OPTIONS = [15, 20, 25, 30, 45, 60];

function SettingRow({ label, value, options, onChange }: {
  label: string;
  value: number;
  options: number[];
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={`${t.textMuted} text-sm font-medium`}>{label}</span>
      <div className="flex gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
              value === opt
                ? "bg-[#7862FF] text-white"
                : `${t.btnGhost} text-[#7a96c8] text-xs`
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function HostPage() {
  const params = useParams();
  const roomCode = (params.roomCode as string).toUpperCase();
  const router = useRouter();

  // Game settings
  const [numQuestions, setNumQuestions] = useState(10);
  const [phase1Time, setPhase1Time] = useState(25);
  const [phase2Time, setPhase2Time] = useState(20);

  // Menu state
  type MenuState = "closed" | "main" | "kick" | "disband_confirm";
  const [menuState, setMenuState] = useState<MenuState>("closed");

  const { sendMsg, lobbyState, gameState } = useParty(
    roomCode,
    () => {
      console.log("[host] onOpen fired for room", roomCode);
      try {
        const saved = localStorage.getItem(HOST_SESSION_KEY);
        if (saved) {
          const session = JSON.parse(saved) as { roomCode: string };
          if (session.roomCode === roomCode) {
            sendMsg({ type: "rejoin", nickname: "Host" });
            return;
          }
        }
      } catch { /* ignore */ }
      localStorage.setItem(HOST_SESSION_KEY, JSON.stringify({ roomCode }));
      sendMsg({ type: "join", nickname: "Host", isHost: true });
    },
    (msg) => {
      if (msg.type === "room_not_found") {
        localStorage.removeItem(HOST_SESSION_KEY);
        localStorage.setItem(HOST_SESSION_KEY, JSON.stringify({ roomCode }));
        sendMsg({ type: "join", nickname: "Host", isHost: true });
      }
    },
  );

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) { e.preventDefault(); }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (gameState && gameState.phase !== "lobby") {
      router.push(`/host/${roomCode}/game`);
    }
  }, [gameState, roomCode, router]);

  function handleLock() {
    sessionStorage.setItem(`${roomCode}_numQ`, String(numQuestions));
    sessionStorage.setItem(`${roomCode}_p1t`, String(phase1Time));
    sessionStorage.setItem(`${roomCode}_p2t`, String(phase2Time));
    sessionStorage.setItem(`${roomCode}_started`, "1");
    sendMsg({ type: "lock" });
    sendMsg({ type: "start_game", numQuestions, phase1Time, phase2Time });
    router.push(`/host/${roomCode}/game`);
  }

  function handleKick(nickname: string) {
    sendMsg({ type: "kick_player", nickname });
    setMenuState("closed");
  }

  function handleDisband() {
    sendMsg({ type: "disband_room" });
    localStorage.removeItem(HOST_SESSION_KEY);
    router.push("/");
  }

  const players = lobbyState?.players ?? [];
  const nonHostPlayers = players.filter((p) => !p.isHost);

  return (
    <main className={`min-h-screen ${t.bgPage} flex flex-col items-center px-4 py-8`}>
      <div className="w-full max-w-2xl">
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className={`${t.textMuted} text-sm uppercase tracking-widest mb-1`}>Room Code</p>
            <h1 className={`text-5xl font-black ${t.textYellow} tracking-widest font-mono`}>{roomCode}</h1>
          </div>
          <div className="flex gap-2 mt-2">
            <a href={`/tv/${roomCode}`} target="_blank" rel="noopener noreferrer"
              className={`px-4 py-2 rounded-xl ${t.btnPrimary} font-semibold shadow`}>
              TV Screen ↗
            </a>
            <button
              onClick={() => setMenuState("main")}
              className={`px-4 py-2 rounded-xl ${t.btnGhost} font-semibold`}
            >
              ⋯
            </button>
          </div>
        </div>

        {/* Menu overlay */}
        {menuState !== "closed" && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuState("closed")}>
            <div className={`w-full max-w-sm ${t.bgSurface} rounded-t-2xl border-t ${t.borderSurface} p-6 pb-10`}
              onClick={(e) => e.stopPropagation()}>

              {menuState === "main" && (
                <>
                  <h3 className="text-white font-bold text-lg mb-4">Host Menu</h3>
                  <div className="flex flex-col gap-3">
                    {nonHostPlayers.length > 0 && (
                      <button
                        onClick={() => setMenuState("kick")}
                        className={`w-full py-3 rounded-xl ${t.btnGhost} font-semibold text-base text-left px-4`}
                      >
                        👢 Kick Player
                      </button>
                    )}
                    <button
                      onClick={() => setMenuState("disband_confirm")}
                      className={`w-full py-3 rounded-xl bg-[#9a3558]/20 border border-[#9a3558]/40 text-[#c94f7a] hover:bg-[#9a3558]/30 active:scale-95 transition-all font-semibold text-base text-left px-4`}
                    >
                      🗑 Disband Room
                    </button>
                    <button
                      onClick={() => setMenuState("closed")}
                      className={`w-full py-3 rounded-xl ${t.btnGhost} text-base`}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {menuState === "kick" && (
                <>
                  <h3 className="text-white font-bold text-lg mb-4">Kick Player</h3>
                  <div className="flex flex-col gap-2">
                    {nonHostPlayers.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleKick(p.nickname)}
                        className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl ${t.btnGhost} hover:bg-[#9a3558]/20 hover:border-[#9a3558]/40 hover:text-[#c94f7a] transition-all`}
                      >
                        <div className={`${avatarColor(p.nickname)} w-9 h-9 rounded-full flex items-center justify-center text-xl flex-shrink-0`}>
                          {playerEmoji(p.nickname)}
                        </div>
                        <span className="font-semibold">{p.nickname}</span>
                      </button>
                    ))}
                    <button
                      onClick={() => setMenuState("main")}
                      className={`w-full py-3 rounded-xl ${t.btnGhost} text-base mt-1`}
                    >
                      Back
                    </button>
                  </div>
                </>
              )}

              {menuState === "disband_confirm" && (
                <>
                  <h3 className="text-white font-bold text-lg mb-2">Disband Room?</h3>
                  <p className={`${t.textMuted} text-sm mb-6`}>
                    This will remove all players and close the room. This cannot be undone.
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleDisband}
                      className="w-full py-3 rounded-xl bg-[#9a3558] text-white font-bold text-base hover:bg-[#7e2b47] active:scale-95 transition-all"
                    >
                      Yes, Disband Room
                    </button>
                    <button
                      onClick={() => setMenuState("main")}
                      className={`w-full py-3 rounded-xl ${t.btnGhost} text-base`}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Players */}
        <div className={`${t.bgSurface} rounded-2xl border ${t.borderSurface} shadow-xl p-6 mb-4`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-xl">
              Players <span className={`${t.textCyan} font-mono`}>({nonHostPlayers.length})</span>
            </h2>
            <span className={`${t.textMuted} text-sm animate-pulse`}>Waiting for players...</span>
          </div>
          {nonHostPlayers.length === 0 ? (
            <p className={`${t.textFaint} text-center py-6`}>No players yet. Share the room code!</p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {nonHostPlayers.map((player) => <PlayerAvatar key={player.id} player={player} />)}
            </div>
          )}
        </div>

        {/* Game Settings */}
        <div className={`${t.bgSurface} rounded-2xl border ${t.borderSurface} shadow-xl p-6 mb-6`}>
          <h3 className={`${t.textMuted} text-xs uppercase tracking-widest mb-4`}>Game Settings</h3>
          <div className="flex flex-col gap-4">
            <SettingRow
              label="Questions"
              value={numQuestions}
              options={QUESTION_OPTIONS}
              onChange={setNumQuestions}
            />
            <SettingRow
              label="Answer time (s)"
              value={phase1Time}
              options={TIME_OPTIONS}
              onChange={setPhase1Time}
            />
            <SettingRow
              label="Guess time (s)"
              value={phase2Time}
              options={TIME_OPTIONS}
              onChange={setPhase2Time}
            />
          </div>
        </div>

        <button onClick={handleLock} disabled={nonHostPlayers.length < 2}
          className={`w-full py-4 rounded-2xl ${t.btnYellow} text-xl shadow-xl ${t.btnPrimaryDisabled}`}>
          Lock &amp; Start Game
        </button>
        {nonHostPlayers.length < 2 && (
          <p className={`${t.textFaint} text-sm text-center mt-2`}>Need at least 2 players to start</p>
        )}
      </div>
    </main>
  );
}
