# Future Features

## Better Audio Sources

The current audio system synthesizes all sounds using the Web Audio API (oscillators + noise). This works and costs nothing, but the output is inherently "beepy." Here are the upgrade paths, in order of effort:

### Option A — Real Audio Files (Recommended next step)
Host `.mp3` / `.ogg` files in `public/sounds/` and load them with the browser's `<audio>` element or `Howler.js`.

**Free asset sources:**
- [freesound.org](https://freesound.org) — CC-licensed SFX. Search "game sting", "countdown beep", "fanfare". Download as mp3, drop in `public/sounds/`.
- [pixabay.com/music](https://pixabay.com/music/) — Royalty-free background loops. No attribution required. Good for lobby/phase music.
- [opengameart.org](https://opengameart.org) — Game-specific packs (UI clicks, transition whooshes, jingles).
- [zapsplat.com](https://zapsplat.com) — Free with a free account. Attribution required on free tier.

**How to wire in:** Replace each `play*` function in `useAudio.ts` with an `Audio` object or Howler sprite. The hook interface (`play(event)`, `syncPhase(phase)`) stays identical — only the internals change.

**Recommended library:** [Howler.js](https://howlerjs.com) (`npm install howler`) — handles autoplay policy, mobile unlock, sprite sheets (single file, multiple sounds), and seamless looping. ~20kb gzipped.

### Option B — Tone.js for Better Synthesis
[Tone.js](https://tonejs.github.io) (`npm install tone`) wraps Web Audio with a musical API: proper schedulers, instruments (synths, samplers), effects (reverb, delay, chorus), and a transport clock.

Upgrade path: replace the raw `tone()` / `noise()` helpers in `useAudio.ts` with `Tone.PolySynth`, `Tone.Reverb`, `Tone.Sequence`. The music loops would become much cleaner to write and sound noticeably richer.

**Cost:** ~200kb gzipped. Worth it if you want to stay file-free.

### Option C — AI-Generated Music
Services that output royalty-free game music loops:
- [Suno](https://suno.com) — generates full tracks from text prompts. Export as mp3.
- [Udio](https://udio.com) — similar, good for short loopable clips.
- [Mubert](https://mubert.com) — API-based generative music, can produce continuous adaptive streams.

Workflow: prompt for "upbeat casual party game loop 120bpm", export a 30s clip, loop it with Howler. Takes ~20 minutes.

### Option D — Volume Controls & Mute
Add a mute/volume slider button in the game UI (especially the TV/host pages). The master gain node in `useAudio.ts` already exists — just expose a `setVolume(0–1)` function and persist the preference in `localStorage`.

### What to Prioritize
1. **Short-term:** Grab 5–6 free SFX from freesound.org (submit ding, countdown pops, reveal stinger) — these make the biggest perceptual difference for the least effort.
2. **Medium-term:** Use Suno/Udio to generate 3 background loops (lobby, phase1, phase2) as mp3s. Drop-in replacements for the synthesized loops.
3. **Long-term:** Add Howler.js, consolidate all sounds into a sprite sheet, add a volume control to the TV lobby.
