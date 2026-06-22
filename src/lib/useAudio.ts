"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

// Mute state lives on window so it survives lobby → game page navigation
function getMuted(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as typeof window & { __audioMuted?: boolean };
  return w.__audioMuted ?? false;
}

function setMutedGlobal(muted: boolean) {
  const w = window as typeof window & { __audioMuted?: boolean };
  w.__audioMuted = muted;
  // Apply immediately to the shared master gain if it exists
  const wg = window as typeof window & { __masterGain?: GainNode };
  if (wg.__masterGain) {
    wg.__masterGain.gain.value = muted ? 0 : 0.4;
  }
}

// =============================================================================
// TUNING GUIDE — every number you might want to tweak
// =============================================================================
//
// MASTER VOLUME
//   masterGain → g.gain.value   default: 0.4   range: 0–1
//
// ONE-SHOT SOUNDS  (synthesized via Web Audio API)
//   tone(ctx, dest, freq, type, startTime, duration, gainPeak, fadeIn, fadeOut)
//     freq      — Hz. C4=262, E4=330, G4=392, A4=440, C5=523, G5=784, C6=1046
//     type      — "sine" (smooth) | "triangle" (bright) | "square" (harsh) | "sawtooth" (buzzy)
//     gainPeak  — volume 0–1 for this note
//   noise(ctx, dest, startTime, duration, gainPeak, filterFreq)
//     filterFreq — Hz highpass cutoff: low (~500) = thuddy, high (~6000) = hissy
//
// TIMER TICK  (playTimerTick)
//   freq = 600 + urgency*600  → 600–1200 Hz across the 5s window
//
// MUSIC LOOPS — MP3 files in /public
//   lobby_music               → /lobby_music.mp3   (also used for phase2)
//   phase1_music              → /phase1_music.mp3
//   question_submission_music → /question_submission_music.mp3
//   endgame_music             → /endgame_music.mp3
//   reveal_gong               → /reveal_gong.mp3   (one-shot, played via playMp3Once)
//
// =============================================================================

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const w = window as typeof window & { __audioCtx?: AudioContext };
  if (!w.__audioCtx || w.__audioCtx.state === "closed") {
    w.__audioCtx = new AudioContext();
  }
  return w.__audioCtx;
}

// Called once on the first user gesture. Resumes the AudioContext if suspended,
// then invokes any callback that was waiting for it (e.g. a deferred loop start).
type PendingCb = () => void;
const pendingAfterGesture: PendingCb[] = [];
let gestureListenerAttached = false;

function onFirstGesture() {
  const ctx = getCtx();
  if (ctx?.state === "suspended") {
    ctx.resume().then(() => {
      const cbs = pendingAfterGesture.splice(0);
      cbs.forEach((cb) => cb());
    });
  } else {
    const cbs = pendingAfterGesture.splice(0);
    cbs.forEach((cb) => cb());
  }
}

function ensureGestureListener() {
  if (gestureListenerAttached || typeof window === "undefined") return;
  gestureListenerAttached = true;
  const handler = () => {
    onFirstGesture();
    window.removeEventListener("pointerdown", handler);
    window.removeEventListener("keydown", handler);
  };
  window.addEventListener("pointerdown", handler);
  window.addEventListener("keydown", handler);
}

// Run cb immediately if AudioContext is already running, otherwise defer until
// the first user gesture resumes it.
function runWhenResumed(cb: PendingCb) {
  ensureGestureListener();
  const ctx = getCtx();
  if (ctx && ctx.state === "running") {
    cb();
  } else {
    pendingAfterGesture.push(cb);
  }
}

function masterGain(ctx: AudioContext): GainNode {
  const w = window as typeof window & { __masterGain?: GainNode };
  if (!w.__masterGain || w.__masterGain.context !== ctx) {
    const g = ctx.createGain();
    g.gain.value = getMuted() ? 0 : 0.4; // ← MASTER VOLUME (0–1)
    g.connect(ctx.destination);
    w.__masterGain = g;
  }
  return w.__masterGain;
}

function tone(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  type: OscillatorType,
  startTime: number,
  duration: number,
  gainPeak: number,
  fadeIn = 0.01,
  fadeOut = 0.05,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(gainPeak, startTime + fadeIn);
  gain.gain.setValueAtTime(gainPeak, startTime + duration - fadeOut);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

function noise(
  ctx: AudioContext,
  dest: AudioNode,
  startTime: number,
  duration: number,
  gainPeak: number,
  filterFreq = 3000,
) {
  const bufferSize = Math.ceil(ctx.sampleRate * duration);
  const buf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = filterFreq;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainPeak, startTime);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  src.start(startTime);
}

// --- One-shot sounds ---

function playCountdownDigit(ctx: AudioContext, digit: 1 | 2 | 3) {
  const dest = masterGain(ctx);
  const t = ctx.currentTime;
  //        digit:  3    2    1   ← change pitch per digit
  const freq = digit === 3 ? 330 : digit === 2 ? 440 : 660;
  tone(ctx, dest, freq,     "sine", t,        0.18, 0.55, 0.005, 0.12);
  tone(ctx, dest, freq * 2, "sine", t,        0.14, 0.15, 0.005, 0.08);
  noise(ctx, dest,           t,        0.08, 0.08, 4000);
}

// Subtle "answer received" pop for the TV screen — one per incoming answer
function playAnswerIn(ctx: AudioContext) {
  const dest = masterGain(ctx);
  const t = ctx.currentTime;
  // Short sine blip: 900 Hz, very brief, low volume
  tone(ctx, dest, 900, "sine", t, 0.055, 0.10, 0.003, 0.04);
  // Tiny high click for crispness
  noise(ctx, dest, t, 0.018, 0.025, 6000);
}

function playTimerTick(ctx: AudioContext, urgency: number) {
  const dest = masterGain(ctx);
  const t = ctx.currentTime;
  const freq = 600 + urgency * 600; // 600–1200 Hz across the 5s window
  tone(ctx, dest, freq, "square", t, 0.06, 0.12 + urgency * 0.1, 0.002, 0.04);
}

// Soft whoosh-in for each intro rule slide and the tagline
function playSlideIn(ctx: AudioContext) {
  const dest = masterGain(ctx);
  const t = ctx.currentTime;
  // Quick sine sweep up: 180 → 520 Hz
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(180, t);
  osc.frequency.exponentialRampToValueAtTime(520, t + 0.18);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.18, t + 0.04);
  gain.gain.linearRampToValueAtTime(0, t + 0.22);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(t);
  osc.stop(t + 0.23);
  // Airy noise underlayer
  noise(ctx, dest, t, 0.18, 0.04, 3500);
}

function playLeaderboardFanfare(ctx: AudioContext) {
  const dest = masterGain(ctx);
  const t = ctx.currentTime;
  const run = [392, 440, 494, 523, 659]; // ascending run
  run.forEach((f, i) => tone(ctx, dest, f, "triangle", t + i * 0.075, 0.12, 0.3, 0.005, 0.06));
  const chord = [523, 659, 784]; // held chord after run
  chord.forEach((f) => tone(ctx, dest, f, "sine", t + run.length * 0.075, 0.55, 0.225, 0.01, 0.35));
  noise(ctx, dest, t + run.length * 0.075, 0.2, 0.053, 4000);
}

// Soft tick as score counts up on the leaderboard
function playScoreTick(ctx: AudioContext) {
  const dest = masterGain(ctx);
  const t = ctx.currentTime;
  tone(ctx, dest, 880, "sine", t, 0.04, 0.085, 0.002, 0.03);
}

// Soft "bloop" when a new player joins the lobby
function playPlayerJoin(ctx: AudioContext) {
  const dest = masterGain(ctx);
  const t = ctx.currentTime;
  // Two-note ascending blip: G4 → C5
  tone(ctx, dest, 392, "sine", t,        0.09, 0.18, 0.005, 0.06);
  tone(ctx, dest, 523, "sine", t + 0.07, 0.12, 0.20, 0.005, 0.08);
}

// --- Music loops ---

interface MusicLoop { stop: () => void }

// Loads an MP3 from /public, connects it through the master gain, and loops it.
// Defers playback until the AudioContext is running (survives autoplay policy).
// Falls back to silence (no error) if the file can't be fetched.
function startMp3Loop(ctx: AudioContext, url: string): MusicLoop {
  const dest = masterGain(ctx);
  let source: AudioBufferSourceNode | null = null;
  let stopped = false;

  fetch(url)
    .then((r) => r.arrayBuffer())
    .then((buf) => ctx.decodeAudioData(buf))
    .then((decoded) => {
      if (stopped) return;
      runWhenResumed(() => {
        if (stopped) return;
        source = ctx.createBufferSource();
        source.buffer = decoded;
        source.loop = true;
        source.connect(dest);
        source.start();
      });
    })
    .catch(() => { /* file missing — silent fallback */ });

  return {
    stop: () => {
      stopped = true;
      try { source?.stop(); } catch { /* already stopped */ }
      source = null;
    },
  };
}

// Fetches and plays an MP3 once (no loop). Defers until AudioContext is running.
function playMp3Once(ctx: AudioContext, url: string) {
  const dest = masterGain(ctx);
  fetch(url)
    .then((r) => r.arrayBuffer())
    .then((buf) => ctx.decodeAudioData(buf))
    .then((decoded) => {
      runWhenResumed(() => {
        const src = ctx.createBufferSource();
        src.buffer = decoded;
        src.connect(dest);
        src.start();
      });
    })
    .catch(() => { /* file missing — silent fallback */ });
}

function startLobbyMusic(ctx: AudioContext): MusicLoop {
  return startMp3Loop(ctx, "/lobby_music.mp3");
}

function startPhase1Music(ctx: AudioContext): MusicLoop {
  return startMp3Loop(ctx, "/phase1_music.mp3");
}

// Phase 2 reuses the lobby/round-2 track (same MP3 as lobby)
function startPhase2Music(ctx: AudioContext): MusicLoop {
  return startMp3Loop(ctx, "/lobby_music.mp3");
}

// --- Public hook ---

export type AudioEvent =
  | "phase1_start"
  | "phase2_start"
  | "phase3_start"
  | "leaderboard_start"
  | "answer_in"
  | "score_tick"
  | "slide_in"
  | "player_join"
  | "countdown_3"
  | "countdown_2"
  | "countdown_1"
  | "timer_tick"
  | "lobby_music"
  | "question_submission_music"
  | "endgame_music"
  | "stop_music";

// Name shown in the test UI for each looping event
const LOOP_LABELS: Partial<Record<AudioEvent, string>> = {
  lobby_music:               "Lobby Music",
  question_submission_music: "Question Submission Music",
  phase1_start:              "Phase 1 Music",
  phase2_start:              "Phase 2 Music",
  endgame_music:             "Endgame Music",
};

const SESSION_AUDIO_KEY = "tv_audio_started";

function getAudioStarted(): boolean {
  if (typeof window === "undefined") return false;
  // Check sessionStorage first — survives hard navigations (window.location.href)
  // within the same tab but not across new tabs/windows.
  try { if (sessionStorage.getItem(SESSION_AUDIO_KEY) === "1") return true; } catch { /* private browsing */ }
  const w = window as typeof window & { __audioStarted?: boolean };
  return w.__audioStarted ?? false;
}

export function useAudio() {
  const loopRef = useRef<MusicLoop | null>(null);
  const lastPhaseRef = useRef<string | null>(null);
  const currentLoopEventRef = useRef<AudioEvent | null>(null);
  const [currentLoop, setCurrentLoop] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  // Initialize to false to match SSR, then synchronously correct before first paint
  const [muted, setMuted] = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);
  useLayoutEffect(() => {
    setMuted(getMuted());
    setAudioStarted(getAudioStarted());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startAudio = useCallback(() => {
    const w = window as typeof window & { __audioStarted?: boolean };
    w.__audioStarted = true;
    try { sessionStorage.setItem(SESSION_AUDIO_KEY, "1"); } catch { /* private browsing */ }
    setAudioStarted(true);
    onFirstGesture();
  }, []);

  const toggleMute = useCallback(() => {
    const next = !getMuted();
    setMutedGlobal(next);
    setMuted(next);
  }, []);

  const stopLoop = useCallback(() => {
    loopRef.current?.stop();
    loopRef.current = null;
    currentLoopEventRef.current = null;
    setCurrentLoop(null);
    setPaused(false);
  }, []);

  const pauseAudio = useCallback(() => {
    if (!loopRef.current) return;
    loopRef.current.stop();
    loopRef.current = null;
    setPaused(true);
  }, []);

  const resumeAudio = useCallback(() => {
    const ctx = getCtx();
    // Guard against stale paused state: if a loop is already running, don't double-start
    if (!ctx || !paused || !currentLoopEventRef.current || loopRef.current !== null) return;
    const event = currentLoopEventRef.current;
    if (event === "lobby_music")               loopRef.current = startLobbyMusic(ctx);
    if (event === "question_submission_music") loopRef.current = startMp3Loop(ctx, "/question_submission_music.mp3");
    if (event === "phase1_start")              loopRef.current = startPhase1Music(ctx);
    if (event === "phase2_start")              loopRef.current = startPhase2Music(ctx);
    if (event === "endgame_music")             loopRef.current = startMp3Loop(ctx, "/endgame_music.mp3");
    setPaused(false);
  }, [paused]);

  const play = useCallback((event: AudioEvent, opts?: { urgency?: number }) => {
    const ctx = getCtx();
    if (!ctx) return;

    // For loop events the deferral is handled inside startMp3Loop via runWhenResumed.
    // For one-shots, resume inline — they fire in direct response to user gestures
    // (countdown digits, stingers triggered by host actions) so resume will succeed.
    if (ctx.state === "suspended") ctx.resume();

    switch (event) {
      case "countdown_3":       playCountdownDigit(ctx, 3); break;
      case "countdown_2":       playCountdownDigit(ctx, 2); break;
      case "countdown_1":       playCountdownDigit(ctx, 1); break;
      case "answer_in":         playAnswerIn(ctx); break;
      case "score_tick":        playScoreTick(ctx); break;
      case "slide_in":          playSlideIn(ctx); break;
      case "player_join":       playPlayerJoin(ctx); break;
      case "timer_tick":        playTimerTick(ctx, opts?.urgency ?? 0); break;
      case "phase3_start":      playMp3Once(ctx, "/reveal_gong.mp3"); break;
      case "leaderboard_start": playLeaderboardFanfare(ctx); break;

      case "stop_music":        stopLoop(); break;
      case "lobby_music": {
        stopLoop();
        loopRef.current = startLobbyMusic(ctx);
        currentLoopEventRef.current = "lobby_music";
        setCurrentLoop(LOOP_LABELS.lobby_music!);
        break;
      }
      case "question_submission_music": {
        stopLoop();
        loopRef.current = startMp3Loop(ctx, "/question_submission_music.mp3");
        currentLoopEventRef.current = "question_submission_music";
        setCurrentLoop(LOOP_LABELS.question_submission_music!);
        break;
      }
      case "phase1_start": {
        if (currentLoopEventRef.current === "phase1_start") break; // already playing
        stopLoop();
        loopRef.current = startPhase1Music(ctx);
        currentLoopEventRef.current = "phase1_start";
        setCurrentLoop(LOOP_LABELS.phase1_start!);
        break;
      }
      case "phase2_start": {
        if (currentLoopEventRef.current === "phase2_start") break; // already playing
        stopLoop();
        loopRef.current = startPhase2Music(ctx);
        currentLoopEventRef.current = "phase2_start";
        setCurrentLoop(LOOP_LABELS.phase2_start!);
        break;
      }
      case "endgame_music": {
        stopLoop();
        loopRef.current = startMp3Loop(ctx, "/endgame_music.mp3");
        currentLoopEventRef.current = "endgame_music";
        setCurrentLoop(LOOP_LABELS.endgame_music!);
        break;
      }
    }
  }, [stopLoop]);

  useEffect(() => {
    return () => stopLoop();
  }, [stopLoop]);

  const syncPhase = useCallback((phase: string | null) => {
    if (phase === lastPhaseRef.current) return;
    const prev = lastPhaseRef.current;
    lastPhaseRef.current = phase;

    // On cold page load (prev === null) only start background loops — skip one-shot stingers
    if (prev === null) {
      if (phase === "lobby")               play("lobby_music");
      if (phase === "question_submission") play("question_submission_music");
      if (phase === "phase1")              play("phase1_start");
      if (phase === "phase2")              play("phase2_start");
      if (phase === "ended")               play("endgame_music");
      return;
    }

    if (phase === "lobby")               play("lobby_music");
    if (phase === "question_submission") play("question_submission_music");
    if (phase === "phase1")              play("phase1_start");
    if (phase === "phase2")              play("phase2_start");
    if (phase === "phase3")              { stopLoop(); play("phase3_start"); }
    if (phase === "ended")               play("endgame_music");
    if (phase === "countdown" || phase === "leaderboard") stopLoop();
  }, [play, stopLoop]);

  return { play, syncPhase, currentLoop, paused, pauseAudio, resumeAudio, muted, toggleMute, audioStarted, startAudio };
}
