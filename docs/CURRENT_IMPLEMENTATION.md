# Consensus — Current Implementation

A real-time party game about reading the room. Players answer questions, then predict what the group said — points go to whoever best understands the crowd.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router), React |
| Styling | Tailwind CSS v4 |
| Real-time | PartyKit (WebSocket server) |
| Database | Supabase (Postgres) |
| Frontend deploy | Vercel |
| Server deploy | partykit.dev |

---

## Project Structure

```
src/
  app/
    page.tsx                        # Landing page — host or join
    layout.tsx                      # Root layout, metadata
    register/page.tsx               # Host registration — name entry, room code generation
    host/[roomCode]/
      page.tsx                      # Host lobby — settings, player list, question prep
      game/page.tsx                 # Host game controls (skip, pause, advance)
      summary/page.tsx              # Post-game summary for host
    play/[roomCode]/
      page.tsx                      # Player join / nickname entry
      game/page.tsx                 # Player game screen (mobile)
    tv/[roomCode]/
      page.tsx                      # TV lobby screen (QR code, player list)
      game/page.tsx                 # TV display screen (questions, results, podium)
    api/
      register/route.ts             # POST — create host record, generate room code
      room/[code]/route.ts          # GET — check room existence (Supabase + PartyKit)
      room/[code]/deactivate/route.ts  # POST — mark room inactive in Supabase
  lib/
    types.ts                        # Shared TypeScript types (GameState, PlayerScore, etc.)
    prompts.ts                      # Question banks (General, Coworkers, Hot Seat) + metadata
    theme.ts                        # Design tokens (colors, bg classes, button variants)
    useParty.ts                     # PartyKit WebSocket hook
    supabase.ts                     # Supabase client (service role, server-only)
party/
  index.ts                          # PartyKit server — all game logic + Supabase writes
docs/
  CURRENT_IMPLEMENTATION.md        # This file
  DATABASE.md                      # Supabase table schemas and write timeline
  FUTURE_FEATURES.md               # Planned features
  GAME_DESIGN.md                   # Game design notes
  SOUNDS.md                        # Audio notes
```

---

## Routes

| URL | Who sees it |
|-----|------------|
| `/` | Landing — host or join a game |
| `/register` | Host — enter name, get room code |
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
lobby → [question_submission] → countdown → phase1 → phase2 → phase3 → leaderboard → … → ended
```

| Phase | Description |
|-------|-------------|
| `lobby` | Players join, host configures settings |
| `question_submission` | Players submit questions (player mode only) |
| `countdown` | 3-slide rules animation + 3-2-1 countdown (~14s) |
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

Question character limits: 60 chars for question text, 25 chars per MC option.

---

## Question Modes

Three modes, selected per game in the lobby:

| Mode | Description |
|------|-------------|
| **Game** | Built-in question bank, shuffled each game. Host picks a category. |
| **Players** | Players submit questions during a collection phase before the game. Host can delete, choose shuffle order, then begin. |
| **Host** | Host enters all questions in the lobby before locking — via a form or CSV paste. Host can reorder (or randomize) before starting. |

### Question Banks (Game mode)

| Bank | Questions | Vibe |
|------|-----------|------|
| General | ~212 | Mixed — relationships, preferences, would-you-rather |
| Coworkers | ~37 | Work-safe, office-friendly |
| Hot Seat | ~57 | Spicy, party-appropriate |

Banks live in `src/lib/prompts.ts` as `PROMPTS_BY_BANK`. `BANK_META` holds display labels, emojis, and descriptions.

### CSV Format (Host mode)

```
type,text,opt1,opt2,opt3,opt4,labelLow,labelHigh
binary,Can you swim?
scale,How spicy do you like food?,,,,,Mild,Nuclear
mc,Best pizza topping?,Pepperoni,Mushrooms,Pineapple,Plain
```

Types: `binary`, `scale`, `mc`. Validate before import; overflow rows are discarded with a warning.

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
One use per game per player, submitted in Phase 2:
- Correct → **2× base score**
- Wrong → **0 points**

---

## Database (Supabase)

Four tables. All writes are non-blocking and happen at game end. See `docs/DATABASE.md` for full schema.

| Table | When written |
|-------|-------------|
| `hosts` | On registration (before game) |
| `games` | At game end |
| `game_rounds` | At game end (batched) |
| `custom_questions` | At game end — player mode and host mode only |

`hosts` rows are swept to `active: false` after 24 hours on the next registration call.

---

## Auth / Session Model

No traditional auth. Security is token-based:

- **Host token** — 32-char random string generated at registration, stored in `localStorage` and in Supabase `hosts.host_token`. Required to join as host or rejoin after disconnect.
- **Room code** — 4-letter consonant code, checked for active uniqueness before generation.
- **Player session** — nickname + room code stored in `localStorage`. Rejoin is allowed within a 10-minute grace window after disconnect.
- **Duplicate tab detection** — `BroadcastChannel` ping/pong on player page; server-side connection check on host page.

---

## Server (`party/index.ts`)

The PartyKit server owns all game state in memory. Key responsibilities:

- Room lifecycle: join, rejoin, lock, disband, play again
- Host token validation via Supabase on join and rejoin
- Phase transitions with server-side timers (phase1, phase2 auto-advance)
- Storing `phase1Answers` and `phase2Predictions` per player
- Computing `actualResult` and per-player `scores` at end of phase2
- Building `leaderboard` with `total`, `roundScore`, `rank`
- Player kick, pause/resume timer, skip question
- Question submission management (player mode), question deletion (host)
- 10-minute rejoin grace period: disconnected players stay in lobby as greyed-out; host disconnect broadcasts `host_disconnected` to players
- Deactivating room in Supabase on explicit disband or host timeout
- Saving game data to Supabase at game end

---

## Theme (`src/lib/theme.ts`)

All design tokens in one place. Key colors:

| Token | Value | Use |
|-------|-------|-----|
| `bgPage` | `#081c48` | Page background |
| `bgSurface` | `bg-[#0d1e54]` | Card background |
| `textYellow` | `text-[#f6dc53]` | Titles, CTAs |
| `textCyan` | `#4dd9d2` | YES, success |
| `textRed` | `text-[#e03060]` | NO, danger |
| `textPrimary` | `text-[#7862FF]` | Purple accent |
| `textMuted` | `text-[#6b80b8]` | Secondary text |

---

## State Persistence

- `localStorage` — host name, host token, host session (room code), player session (room code + nickname)
- `sessionStorage` — game settings (numQuestions, timings, mode) saved on lock, restored on next game
- Supabase — host records and completed game data
- PartyKit server memory — all live game state (lost on server restart)
