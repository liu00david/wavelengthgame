"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useParty } from "@/lib/useParty";
import { t, avatarColor, resolveAvatarColor, resolveEmoji } from "@/lib/theme";
import type { Player } from "@/lib/types";

const JOIN_BASE_URL = "https://consensusgame.vercel.app";
const JOIN_DISPLAY_URL = "consensusgame.vercel.app";

function BigAvatar({ player }: { player: Player }) {
  const color = resolveAvatarColor(player.nickname, player.emoji);
  return (
    <div className="flex flex-col items-center gap-3 animate-[fadeIn_0.4s_ease-out]">
      <div className={`${color} w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-xl ring-4 ring-white/10`}>
        {resolveEmoji(player.nickname, player.emoji)}
      </div>
      <span className="text-white text-xl font-semibold truncate max-w-[110px]">
        {player.nickname}
      </span>
    </div>
  );
}

export default function TVPage() {
  const params = useParams();
  const roomCode = (params.roomCode as string).toUpperCase();
  const router = useRouter();

  const [roomNotFound, setRoomNotFound] = useState(false);

  const { lobbyState, gameState } = useParty(roomCode, undefined, (msg) => {
    if (msg.type === "room_not_found" || msg.type === "disbanded") {
      setRoomNotFound(true);
    }
  });

  // Check room existence on mount
  useEffect(() => {
    fetch(`/api/room/${roomCode}`)
      .then((r) => r.json())
      .then((data: { exists: boolean }) => {
        if (!data.exists) setRoomNotFound(true);
      })
      .catch(() => setRoomNotFound(true));
  }, [roomCode]);

  useEffect(() => {
    if (gameState && gameState.phase !== "lobby") {
      router.push(`/tv/${roomCode}/game`);
    }
  }, [gameState?.phase, roomCode, router]);

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

  const players: Player[] = (lobbyState?.players ?? []).filter((p) => !p.isHost);
  const locked = lobbyState?.locked ?? false;

  return (
    <main className={`min-h-screen ${t.bgPage} flex flex-col px-4 sm:px-10 py-6 sm:py-8 relative overflow-hidden`}>
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#7862FF]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#25a59f]/5 rounded-full blur-3xl" />
      </div>

      {/* Top bar: title left, room code right */}
      <div className="w-full flex items-start justify-between z-10 mb-6">
        <div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">CONSENSUS</h1>
          <p className={`${t.textCyan} text-base sm:text-xl tracking-widest mt-1`}>Wisdom of the Crowds</p>
        </div>
        <div className="text-right">
          <p className={`${t.textMuted} text-sm sm:text-lg uppercase tracking-widest`}>Room Code</p>
          <div className={`text-4xl sm:text-7xl font-black text-white font-mono tracking-widest drop-shadow-2xl`}>
            {roomCode}
          </div>
        </div>
      </div>

      {/* Center: player count (Kahoot-style large) */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 gap-6">
        <div className="text-center mb-2">
          {players.length === 0 ? (
            <p className={`${t.textMuted} text-2xl sm:text-4xl font-semibold`}>Waiting for players...</p>
          ) : (
            <>
              <div className="text-[5rem] sm:text-[10rem] font-black text-white leading-none drop-shadow-2xl">
                {players.length}
              </div>
              <p className={`${t.textCyan} text-2xl sm:text-4xl font-bold -mt-2`}>
                player{players.length === 1 ? "" : "s"} joined
              </p>
            </>
          )}
        </div>

        {/* Player bubbles */}
        {players.length > 0 && (
          <div className="flex flex-wrap justify-center gap-6 max-w-5xl">
            {players.map((player) => (
              <BigAvatar key={player.id} player={player} />
            ))}
          </div>
        )}
      </div>

      {/* Bottom: QR + URL */}
      <div className="z-10 flex items-center justify-center mt-6">
        <div className={`${t.bgSurface} border ${t.borderSurface} rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 sm:gap-8`}>
          <div className="bg-white p-2 rounded-xl flex-shrink-0">
            <QRCodeSVG
              value={`${JOIN_BASE_URL}/play/${roomCode}`}
              size={90}
              bgColor="#ffffff"
              fgColor="#081c48"
              level="M"
            />
          </div>
          <div className="text-center sm:text-left">
            <p className={`${t.textMuted} text-base sm:text-xl uppercase tracking-widest mb-1`}>Join at</p>
            <p className="text-white text-xl sm:text-3xl font-black font-mono break-all">
              {JOIN_DISPLAY_URL}/play/<span className={t.textYellow}>{roomCode}</span>
            </p>
            <p className={`${t.textFaint} text-base mt-1`}>or scan the QR code</p>
          </div>
        </div>
      </div>

      {/* Locked overlay */}
      {locked && (
        <div className={`absolute inset-0 ${t.bgPage}/90 flex flex-col items-center justify-center z-20 backdrop-blur-sm`}>
          <div className="text-center">
            <div className={`text-9xl font-black ${t.textTeal} animate-pulse mb-4`}>
              🎮
            </div>
            <h2 className="text-6xl font-black text-white mb-4">
              Game Starting!
            </h2>
            <p className={`${t.textCyan} text-2xl`}>
              {players.length} players ready
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
