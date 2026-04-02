"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useParty } from "@/lib/useParty";
import { t, avatarColor, playerEmoji } from "@/lib/theme";

const PLAYER_SESSION_KEY = "consensus_player_session";

function PlayContent() {
  const params = useParams();
  const router = useRouter();
  const roomCode = (params.roomCode as string).toUpperCase();

  const [nickname, setNickname] = useState<string>("");
  const [nicknameInput, setNicknameInput] = useState("");
  const [nicknameError, setNicknameError] = useState("");
  const [roomNotFound, setRoomNotFound] = useState(false);

  const nicknameRef = useRef("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PLAYER_SESSION_KEY);
      if (saved) {
        const session = JSON.parse(saved) as { roomCode: string; nickname: string };
        if (session.roomCode === roomCode && session.nickname) {
          nicknameRef.current = session.nickname;
          setNickname(session.nickname);
        }
      }
    } catch { /* ignore */ }
  }, [roomCode]);

  const { sendMsg, lobbyState, gameState } = useParty(
    roomCode,
    () => {
      const name = nicknameRef.current;
      if (!name) return;
      sendMsg({ type: "join", nickname: name });
    },
    (msg) => {
      if (msg.type === "room_not_found") setRoomNotFound(true);
      if (msg.type === "kicked" || msg.type === "disbanded") {
        localStorage.removeItem(PLAYER_SESSION_KEY);
        router.push("/");
      }
      if (msg.type === "nickname_taken") {
        nicknameRef.current = "";
        setNickname("");
        localStorage.removeItem(PLAYER_SESSION_KEY);
        setNicknameError("That name is already taken. Choose another.");
      }
    },
  );

  useEffect(() => {
    if (!nickname) return;
    function handleBeforeUnload(e: BeforeUnloadEvent) { e.preventDefault(); }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [nickname]);

  useEffect(() => {
    if (gameState && gameState.phase !== "lobby" && nickname) {
      router.push(`/play/${roomCode}/game`);
    }
  }, [gameState, roomCode, nickname, router]);

  function handleLeave() {
    localStorage.removeItem(PLAYER_SESSION_KEY);
    router.push("/");
  }

  function handleSetNickname() {
    const name = nicknameInput.trim();
    if (!name) {
      setNicknameError("Please enter a nickname.");
      return;
    }
    setNicknameError("");
    nicknameRef.current = name;
    // Don't persist to localStorage yet — wait for server to confirm (no nickname_taken)
    sendMsg({ type: "join", nickname: name });
    // Optimistically show waiting screen; nickname_taken handler will roll back
    setNickname(name);
    localStorage.setItem(PLAYER_SESSION_KEY, JSON.stringify({ roomCode, nickname: name }));
  }

  const locked = lobbyState?.locked ?? false;

  if (roomNotFound) {
    return (
      <main className={`min-h-screen ${t.bgPage} flex flex-col items-center justify-center px-4`}>
        <div className={`w-full max-w-sm ${t.bgSurface} rounded-2xl border border-[#9a3558]/40 shadow-xl p-8 text-center`}>
          <p className="text-5xl mb-4">🚫</p>
          <h2 className="text-2xl font-black text-[#c94f7a] mb-2">Room Not Found</h2>
          <p className={`${t.textMuted} mb-6`}>
            No game exists for room <span className="text-white font-mono font-bold">{roomCode}</span>. Check the code and try again.
          </p>
          <a href="/" className={`block w-full py-3 rounded-xl ${t.btnYellow} text-lg text-center`}>
            Back to Home
          </a>
        </div>
      </main>
    );
  }

  if (!nickname) {
    return (
      <main className={`min-h-screen ${t.bgPage} flex flex-col items-center justify-center px-4`}>
        <div className={`w-full max-w-sm ${t.bgSurface} rounded-2xl border ${t.borderSurface} shadow-xl p-8`}>
          <h1 className={`text-3xl font-black ${t.textYellow} mb-2`}>Join Game</h1>
          <p className={`${t.textMuted} mb-6`}>
            Room: <span className="text-white font-mono font-bold">{roomCode}</span>
          </p>
          <div className="flex flex-col gap-3">
            <label className={`${t.textMuted} text-sm`}>Your Nickname</label>
            <input
              type="text"
              maxLength={20}
              placeholder="e.g. Alex"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSetNickname()}
              className={`w-full bg-[#0f2660] border border-[#2a4a8a] rounded-xl px-4 py-3 text-white placeholder-[#4a6a9a] focus:outline-none focus:border-[#7862FF] transition-colors`}
              autoFocus
            />
            {nicknameError && <p className="text-[#c94f7a] text-sm">{nicknameError}</p>}
            <button onClick={handleSetNickname}
              className={`w-full py-3 rounded-xl ${t.btnYellow} text-lg`}>
              Enter Room
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (locked) {
    return (
      <main className={`min-h-screen ${t.bgPage} flex flex-col items-center justify-center px-4`}>
        <div className="text-center">
          <div className={`${avatarColor(nickname)} w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-2xl mx-auto mb-6 ring-4 ring-[#f6dc53]/50`}>
            {playerEmoji(nickname)}
          </div>
          <h2 className={`text-5xl font-black ${t.textYellow} mb-3 animate-pulse`}>Get Ready!</h2>
          <p className="text-white text-xl font-semibold mb-1">{nickname}</p>
          <p className={t.textMuted}>The game is about to begin...</p>
          <div className="mt-6 flex gap-2 justify-center">
            <div className="w-2 h-2 bg-[#f6dc53] rounded-full animate-bounce [animation-delay:0ms]" />
            <div className="w-2 h-2 bg-[#f6dc53] rounded-full animate-bounce [animation-delay:150ms]" />
            <div className="w-2 h-2 bg-[#f6dc53] rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen ${t.bgPage} flex flex-col`}>
      {/* Top bar with room code */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${t.borderSurface} ${t.bgPage}`}>
        <span className={`${t.textMuted} text-sm font-medium`}>Room</span>
        <span className={`${t.textYellow} font-black text-xl font-mono tracking-widest`}>{roomCode}</span>
        <div className="w-12" /> {/* spacer */}
      </div>

      <div className="flex flex-col items-center px-4 py-6 w-full max-w-md mx-auto">
        <div className="flex flex-col items-center mb-6">
          <div className={`${avatarColor(nickname)} w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-2xl mb-3 ring-4 ring-white/10`}>
            {playerEmoji(nickname)}
          </div>
          <h2 className="text-2xl font-black text-white">{nickname}</h2>
        </div>

        <div className={`${t.bgSurface} rounded-2xl border ${t.borderSurface} shadow-xl p-6 mb-6 w-full`}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-2 bg-[#4dd9d2] rounded-full animate-pulse" />
            <span className="text-[#4dd9d2] font-semibold">You&apos;re in!</span>
          </div>
          <p className={`${t.textMuted} text-sm`}>Waiting for the host to start the game...</p>
        </div>

        <button
          onClick={handleLeave}
          className={`w-full py-3 rounded-xl ${t.btnDanger} font-semibold text-base`}
        >
          Leave Game
        </button>
      </div>
    </main>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={
      <main className={`min-h-screen ${t.bgPage} flex items-center justify-center`}>
        <div className={`${t.textMuted} text-lg animate-pulse`}>Loading...</div>
      </main>
    }>
      <PlayContent />
    </Suspense>
  );
}
