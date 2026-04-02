"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/theme";

const PLAYER_SESSION_KEY = "consensus_player_session";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinStep, setJoinStep] = useState<"code" | "nickname">("code");
  const [checkedCode, setCheckedCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [checking, setChecking] = useState(false);

  function handleCreateRoom() {
    const code = generateRoomCode();
    router.push(`/host/${code}`);
  }

  async function handleCheckRoom() {
    const code = joinCode.trim().toUpperCase();
    if (!code || code.length !== 4) {
      setJoinError("Enter a valid 4-letter room code.");
      return;
    }
    setJoinError("");
    setChecking(true);
    try {
      const res = await fetch(`/api/room/${code}`);
      const data = await res.json() as { exists: boolean };
      if (!data.exists) {
        setJoinError("Room not found. Ask the host for the correct code.");
        setJoinStep("code");
      } else {
        setCheckedCode(code);
        setJoinStep("nickname");
      }
    } catch {
      setJoinError("Could not reach server. Try again.");
      setJoinStep("code");
    } finally {
      setChecking(false);
    }
  }

  function handleJoinGame() {
    const name = nickname.trim();
    if (!name) {
      setJoinError("Enter a nickname.");
      return;
    }
    setJoinError("");
    localStorage.setItem(
      PLAYER_SESSION_KEY,
      JSON.stringify({ roomCode: checkedCode, nickname: name })
    );
    router.push(`/play/${checkedCode}`);
  }

  function handleCodeKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleCheckRoom();
  }

  function handleNicknameKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleJoinGame();
  }

  return (
    <main className={`min-h-screen ${t.bgPage} flex flex-col items-center justify-center px-5 py-10`}>
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tight">CONSENSUS</h1>
        <p className={`${t.textTeal} mt-2 text-xl sm:text-2xl tracking-wide`}>Wisdom of the Crowds</p>
        <p className={`${t.textMuted} mt-2 text-base sm:text-lg`}>Predict what your group thinks. Score points for getting close.</p>
      </div>

      {/* Host + Join stacked */}
      <div className="flex flex-col gap-4 w-full max-w-md mb-6">
        {/* Host */}
        <div className={`${t.bgSurface} rounded-2xl shadow-xl p-6 flex flex-col gap-4 border ${t.borderSurface}`}>
          <h2 className="text-xl font-bold text-white">Host a Game</h2>
          <p className={`${t.textMuted} text-base`}>
            Create a room and control the game from your device.
          </p>
          <button
            onClick={handleCreateRoom}
            className={`w-full py-3 rounded-xl ${t.btnPrimary} text-lg font-bold`}
          >
            Create Room
          </button>
        </div>

        {/* Join */}
        <div className={`${t.bgSurface} rounded-2xl shadow-xl p-6 flex flex-col gap-3 border ${t.borderSurface}`}>
          <h2 className="text-xl font-bold text-white">Join a Game</h2>

          {joinStep === "code" ? (
            <>
              <input
                type="text"
                maxLength={4}
                placeholder="Room code"
                value={joinCode}
                onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(""); }}
                onKeyDown={handleCodeKeyDown}
                className={`w-full bg-[#0f2660] border border-[#2a4a8a] rounded-xl px-4 py-3 text-white text-xl font-mono tracking-widest uppercase placeholder-[#4a6a9a] focus:outline-none focus:border-[#7862FF] transition-colors`}
              />
              {joinError && <p className="text-[#c94f7a] text-sm">{joinError}</p>}
              <button
                onClick={handleCheckRoom}
                disabled={checking}
                className={`w-full py-3 rounded-xl bg-[#25a59f] text-white hover:bg-[#1d8c87] active:scale-95 transition-all font-bold text-lg disabled:opacity-60 flex items-center justify-center gap-2`}
              >
                {checking ? (
                  <>
                    <span className="inline-block w-5 h-5 border-2 border-[#081c48] border-t-transparent rounded-full animate-spin" />
                    Checking...
                  </>
                ) : "Join Room"}
              </button>
            </>
          ) : (
            <>
              <p className={`${t.textTeal} text-sm`}>Room {checkedCode} found! ✓</p>
              <input
                type="text"
                maxLength={16}
                placeholder="Your nickname"
                value={nickname}
                onChange={(e) => { setNickname(e.target.value); setJoinError(""); }}
                onKeyDown={handleNicknameKeyDown}
                autoFocus
                className={`w-full bg-[#0f2660] border border-[#2a4a8a] rounded-xl px-4 py-3 text-white text-xl placeholder-[#4a6a9a] focus:outline-none focus:border-[#7862FF] transition-colors`}
              />
              {joinError && <p className="text-[#c94f7a] text-sm">{joinError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => { setJoinStep("code"); setJoinError(""); }}
                  className={`py-3 px-4 rounded-xl ${t.btnGhost} font-semibold`}
                >
                  ←
                </button>
                <button
                  onClick={handleJoinGame}
                  className={`flex-1 py-3 rounded-xl bg-[#25a59f] text-white hover:bg-[#1d8c87] active:scale-95 transition-all font-bold text-lg`}
                >
                  Join Game
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* How to play link */}
      <a
        href="/how-to-play"
        className={`${t.textMuted} text-base hover:text-white transition-colors underline underline-offset-4`}
      >
        How to Play →
      </a>
    </main>
  );
}
