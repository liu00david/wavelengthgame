# Consensus — Current Implementation

A real-time party game about reading the room. Players answer questions, then predict what the group said — points go to whoever best understands the crowd.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router), React |
| Styling | Tailwind CSS v4 |
| Real-time | PartyKit (WebSocket server) |
| Frontend deploy | Vercel |
| Server deploy | partykit.dev |

---

## Project Structure

```
src/
  app/
    page.tsx                        # Landing page — host or join
    layout.tsx                      # Root layout, metadata
    opengraph-image.tsx             # OG image for social sharing
    globals.css                     # Global styles + keyframe animations
    how-to-play/page.tsx            # How to play guide
    host/[roomCode]/
      page.tsx                      # Host lobby — settings, player list
      game/page.tsx                 # Host game controls (skip, pause, advance)
      summary/page.tsx              # Post-game summary for host
    play/[roomCode]/
      page.tsx                      # Player join / nickname entry
      game/page.tsx                 # Player game screen (mobile)
    tv/[roomCode]/
      page.tsx                      # TV lobby screen (QR code, player list)
      game/page.tsx                 # TV display screen (questions, results, podium)
    api/room/[code]/route.ts        # REST endpoint — check if room exists
  lib/
    types.ts                        # Shared TypeScript types (GameState, PlayerScore, etc.)
    theme.ts                        # Design tokens (colors, bg classes, button variants)
    useParty.ts                     # PartyKit WebSocket hook
party/
  index.ts                          # PartyKit server — all game logic
docs/
  CURRENT_IMPLEMENTATION.md        # This file
  FUTURE_FEATURES.md               # Planned features
```

---

## Routes

| URL | Who sees it |
|-----|------------|
| `/` | Landing — host or join a game |
| `/host/[roomCode]` | Host — lobby settings and player management |
| `/host/[roomCode]/game` | Host — in-game controls (skip, pause, kick, advance) |
| `/host/[roomCode]/summary` | Host — post-game breakdown per round |
| `/play/[roomCode]` | Player — nickname entry |
| `/play/[roomCode]/game` | Player — game screen on phone |
| `/tv/[roomCode]` | TV — lobby with QR code |
| `/tv/[roomCode]/game` | TV — shared display (questions, results, leaderboard, podium) |
| `/how-to-play` | Rules page |

---

## Game Phases

```
lobby → question_submission (optional) → countdown → phase1 → phase2 → phase3 → leaderboard → ... → ended
```

| Phase | Description |
|-------|-------------|
| `lobby` | Players join, host configures settings |
| `question_submission` | Players submit their own questions (player mode only) |
| `countdown` | 3-slide rules animation + 3-2-1 countdown (~18s) |
| `phase1` | Answer the question (hidden from others) |
| `phase2` | Predict the group's result |
| `phase3` | Reveal + scoring |
| `leaderboard` | Between-round standings with animated rank shuffle |
| `ended` | Game Over animation → podium |

---

## Question Types

| Type | Phase 1 | Phase 2 Prediction |
|------|---------|--------------------|
| `binary` | Tap YES or NO | How many said YES? (0–N slider) |
| `multiple_choice` | Pick one of 2–4 options | Which option was most popular? |
| `scale` | Drag a slider (1–10) | What was the group average? (0.1 step) |

Question character limits: 60 chars for question text, 25 chars per choice.

---

## Question Modes

- **Game Questions** — drawn from the built-in bank (~116 questions), shuffled each game. Mix of binary, multiple choice, and scale.
- **Player Questions** — players submit their own questions before the game starts. Host can delete submissions. Game begins once enough are collected (≥ round count). Questions are shuffled before play.

Question bank lives in `party/index.ts` → `PROMPTS` array.

---

## Scoring

Max base score per round: **1,000 points**.

### Yes / No
`max(0, round(1000 − 2000 × |guess − actual| / N))`

Degrades linearly — you reach 0 when you're off by 50% of N.

### Scale (1–10)
`max(0, round(1000 − 250 × diff²))`

Off by 2.0 or more = 0 points. Steep quadratic drop.

### Multiple Choice
`max(0, round(1125 − 500 × winner_votes / N))` — correct guess only, 0 if wrong.

Rarer winning answers score higher. Ties: any tied winner counts as correct.

### Double Down
One use per game per player, enabled in Phase 2 before submitting:
- Correct → **2× base score**
- Wrong → **0 points**

---

## Server (`party/index.ts`)

The PartyKit server handles all game state. Key responsibilities:

- Room lifecycle: create, lock, disband, play again
- Phase transitions with server-side timers (phase1, phase2 auto-advance)
- Storing `phase1Answers: Map<string, string|number>` and `phase2Predictions: Map<string, string|number>`
- Computing `actualResult` and per-player `scores` at end of phase2
- Building `leaderboard: PlayerScore[]` with `total`, `roundScore`, `rank`
- Saving `RoundResult` per round for the summary page
- Player kick, pause/resume timer, skip question
- Question submission management (player mode)
- Broadcasting `GameState` to all connections after every state change

---

## TV Screen Highlights (`tv/[roomCode]/game/page.tsx`)

The TV is the shared display — ~1100 lines, contains all visual components:

- `AnswerBar` — animated horizontal bar with winner ✔ / loser ✗ icons; separate `barHeight` props for binary vs MC
- `ScaleBar` — animated gradient fill for scale results
- `Phase3View` — results reveal per question type
- `LeaderboardView` — animated rank-shuffle: shows previous order first, then slides rows to new positions after 2s, with count-up animation
- `LeaderboardRow` — absolutely positioned row with CSS `translateY` transition
- `GameOverIntro` — "GAME OVER" → "Who figured out the consensus?" slide sequence
- `TVPodiumSlot` — podium with fireworks/sparks canvas animation
- `Fireworks` — canvas-based spark bursts, continuous left/right
- `CountdownOverlay` — 3-slide rules animation before game start
- `FloatingQuestionMarks` — animated background elements during question submission phase
- `CircleTimer` — SVG countdown ring, turns red at ≤5s

---

## Player Screen Highlights (`play/[roomCode]/game/page.tsx`)

Mobile-first player interface:

- `Phase1View` — question + answer input per type (binary buttons, MC option list, scale slider)
- `Phase2View` — prediction input + Double Down toggle
- `Phase3View` — score reveal, round points, rank delta (hidden on final round to preserve suspense)
- `DoubleDownToggle` — yellow border active state, one-use enforcement
- `CountdownScreen` — mirrored rules slides synced to TV countdown

---

## Host Screen Highlights (`host/[roomCode]/game/page.tsx`)

- Live game status (phase, answered count, timer)
- Skip, Pause/Resume, Kick player controls
- Advance phase buttons (Phase 3 → leaderboard, leaderboard → next round)
- Final round button: "Go to game summary!" instead of next round
- Question submission form (player mode): binary, scale, or multiple choice with 2–4 options

---

## Theme (`src/lib/theme.ts`)

All design tokens in one place. Key colors:

| Token | Value | Use |
|-------|-------|-----|
| `bgPage` | `#081c48` | Page background |
| `bgSurface` | `bg-[#0d1e54]` | Card background |
| `textYellow` | `text-[#f6dc53]` | Titles, CTAs |
| `textTeal` / `textCyan` | `#25a59f` / `#4dd9d2` | YES, success |
| `textRed` | `text-[#e03060]` | NO, danger |
| `textPrimary` | `text-[#7862FF]` | Purple accent |
| `textMuted` | `text-[#6b80b8]` | Secondary text |

---

## State Persistence

- `sessionStorage` — settings (numQuestions, phase1Time, phase2Time, gameMode) and summary data are saved per room code and restored on next game start
- No database — all state is ephemeral in PartyKit server memory
- No auth — nicknames are the only identity; emoji avatars assigned client-side
