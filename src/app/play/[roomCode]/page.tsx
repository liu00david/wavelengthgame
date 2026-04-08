"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useParty } from "@/lib/useParty";
import { t, avatarColor, resolveAvatarColor, resolveEmoji } from "@/lib/theme";

const PLAYER_SESSION_KEY = "consensus_player_session";

// ---- Inner component: only rendered once tab check passes ----
function PlayContent({ roomCode }: { roomCode: string }) {
  const router = useRouter();

  // `nickname` = confirmed by server; `pendingNickname` = sent but not yet confirmed
  const [nickname, setNickname] = useState<string>("");
  const [pendingNickname, setPendingNickname] = useState<string>("");
  const [nicknameInput, setNicknameInput] = useState("");
  const [nicknameError, setNicknameError] = useState("");
  const [roomNotFound, setRoomNotFound] = useState(false);
  const [chosenEmoji, setChosenEmoji] = useState<string | undefined>(undefined);

  const nicknameRef = useRef("");
  const joinedRef = useRef(false); // true once we've successfully joined (got `connected`)

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
      // Only auto-join on reconnect if we were previously confirmed
      if (joinedRef.current) {
        sendMsg({ type: "join", nickname: nicknameRef.current });
        return;
      }
      // First open: only send if we have a saved session (returning player)
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
      if (msg.type === "connected") {
        // Server confirmed join — promote to confirmed nickname
        const name = nicknameRef.current;
        if (name) {
          joinedRef.current = true;
          setNickname(name);
          setPendingNickname("");
          localStorage.setItem(PLAYER_SESSION_KEY, JSON.stringify({ roomCode, nickname: name }));
        }
      }
      if (msg.type === "nickname_taken" || msg.type === "duplicate_tab") {
        nicknameRef.current = "";
        setPendingNickname("");
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

  // Sync chosenEmoji from server when lobby state arrives (preserves emoji across games)
  useEffect(() => {
    if (!lobbyState || !nickname || chosenEmoji !== undefined) return;
    const me = lobbyState.players.find((p) => p.nickname === nickname);
    if (me?.emoji) setChosenEmoji(me.emoji);
  }, [lobbyState, nickname, chosenEmoji]);

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
    setPendingNickname(name);
    sendMsg({ type: "join", nickname: name });
    // Do NOT set nickname or localStorage yet — wait for server `connected`
    // Safety timeout: if no response in 5s, un-stick the button
    setTimeout(() => {
      setPendingNickname((p) => p === name ? "" : p);
    }, 5000);
  }

  function handlePickEmoji(emoji: string) {
    setChosenEmoji(emoji);
    sendMsg({ type: "set_emoji", emoji });
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
    const waiting = !!pendingNickname;
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
              placeholder="e.g. David"
              value={nicknameInput}
              onChange={(e) => { setNicknameInput(e.target.value); setNicknameError(""); }}
              onKeyDown={(e) => e.key === "Enter" && !waiting && handleSetNickname()}
              disabled={waiting}
              className={`w-full bg-[#0f2660] border border-[#2a4a8a] rounded-xl px-4 py-3 text-white placeholder-[#4a6a9a] focus:outline-none focus:border-[#7862FF] transition-colors disabled:opacity-60`}
              autoFocus
            />
            {nicknameError && <p className="text-[#c94f7a] text-sm">{nicknameError}</p>}
            <button onClick={handleSetNickname} disabled={waiting}
              className={`w-full py-3 rounded-xl ${t.btnYellow} text-lg disabled:opacity-60 flex items-center justify-center gap-2`}>
              {waiting ? (
                <>
                  <span className="inline-block w-5 h-5 border-2 border-[#081c48] border-t-transparent rounded-full animate-spin" />
                  Joining...
                </>
              ) : "Enter Room"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  const displayEmoji = resolveEmoji(nickname, chosenEmoji);

  if (locked) {
    return (
      <main className={`min-h-screen ${t.bgPage} flex flex-col items-center justify-center px-4`}>
        <div className="text-center">
          <div className={`${resolveAvatarColor(nickname, chosenEmoji)} w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-2xl mx-auto mb-6 ring-4 ring-[#f6dc53]/50`}>
            {displayEmoji}
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
        <div className="w-12" />
      </div>

      <div className="flex flex-col items-center px-4 py-6 w-full max-w-md mx-auto">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-5">
          <div className={`${resolveAvatarColor(nickname, chosenEmoji)} w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-2xl mb-3 ring-4 ring-white/10`}>
            {displayEmoji}
          </div>
          <h2 className="text-2xl font-black text-white">{nickname}</h2>
        </div>

        {/* Emoji picker */}
        <div className={`${t.bgSurface} rounded-2xl border ${t.borderSurface} p-4 mb-4 w-full`}>
          <p className={`${t.textMuted} text-xs uppercase tracking-widest mb-3`}>Pick your emoji</p>
          <div className="grid grid-cols-8 gap-2">
            {t.playerEmojis.map((emoji) => {
              const emojiColor = t.emojiColors[emoji]?.bg ?? t.bgPage;
              const selected = displayEmoji === emoji;
              return (
                <button
                  key={emoji}
                  onClick={() => handlePickEmoji(emoji)}
                  className={`w-full aspect-square rounded-xl text-2xl flex items-center justify-center transition-all active:scale-90 ${emojiColor} ${
                    selected ? "ring-2 ring-white scale-110 opacity-100" : "opacity-60 hover:opacity-100"
                  }`}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status */}
        <div className={`${t.bgSurface} rounded-2xl border ${t.borderSurface} p-4 mb-4 w-full`}>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[#4dd9d2] rounded-full animate-pulse shrink-0" />
            <div>
              <span className="text-[#4dd9d2] font-semibold">You&apos;re in!</span>
              <p className={`${t.textMuted} text-sm mt-0.5`}>Waiting for the host to start the game...</p>
            </div>
          </div>
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

// ---- Tab check wrapper ----
function PlayGuard() {
  const params = useParams();
  const roomCode = (params.roomCode as string).toUpperCase();

  const [tabStatus, setTabStatus] = useState<"checking" | "duplicate" | "ok">("checking");

  useEffect(() => {
    const channel = new BroadcastChannel(`consensus_tab_${roomCode}`);
    let isDuplicate = false;

    channel.onmessage = (e) => {
      if (e.data === "ping") {
        channel.postMessage("pong");
      }
      if (e.data === "pong" && !isDuplicate) {
        isDuplicate = true;
        setTabStatus("duplicate");
        channel.close();
      }
    };

    channel.postMessage("ping");

    const timer = setTimeout(() => {
      setTabStatus((s) => s === "checking" ? "ok" : s);
    }, 300);

    return () => {
      clearTimeout(timer);
      if (!isDuplicate) channel.close();
    };
  }, [roomCode]);

  if (tabStatus === "checking") {
    return (
      <main className={`min-h-screen ${t.bgPage} flex items-center justify-center`}>
        <div className={`${t.textMuted} text-lg animate-pulse`}>Loading...</div>
      </main>
    );
  }

  if (tabStatus === "duplicate") {
    return (
      <main className={`min-h-screen ${t.bgPage} flex flex-col items-center justify-center px-4`}>
        <div className={`w-full max-w-sm ${t.bgSurface} rounded-2xl border border-[#9a3558]/40 shadow-xl p-8 text-center`}>
          <p className="text-5xl mb-4">🪟</p>
          <h2 className="text-2xl font-black text-[#c94f7a] mb-2">Already Open</h2>
          <p className={`${t.textMuted} mb-4`}>
            This game is already open in another tab.
          </p>
          <p className={`${t.textFaint} text-sm`}>Close this tab and continue in the other one.</p>
        </div>
      </main>
    );
  }

  return <PlayContent roomCode={roomCode} />;
}

export default function PlayPage() {
  return (
    <Suspense fallback={
      <main className={`min-h-screen ${t.bgPage} flex items-center justify-center`}>
        <div className={`${t.textMuted} text-lg animate-pulse`}>Loading...</div>
      </main>
    }>
      <PlayGuard />
    </Suspense>
  );
}
