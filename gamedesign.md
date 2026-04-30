# Game Design Document: Consensus

## What Is It

Consensus is a real-time "Wisdom of the Crowds" party game. Players win by accurately predicting what the group said — not by having the right answer, but by reading the room.

Played with a **TV screen** (shared display), **one host device**, and **individual phones** for each player.

---

## Game Flow

### Lobby
- Host creates a room and shares the room code (or QR code on TV)
- Players join on their phones
- Host configures: number of rounds (5–25), answer timer (15–60s), predict timer (15–60s), question mode (Game or Players)
- Minimum 2 players to start
- Host locks the room to start — no new players can join mid-game (existing players can rejoin)

### Question Submission Mode (optional)
If **Players** mode is selected, a pre-game submission phase opens:
- All players submit questions on their phones (binary, multiple choice, or scale)
- TV shows live count of submitted questions
- Host can delete individual submissions
- Once enough questions are collected (≥ round count), host starts the game
- Questions are shuffled before play begins

### Rules Animation
Before the first round, a 3-slide animation plays on all screens:
1. **Phase 1: Answer** — answer honestly
2. **Phase 2: Predict** — guess what the room said
3. **Score: Double Down** — risk your token for 2× points
Then a 3-2-1 countdown.

### Each Round: 3 Phases

#### Phase 1 — Answer (default 20s)
A question appears on the TV and player phones. Every player answers privately. Answers are hidden from others until reveal.

**Question types:**
- **Yes / No** — binary choice (large YES / NO buttons)
- **Multiple Choice** — pick one of 4 labeled options (A/B/C/D)
- **Scale 1–10** — drag a slider (1 decimal precision)

If nobody answers before time runs out, the round is skipped.

#### Phase 2 — Predict (default 30s)
Players who answered Phase 1 predict the room's aggregate result:

| Type | Prediction |
|------|------------|
| Yes / No | How many said NO / YES? (0 to N, slider) |
| Multiple Choice | Which option was most popular? (tap to pick) |
| Scale 1–10 | What was the average? (slider, 0.1 step) |

Players who missed Phase 1 are locked out.

**Double Down** — one per game, toggle before submitting:
- Correct: **2× points**
- Wrong: **0 points**

#### Phase 3 — Reveal
TV animates the real result (animated bars, scale fill, YES/NO breakdown). Points awarded. Host clicks to advance.

### Between Rounds
Leaderboard screen shows current standings with per-round score deltas. Top player shown in white.

### End of Game
1. "Game Over!" → "Who figured out the consensus?" animation (5s total)
2. Podium screen with confetti — top 3 on podium, remaining players listed below
3. Host options: View Game Summary, Play Again, Disband Room

---

## Host Controls

- **Skip** — immediately end the current phase
- **Pause / Resume** — freeze the timer
- **Kick Player** — remove a player; auto-advances phase if all remaining players answered
- **Next Question / Go to Round Results** — advance from Phase 3 to leaderboard, or leaderboard to next round
- **Disband Room** — close the room and return everyone to home

---

## Connectivity

- Players who close the tab appear disconnected (grey dot) but can rejoin with the same nickname within a grace window
- Voluntary leave removes the player from the lobby immediately
- Host disconnects: room persists for 2 minutes, then auto-disbands
- Duplicate tab detection: second tab is blocked with an error screen

---

## Question Bank (Game Mode)

116 hardcoded questions, shuffled each game. Three categories:
- **Binary (40)** — controversial opinions, social behaviors
- **Multiple Choice (40)** — lifestyle, preferences, hypotheticals
- **Scale (36)** — personality traits, self-ratings, tendencies

See `party/index.ts` → `PROMPTS` array for the full list.

---

## Theme

Dark navy base with purple, yellow, teal, and red accents. See `src/lib/theme.ts` for all tokens.

| Element | Color |
|---------|-------|
| Page background | `#081c48` |
| Phase 1 tint | `#0d1e54` |
| Phase 2 tint | `#022434` |
| Accent / buttons | `#7862FF` (purple) |
| Titles / CTAs | `#f6dc53` (yellow) |
| YES / success | `#25a59f` (teal) |
| NO / danger | `#e03060` (red) |
