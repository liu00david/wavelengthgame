"use client";

import { useEffect, useRef, useState } from "react";
import { useAudio, type AudioEvent } from "@/lib/useAudio";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

type SoundEntry =
  | {
      label: string;
      description: string;
      event: AudioEvent;
      opts?: { urgency?: number };
      isLoop: boolean;
      accent: string;
      missing?: false;
    }
  | {
      label: string;
      description: string;
      missing: true;
      accent: string;
    };

type Section = {
  title: string;
  color: string;
  sounds: SoundEntry[];
};

const SECTIONS: Section[] = [
  {
    title: "Background Loops",
    color: "#25a59f",
    sounds: [
      { label: "Lobby Music",               description: "Gentle loop — players joining",            event: "lobby_music",               isLoop: true, accent: "#25a59f" },
      { label: "Question Submission Music", description: "Creative loop — players writing questions", event: "question_submission_music", isLoop: true, accent: "#4dd9d2" },
      { label: "Phase 1 Music",             description: "Upbeat loop — answering phase",             event: "phase1_start",              isLoop: true, accent: "#7862FF" },
      { label: "Phase 2 Music",             description: "Tense loop — predicting phase",             event: "phase2_start",              isLoop: true, accent: "#4a82d0" },
      { label: "Endgame Music",             description: "Victory loop — podium / game over screen",  event: "endgame_music",             isLoop: true, accent: "#f6dc53" },
    ],
  },
  {
    title: "Game Flow Stingers",
    color: "#7862FF",
    sounds: [
      { label: "Countdown 3",      description: "Low pop (330 Hz) — pre-game 3",              event: "countdown_3",       isLoop: false, accent: "#7862FF" },
      { label: "Countdown 2",      description: "Mid pop (440 Hz) — pre-game 2",              event: "countdown_2",       isLoop: false, accent: "#4dd9d2" },
      { label: "Countdown 1",      description: "High pop (660 Hz) — pre-game 1",             event: "countdown_1",       isLoop: false, accent: "#f6dc53" },
      { label: "Reveal Gong",      description: "Gong hit — phase 3 reveal transition",        event: "phase3_start",      isLoop: false, accent: "#c94f7a" },
      { label: "Leaderboard",      description: "Ascending run + chord — scores screen",      event: "leaderboard_start", isLoop: false, accent: "#f6dc53" },

    ],
  },
  {
    title: "TV Reactions",
    color: "#4dd9d2",
    sounds: [
      { label: "Player Join",    description: "Soft bloop — new player appears in lobby",     event: "player_join",    isLoop: false, accent: "#4dd9d2" },
      { label: "Answer In",      description: "Subtle pop — one answer received",             event: "answer_in",      isLoop: false, accent: "#25a59f" },

      { label: "Score Tick",     description: "Soft tick — score counting up on leaderboard", event: "score_tick",     isLoop: false, accent: "#f6dc53" },
    ],
  },
  {
    title: "Timer Ticks",
    color: "#c94f7a",
    sounds: [
      { label: "Tick — 5s left", description: "urgency 0.0", event: "timer_tick", opts: { urgency: 0.0 }, isLoop: false, accent: "#4a6aaa" },
      { label: "Tick — 4s left", description: "urgency 0.2", event: "timer_tick", opts: { urgency: 0.2 }, isLoop: false, accent: "#5a7aaa" },
      { label: "Tick — 3s left", description: "urgency 0.4", event: "timer_tick", opts: { urgency: 0.4 }, isLoop: false, accent: "#7862FF" },
      { label: "Tick — 2s left", description: "urgency 0.6", event: "timer_tick", opts: { urgency: 0.6 }, isLoop: false, accent: "#c94f7a" },
      { label: "Tick — 1s left", description: "urgency 0.8", event: "timer_tick", opts: { urgency: 0.8 }, isLoop: false, accent: "#9a3558" },
    ],
  },
];

// Flat list of playable entries only (for oneshot tracking by label)
const ALL_LOOP_LABELS: Partial<Record<AudioEvent, string>> = {
  lobby_music:               "Lobby Music",
  question_submission_music: "Question Submission Music",
  phase1_start:              "Phase 1 Music",
  phase2_start:              "Phase 2 Music",
  endgame_music:             "Endgame Music",
};

const ONESHOT_DURATION_MS = 700;

// ---------------------------------------------------------------------------
// EQ bars
// ---------------------------------------------------------------------------
function EqBars({ color }: { color: string }) {
  return (
    <div className="flex items-end gap-[2px] h-4 w-5 shrink-0">
      {[0.5, 1, 0.65, 0.9, 0.4].map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-sm"
          style={{
            height: `${h * 100}%`,
            background: color,
            animation: `eqBar 0.7s ease-in-out ${i * 0.1}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes eqBar {
          from { transform: scaleY(0.25); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sound row — playable
// ---------------------------------------------------------------------------
function SoundRow({
  entry,
  isActiveLoop,
  loopPaused,
  isActiveOneshot,
  onPlay,
  onPause,
  onResume,
}: {
  entry: Extract<SoundEntry, { missing?: false }>;
  isActiveLoop: boolean;
  loopPaused: boolean;
  isActiveOneshot: boolean;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
}) {
  function handleClick() {
    if (entry.isLoop) {
      if (isActiveLoop) {
        loopPaused ? onResume() : onPause();
      } else {
        onPlay();
      }
    } else {
      onPlay();
    }
  }

  const playing = entry.isLoop ? (isActiveLoop && !loopPaused) : isActiveOneshot;
  const paused  = entry.isLoop && isActiveLoop && loopPaused;
  const accent  = entry.accent;

  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3 border transition-all"
      style={{
        background: playing || paused ? `${accent}18` : "#0f2660",
        borderColor: playing || paused ? `${accent}80` : "#2a4a8a",
      }}
    >
      <button
        onClick={handleClick}
        className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-base font-black transition-all active:scale-90"
        style={{
          background: playing ? accent : paused ? `${accent}40` : `${accent}20`,
          color: playing ? "#fff" : accent,
        }}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? "⏸" : "▶"}
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-white leading-tight">{entry.label}</p>
        <p className="text-xs mt-0.5" style={{ color: "#4a6a9a" }}>{entry.description}</p>
      </div>
      <div className="shrink-0 w-20 flex justify-end items-center">
        {playing && <EqBars color={accent} />}
        {paused && <span className="text-xs font-semibold" style={{ color: accent }}>Paused</span>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sound row — missing/TODO
// ---------------------------------------------------------------------------
function MissingRow({ entry }: { entry: Extract<SoundEntry, { missing: true }> }) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3 border"
      style={{ background: "#0a1a3a", borderColor: "#1a3060", borderStyle: "dashed" }}
    >
      <div
        className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-base font-black"
        style={{ background: "#1a2a50", color: "#3a5080" }}
      >
        ▶
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm leading-tight" style={{ color: "#4a6a9a" }}>{entry.label}</p>
        <p className="text-xs mt-0.5" style={{ color: "#2a4060" }}>{entry.description}</p>
      </div>
      <span
        className="shrink-0 text-xs font-black px-2 py-0.5 rounded-full uppercase tracking-widest"
        style={{ background: "#1a2a50", color: "#3a5888" }}
      >
        TODO
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AudioTestPage() {
  const { play, currentLoop, paused, pauseAudio, resumeAudio, muted, toggleMute } = useAudio();
  const [activeOneshot, setActiveOneshot] = useState<string | null>(null);
  const oneshotTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handlePlay(entry: Extract<SoundEntry, { missing?: false }>) {
    play(entry.event, entry.opts);
    if (!entry.isLoop) {
      if (oneshotTimer.current) clearTimeout(oneshotTimer.current);
      setActiveOneshot(entry.label);
      oneshotTimer.current = setTimeout(() => setActiveOneshot(null), ONESHOT_DURATION_MS);
    } else {
      if (oneshotTimer.current) clearTimeout(oneshotTimer.current);
      setActiveOneshot(null);
    }
  }

  useEffect(() => {
    if (currentLoop) {
      if (oneshotTimer.current) clearTimeout(oneshotTimer.current);
      setActiveOneshot(null);
    }
  }, [currentLoop]);

  useEffect(() => () => { if (oneshotTimer.current) clearTimeout(oneshotTimer.current); }, []);

  const missingCount = SECTIONS.flatMap((s) => s.sounds).filter((s) => s.missing).length;

  return (
    <main className="min-h-screen bg-[#081c48] text-white px-6 py-10">
      <div className="max-w-xl mx-auto flex flex-col gap-8">

        <div>
          <h1 className="text-3xl font-black text-[#f6dc53]">Audio Test</h1>
          <p className="text-[#7a96c8] text-sm mt-1">
            Press ▶ to play, ⏸ to pause (loops only). Edit{" "}
            <code className="text-[#4dd9d2] bg-[#0f2660] px-1 rounded">src/lib/useAudio.ts</code>{" "}
            then refresh.
          </p>
          {muted && (
            <button
              onClick={toggleMute}
              className="mt-3 px-4 py-2 rounded-lg bg-[#f6dc53] text-[#081c48] font-black text-sm"
            >
              🔇 Click to enable audio
            </button>
          )}
          <p className="text-xs mt-2" style={{ color: "#3a5888" }}>
            {missingCount} sounds still TODO
          </p>
        </div>

        {SECTIONS.map((section) => (
          <div key={section.title} className="flex flex-col gap-2">
            <h2
              className="text-xs font-black uppercase tracking-widest px-1 mb-1"
              style={{ color: section.color }}
            >
              {section.title}
            </h2>
            {section.sounds.map((entry) => {
              if (entry.missing) {
                return <MissingRow key={entry.label} entry={entry} />;
              }
              const isActiveLoop = entry.isLoop && ALL_LOOP_LABELS[entry.event] === currentLoop;
              return (
                <SoundRow
                  key={`${entry.event}-${entry.label}`}
                  entry={entry}
                  isActiveLoop={isActiveLoop}
                  loopPaused={paused}
                  isActiveOneshot={activeOneshot === entry.label}
                  onPlay={() => handlePlay(entry)}
                  onPause={pauseAudio}
                  onResume={resumeAudio}
                />
              );
            })}
          </div>
        ))}

        <section className="bg-[#0f2660] rounded-2xl border border-[#2a4a8a] p-5">
          <h2 className="text-sm font-black text-[#4dd9d2] mb-3 uppercase tracking-widest">Tuning reference</h2>
          <div className="text-[#7a96c8] text-xs flex flex-col gap-2 leading-relaxed">
            <p><strong className="text-white">Pitch</strong> — <code className="text-[#f6dc53]">freq</code> in Hz. C4=262, D4=294, E4=330, G4=392, A4=440, C5=523, G5=784. Doubling = octave up.</p>
            <p><strong className="text-white">Volume</strong> — <code className="text-[#f6dc53]">gain</code> (0–1) per note, or master volume at top of file.</p>
            <p><strong className="text-white">Waveform</strong> — <code className="text-[#f6dc53]">type</code>: <em>sine</em> = smooth, <em>triangle</em> = bright, <em>square</em> = harsh, <em>sawtooth</em> = buzzy.</p>
            <p><strong className="text-white">Tempo</strong> — <code className="text-[#f6dc53]">BPM</code> at top of each <code className="text-[#f6dc53]">start*Music</code> function.</p>
            <p><strong className="text-white">Loop notes</strong> — <code className="text-[#f6dc53]">beat</code> = when in bar (0–7), <code className="text-[#f6dc53]">dur</code> = length in beats.</p>
          </div>
        </section>

      </div>
    </main>
  );
}
