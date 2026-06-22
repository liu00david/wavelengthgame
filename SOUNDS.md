# Audio System — Consensus Game

All audio plays on the **TV screen** (`/tv/[roomCode]` and `/tv/[roomCode]/game`).
Player phones also hear the last-5-second timer ticks during phase 1 and phase 2.
The `/audio-test` page exists for development tuning only.

A 🔊/🔇 mute button sits in the bottom-right corner of every TV screen. Clicking it
silences all audio instantly (sets master gain to 0) and persists across the lobby→game
page navigation via `window.__audioMuted`.

---

## Sounds by stage

### Lobby
Players join; the room code and QR code are shown on screen.

| Sound | Trigger | Notes |
|-------|---------|-------|
| **Lobby music loop** | TV page mounts | Gentle 90 BPM pad loop. Floating C/G chords (sine), soft triangle melody, quiet sine bass. Loops until the game starts. |

---

### Question Submission *(player-questions mode only)*
Players submit their own prompts before the game begins.

| Sound | Trigger | Notes |
|-------|---------|-------|
| *(silence)* | Phase enters | Music stops. No sounds during question collection — keeps focus on writing. |

---

### Countdown
18-second animated intro (rules → tagline → 3 2 1) shown before round 1.

| Sound | Trigger | Notes |
|-------|---------|-------|
| **Countdown 3** | "3" animates in (t = 15 s) | Sine pop at 330 Hz + octave overtone + noise click |
| **Countdown 2** | "2" animates in (t = 16 s) | Sine pop at 440 Hz + octave overtone + noise click |
| **Countdown 1** | "1" animates in (t = 17 s) | Sine pop at 660 Hz + octave overtone + noise click |

Each digit sound is fired by `CountdownOverlay` at the exact moment the number appears,
using a stable `useCallback` ref so WebSocket updates cannot restart the timer chain.

---

### Phase 1 — Answer
Players submit their answer to the question on their phones.

| Sound | Trigger | Notes |
|-------|---------|-------|
| **Phase 1 stinger** | Phase transition (live only) | 4-note ascending arpeggio C E G C (triangle) + noise burst. Not fired on page refresh mid-game. |
| **Phase 1 music loop** | Immediately after stinger | Upbeat 120 BPM. Sawtooth bass (I–IV–V–I), bright triangle melody, kick on beats 1/3, snare on 2/4, hi-hat eighths. |
| **Answer pop** | Each player submits | Short 900 Hz sine blip + high noise click. Fires once per incoming answer on the TV. |
| **Timer tick** | Last 5 seconds (TV + player phones) | Square wave, pitch rising 600 → 1200 Hz over the 5-second window. One tick per integer second: 5, 4, 3, 2, 1. |

> If zero players answered phase 1, the server skips phase 2 entirely.

---

### Phase 2 — Predict
Players who answered in phase 1 now predict what the crowd answered.

| Sound | Trigger | Notes |
|-------|---------|-------|
| **Phase 2 stinger** | Phase transition (live only) | Tense descending line: A F# D (sine) + low sawtooth drone. |
| **Phase 2 music loop** | Immediately after stinger | Brooding 100 BPM. Sawtooth bass (Am→F→C→E), sine melody, slow pulse pad, kick on 1/3, snare on 2/4. |
| **Answer pop** | Each player submits their prediction | Same 900 Hz blip as phase 1. |
| **Timer tick** | Last 5 seconds (TV + player phones) | Same rising tick as phase 1. |

---

### Phase 3 — Reveal
The host manually advances here. Everyone's answers are shown on the TV.

| Sound | Trigger | Notes |
|-------|---------|-------|
| **Reveal stinger** | Phase transition | Music stops first. Then: 6-burst snare roll (noise, 60ms apart, building volume) → C major 7 chord (262/330/392/494 Hz sine, 500ms) + noise splash. |

No loop plays during the reveal. It's quiet while the host walks through the results.

---

### Leaderboard *(between rounds, not after the last round)*
Scores for the just-completed round. Host clicks "Next Round" to continue.

| Sound | Trigger | Notes |
|-------|---------|-------|
| **Leaderboard fanfare** | Phase transition | 5-note ascending run G A B C E (triangle, 75ms apart) → held G major chord (523/659/784 Hz sine, 550ms) + noise splash. |

> After the **final** round, the server skips the leaderboard phase and goes directly to
> `ended` — the fanfare does not play at end-of-game.

---

### Game Over — Podium (`ended`)
Final standings shown after all rounds are complete.

| Sound | Trigger | Notes |
|-------|---------|-------|
| **Game over jingle** | Live transition only (not on refresh) | 5-note melody G A B C C (triangle + sine octave doublings), then a C major chord (523/659/784/1046 Hz) held 700ms. |

---

## Architecture

- **Engine:** Web Audio API — zero audio files, all synthesized with oscillators and noise buffers.
- **Singleton context:** Shared via `window.__audioCtx` so hook instances across lobby and game pages share one context.
- **Master gain:** `window.__masterGain` (0.4 default) — single output point for all sounds. Mute sets it to 0.
- **Mute persistence:** `window.__audioMuted` carries the mute state across page navigations.
- **Loops:** Lookahead `setTimeout` scheduler, ~200ms ahead, for gapless looping.
- **Hook:** `useAudio()` in `src/lib/useAudio.ts`. Exports `play(event, opts?)`, `syncPhase(phase)`, `muted`, `toggleMute`, plus test-UI helpers `currentLoop`, `paused`, `pauseAudio`, `resumeAudio`.

### `syncPhase` — live transition guard

`syncPhase` records the previous phase in a ref. On cold page load (`prev === null`) it
only starts lobby music if the current phase is `lobby`, and skips all stingers. This
prevents fanfares and jingles from firing on a browser refresh mid-game.

---

## Sound inventory

### Background loops

| Event | Description |
|-------|-------------|
| `lobby_music` | Gentle 90 BPM pad loop |
| `phase1_start` | Upbeat 120 BPM loop |
| `phase2_start` | Tense 100 BPM minor loop |

### Stingers and one-shots

| Event | Description |
|-------|-------------|
| `countdown_3` / `countdown_2` / `countdown_1` | Pre-game digit pops (330/440/660 Hz) |
| `phase3_start` | Snare roll → C maj7 chord (reveal) |
| `leaderboard_start` | Ascending run + held chord |
| `game_over` | 5-note victory jingle |
| `answer_in` | Subtle 900 Hz blip per incoming answer |
| `timer_tick` | Rising square wave tick (urgency 0–1) |
| `stop_music` | Stops any running loop |

### Timer tick urgency scale

| Seconds left | `urgency` | Frequency |
|-------------|-----------|-----------|
| 5 | 0.0 | 600 Hz |
| 4 | 0.2 | 720 Hz |
| 3 | 0.4 | 840 Hz |
| 2 | 0.6 | 960 Hz |
| 1 | 0.8 | 1080 Hz |

---

## Adding a new sound

1. Write a `play*` function in `src/lib/useAudio.ts` using `tone()` and/or `noise()`.
2. Add the event name to the `AudioEvent` union type.
3. Add a `case` in the `play` switch inside `useAudio()`.
4. Fire it from the appropriate TV page effect.
5. Add an entry in `src/app/audio-test/page.tsx` to test it.

## Switching to real audio files

See `FUTURE_FEATURES.md` — Option A (Howler.js + files in `public/sounds/`) is the
recommended upgrade path. The `play(event)` hook interface stays identical; only the
internals of each `play*` function change.
