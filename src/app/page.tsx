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
    <main className={`min-h-screen ${t.bgPage} flex flex-col items-center justify-center px-4`}>
      <div className="mb-10 text-center">
        <h1 className={`text-6xl font-black text-white tracking-tight`}>
          CONSENSUS
        </h1>
        <p className={`${t.textTeal} mt-2 text-lg tracking-wide`}>
          Wisdom of the Crowds
        </p>
      </div>

      <div className="flex flex-col gap-6 w-full max-w-md">
        {/* Create Room */}
        <div className={`flex-1 ${t.bgSurface} rounded-2xl shadow-xl p-8 flex flex-col gap-4 border ${t.borderSurface}`}>
          <h2 className="text-2xl font-bold text-white">Host a Game</h2>
          <p className={`${t.textMuted} text-sm`}>
            Generate a room and invite your friends. You&apos;ll control the
            game from this device.
          </p>
          <button
            onClick={handleCreateRoom}
            className={`mt-auto w-full py-3 rounded-xl ${t.btnPrimary} text-lg shadow-lg font-bold`}
          >
            Create Room
          </button>
        </div>

        {/* Join Room */}
        <div className={`flex-1 ${t.bgSurface} rounded-2xl shadow-xl p-8 flex flex-col gap-4 border ${t.borderSurface}`}>
          <h2 className="text-2xl font-bold text-white">Join a Game</h2>

          {joinStep === "code" ? (
            <div className="flex flex-col gap-3">
              <div>
                <label className={`${t.textMuted} text-sm mb-1 block`}>
                  Room Code
                </label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="ABCD"
                  value={joinCode}
                  onChange={(e) => {
                    setJoinCode(e.target.value.toUpperCase());
                    setJoinError("");
                  }}
                  onKeyDown={handleCodeKeyDown}
                  className={`w-full bg-[#0f2660] border border-[#2a4a8a] rounded-xl px-4 py-3 text-white text-xl font-mono tracking-widest uppercase placeholder-[#4a6a9a] focus:outline-none focus:border-[#7862FF] transition-colors`}
                />
              </div>
              {joinError && (
                <p className="text-[#c94f7a] text-sm">{joinError}</p>
              )}
              <button
                onClick={handleCheckRoom}
                disabled={checking}
                className={`mt-auto w-full py-3 rounded-xl bg-[#25a59f] text-white hover:bg-[#1d8c87] active:scale-95 transition-all font-bold text-lg shadow-lg disabled:opacity-60 flex items-center justify-center gap-2`}
              >
                {checking ? (
                  <>
                    <span className="inline-block w-5 h-5 border-2 border-[#081c48] border-t-transparent rounded-full animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Check Room"
                )}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className={`${t.textTeal} font-semibold text-sm`}>
                Room {checkedCode} found! ✓
              </p>
              <div>
                <label className={`${t.textMuted} text-sm mb-1 block`}>
                  Your Nickname
                </label>
                <input
                  type="text"
                  maxLength={16}
                  placeholder="e.g. Alex"
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    setJoinError("");
                  }}
                  onKeyDown={handleNicknameKeyDown}
                  autoFocus
                  className={`w-full bg-[#0f2660] border border-[#2a4a8a] rounded-xl px-4 py-3 text-white text-xl placeholder-[#4a6a9a] focus:outline-none focus:border-[#7862FF] transition-colors`}
                />
              </div>
              {joinError && (
                <p className="text-[#c94f7a] text-sm">{joinError}</p>
              )}
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => { setJoinStep("code"); setJoinError(""); }}
                  className={`py-3 px-4 rounded-xl ${t.btnGhost} font-semibold`}
                >
                  Back
                </button>
                <button
                  onClick={handleJoinGame}
                  className={`flex-1 py-3 rounded-xl bg-[#25a59f] text-white hover:bg-[#1d8c87] active:scale-95 transition-all font-bold text-lg shadow-lg`}
                >
                  Join Game
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
