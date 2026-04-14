# Game Design Document: Consensus

## What Is It

Consensus is a real-time "Wisdom of the Crowds" party game. Players win by accurately predicting what the group said — not by having the right answer, but by reading the room.

Played with a **TV screen** (shared display), **one host device**, and **individual phones** for each player.

---

## Game Flow

### Lobby
- Host creates a room and shares the room code
- Players join on their phones
- Host configures number of rounds and phase timers
- Host locks the room to start — minimum 3 players required
- Once locked, no new players can join (mid-game rejoin allowed for existing players only)

### Each Round: 3 Phases

#### Phase 1 — Answer (default 30s)
A question appears on the TV. Every player answers privately on their phone. Answers are hidden from others.

**Question types:**
- **Yes / No** — binary choice
- **Multiple Choice** — pick one of 4 options
- **Scale 1–10** — slide to a number (shown to 1 decimal on phone)

If nobody answers before time runs out, the round is skipped with no points awarded.

#### Phase 2 — Predict (default 45s)
Players who answered Phase 1 are shown the question again and must predict the room's aggregate result:

| Type | Prediction task |
|------|----------------|
| Yes / No | How many people said YES? (0 to N) |
| Multiple Choice | Which option got the most votes? |
| Scale 1–10 | What was the group average? (1.0–10.0) |

Players who missed Phase 1 are locked out of Phase 2.

**Double Down** — each player has one per game. Toggle it before submitting to bet on your prediction:
- Correct: **2× points**
- Wrong: **0 points**

#### Phase 3 — Reveal
The TV animates the real result (bar charts, scale fill, YES/NO breakdown). Points are awarded. The host clicks to advance to the next round.

### Between Rounds
A leaderboard screen shows current standings with animated point increases.

### End of Game
A 5-second animation plays: "Game Over!" → "Who figured out the consensus?" → podium reveals. Final standings show the top 3 on a podium plus all remaining players below.

---

## Host Controls

- **Skip** — immediately end the current phase and move on
- **Pause / Resume** — freeze the timer (useful for explaining rules or handling distractions)
- **Kick Player** — remove a player mid-game; auto-advances phase if everyone else has answered
- **Next Round** — advances from Phase 3 results to the leaderboard, and from leaderboard to the next round

---

## Connectivity

- Players who close the tab are shown as disconnected (grey dot) but can rejoin using the same nickname within a 2-minute grace window
- If a player voluntarily leaves (via the menu), they are removed from the lobby immediately
- If the host disconnects, the room persists for 2 minutes — after which it is disbanded
- Duplicate tab detection: a player opening the game in a second tab is blocked

---

## Question Bank

Questions are hardcoded and shuffled randomly each game. Categories:
- Binary: controversial opinions, social behaviors
- Multiple Choice: lifestyle, preferences, hypotheticals
- Scale: personality traits, self-ratings, tendencies

See `party/index.ts` → `PROMPTS` array for the full list.
