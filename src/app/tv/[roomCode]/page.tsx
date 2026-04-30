"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useParty } from "@/lib/useParty";
import { t, avatarColor, resolveAvatarColor, resolveEmoji } from "@/lib/theme";
import type { Player } from "@/lib/types";

const JOIN_BASE_URL = "https://consensusgame.vercel.app";
const JOIN_DISPLAY_URL = "consensusgame.vercel.app";

function BigAvatar({ player, count }: { player: Player; count: number }) {
  const color = resolveAvatarColor(player.nickname, player.emoji);
  const avatarSize = count <= 6 ? "w-16 h-16 text-3xl" : count <= 12 ? "w-12 h-12 text-2xl" : count <= 20 ? "w-10 h-10 text-xl" : "w-8 h-8 text-base";
  const nameSize = count <= 6 ? "text-base max-w-[80px]" : count <= 12 ? "text-sm max-w-[64px]" : "text-xs max-w-[52px]";
  const gap = count <= 6 ? "gap-2" : "gap-1";
  return (
    <div className={`flex flex-col items-center ${gap} animate-[fadeIn_0.4s_ease-out]`}>
      <div className={`${color} ${avatarSize} rounded-full flex items-center justify-center shadow-xl ring-2 ring-white/10`}>
        {resolveEmoji(player.nickname, player.emoji)}
      </div>
      <span className={`text-white font-semibold truncate ${nameSize}`}>
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
    <main className={`h-screen ${t.bgPage} flex flex-col px-10 py-6 relative overflow-hidden`}>
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#7862FF]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#25a59f]/5 rounded-full blur-3xl" />
      </div>

      {/* Top bar: title left, room code right */}
      <div className="w-full flex items-start justify-between z-10 mb-4 shrink-0">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tight">CONSENSUS</h1>
          <p className={`${t.textCyan} text-xl tracking-widest mt-1`}>Wisdom of the Crowds</p>
        </div>
        <div className="text-right">
          <p className={`${t.textMuted} text-lg uppercase tracking-widest`}>Room Code</p>
          <div className={`text-7xl font-black ${t.textYellow} font-mono tracking-widest drop-shadow-2xl`}>
            {roomCode}
          </div>
        </div>
      </div>

      {/* Center: player count + bubbles */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 gap-4 min-h-0 -mt-8">
        <div className="text-center">
          {players.length === 0 ? (
            <p className={`${t.textMuted} text-4xl font-semibold`}>Waiting for players...</p>
          ) : (
            <>
              <div className="text-[6rem] font-black text-white leading-none drop-shadow-2xl">
                {players.length}
              </div>
              <p className={`${t.textCyan} text-2xl font-bold mt-2`}>
                player{players.length === 1 ? "" : "s"} joined
              </p>
            </>
          )}
        </div>

        {/* Player bubbles */}
        {players.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 max-w-6xl overflow-hidden">
            {players.map((player) => (
              <BigAvatar key={player.nickname} player={player} count={players.length} />
            ))}
          </div>
        )}
      </div>

      {/* Bottom: QR + URL */}
      <div className="z-10 w-full px-8 shrink-0 mt-4">
        <div className={`${t.bgSurface} border ${t.borderSurface} rounded-2xl w-full max-w-3xl mx-auto px-8 py-5 flex flex-row items-center gap-8`}>
          {/* QR side */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <p className={`${t.textYellow} text-lg font-black uppercase tracking-widest`}>Scan</p>
            <div className="bg-white p-2 rounded-xl">
              <QRCodeSVG
                value={`${JOIN_BASE_URL}/play/${roomCode}`}
                size={100}
                bgColor="#ffffff"
                fgColor="#081c48"
                level="M"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="self-stretch w-px bg-[#2a4a8a] shrink-0" />

          {/* URL side */}
          <div className="flex flex-col gap-2 min-w-0">
            <p className={`${t.textYellow} text-lg font-black uppercase tracking-widest`}>Or Join Via Browser</p>
            <p className="font-black font-mono text-2xl leading-tight">
              <span className="text-white">{JOIN_DISPLAY_URL}/</span><wbr /><span className={t.textYellow}>play/{roomCode}</span>
            </p>
          </div>
        </div>
      </div>

    </main>
  );
}
