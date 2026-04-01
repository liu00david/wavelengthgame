"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useParty } from "@/lib/useParty";
import { t, avatarColor, playerEmoji } from "@/lib/theme";
import type { Player } from "@/lib/types";

const JOIN_BASE_URL = "https://<PLACEHOLDER>";

function BigAvatar({ player }: { player: Player }) {
  const color = avatarColor(player.nickname);
  return (
    <div className="flex flex-col items-center gap-3 animate-[fadeIn_0.4s_ease-out]">
      <div className={`${color} w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-xl ring-4 ring-white/10`}>
        {playerEmoji(player.nickname)}
      </div>
      <span className="text-white text-lg font-semibold truncate max-w-[90px]">
        {player.nickname}
      </span>
      {player.isHost && (
        <span className={`${t.textYellow} text-sm font-bold -mt-2`}>HOST</span>
      )}
    </div>
  );
}

export default function TVPage() {
  const params = useParams();
  const roomCode = (params.roomCode as string).toUpperCase();
  const router = useRouter();

  const { lobbyState, gameState } = useParty(roomCode);

  useEffect(() => {
    if (gameState && gameState.phase !== "lobby") {
      router.push(`/tv/${roomCode}/game`);
    }
  }, [gameState, roomCode, router]);

  const players: Player[] = lobbyState?.players ?? [];
  const locked = lobbyState?.locked ?? false;

  return (
    <main className={`min-h-screen ${t.bgPage} flex flex-col items-center justify-between px-8 py-10 relative overflow-hidden`}>
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#7862FF]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#25a59f]/5 rounded-full blur-3xl" />
      </div>

      {/* Top: title + room code */}
      <div className="w-full flex items-center justify-between z-10">
        <div>
          <h1 className={`text-4xl font-black text-white tracking-tight`}>
            CONSENSUS
          </h1>
          <p className={`${t.textCyan} text-sm tracking-widest`}>
            Wisdom of the Crowds
          </p>
        </div>

        {/* QR code */}
        <div className="flex flex-col items-center gap-2">
          <div className="bg-white p-2 rounded-xl">
            <QRCodeSVG
              value={`${JOIN_BASE_URL}/play/${roomCode}`}
              size={96}
              bgColor="#ffffff"
              fgColor="#081c48"
              level="M"
            />
          </div>
          <span className={`${t.textMuted} text-xs`}>Scan to join</span>
        </div>
      </div>

      {/* Center: room code + join URL */}
      <div className="flex flex-col items-center z-10">
        <p className={`${t.textMuted} uppercase tracking-widest text-sm mb-1`}>
          Join at
        </p>
        <p className={`${t.textTeal} text-lg font-mono mb-3`}>
          {JOIN_BASE_URL}/play/{roomCode}
        </p>
        <div className="text-8xl font-black text-white font-mono tracking-widest drop-shadow-2xl">
          {roomCode}
        </div>
        <p className={`${t.textFaint} mt-3 text-lg`}>
          {players.length === 0
            ? "Waiting for players..."
            : `${players.length} player${players.length === 1 ? "" : "s"} joined`}
        </p>
      </div>

      {/* Bottom: player bubbles */}
      <div className="z-10 w-full">
        {players.length > 0 && (
          <div className="flex flex-wrap justify-center gap-6">
            {players.map((player) => (
              <BigAvatar key={player.id} player={player} />
            ))}
          </div>
        )}
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
