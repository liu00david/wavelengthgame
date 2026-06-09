# Consensus — Game Design & Player Guide

Consensus is a real-time party game about reading the room. Players answer questions honestly, then predict what the group said. Points go to whoever best understands the crowd — not who had the "right" answer.

Best played with 3–10 people. Works on phones. Recommended: cast the `/tv` screen to a shared display so everyone can see questions and results.

---

## Game States

### 1. Lobby

The host creates a room and shares a code (or QR). Players join on their phones at the room URL and pick a nickname and emoji avatar.

The host configures:
- **Number of questions** — how many rounds (5–25)
- **Answer time** — how long players have to answer each question (15–60s)
- **Predict time** — how long players have to make their prediction (15–60s)
- **Question mode** — Game Questions (built-in bank) or Player Questions (everyone submits their own)

The host locks the room to start the game. Locked rooms don't allow new players to join mid-game — existing players can rejoin by re-entering their nickname if they disconnect.

---

### 2. Question Submission *(Player Questions mode only)*

Before the game starts, all players submit their own questions on their phones. Players can write:
- **Yes / No** questions
- **Scale 1–10** questions (with optional low/high labels)
- **Multiple Choice** questions (2–4 options)

The TV shows a live count of collected questions and floating question marks animation while waiting. The host can delete individual submissions. Once enough questions are collected (at least as many as the number of rounds), the host starts the game.

---

### 3. Countdown

A 3-slide rules animation plays on all screens before the first round:

1. **Phase 1 — Answer** · Answer the question honestly for yourself
2. **Phase 2 — Predict** · Guess what the majority of the group answered
3. **Double Down** · One chance per game — bet on your prediction for ×2 points (or 0 if wrong)

Followed by a 3–2–1 countdown. The game then starts automatically.

---

### 4. Each Round (repeats N times)

#### Phase 1 — Answer

A question appears on the TV and each player's phone. Players answer privately — no one sees what anyone else chose.

| Question Type | How to Answer |
|---------------|--------------|
| **Yes / No** | Tap YES or NO |
| **Multiple Choice** | Tap one of 2–4 options |
| **Scale 1–10** | Use +/− buttons to pick a number |

The timer counts down. Players who don't answer in time are locked out of Phase 2 for that round. The TV shows a live count of how many players have answered.

#### Phase 2 — Predict

Players who answered Phase 1 now predict the group's collective result. Players who missed Phase 1 are locked out.

| Question Type | What to Predict |
|---------------|----------------|
| **Yes / No** | How many people said YES? (0 to N, use +/− buttons) |
| **Multiple Choice** | Which option got the most votes? (tap to pick) |
| **Scale 1–10** | What was the group's average answer? (0.1 increments) |

**Double Down** — before submitting, players can toggle Double Down once per game:
- Correct prediction → **2× points**
- Wrong prediction → **0 points**
- Once used, it's gone for the rest of the game

The lightning bolt ⚡ appears next to their name on the leaderboard if they used it.

#### Phase 3 — Results

The TV reveals the real answer with an animated bar chart, scale fill, or vote breakdown. Points are awarded and displayed on each player's phone — how many points they earned and their current rank.

**On the last round**, players' rank and "behind X" info is hidden from phone screens — it's revealed on the podium instead.

The host advances to the next screen.

---

### 5. Leaderboard (between rounds)

After each round's results, the leaderboard appears on the TV showing current standings. The previous round's ranking is shown first, then rows animate into the new order after 2 seconds — so the room can watch players move up and down. Score counters animate as rows slide. The top player is highlighted in purple.

The host advances to the next round.

---

### 6. End of Game

After all rounds, a "Game Over!" → "Who figured out the consensus?" animation plays on all screens, then the **podium** appears:

- **1st, 2nd, 3rd** are shown on a podium with fireworks
- Players 4th and below are listed underneath
- Final scores are revealed

The host can then:
- **View Game Summary** — a per-round breakdown showing every player's answer, prediction, and points
- **Play Again** — keeps the same room and settings, starts a new game
- **Disband Room** — closes the room and sends everyone to the home screen

---

## Scoring

Max base score per round: **1,000 points**.

**Yes / No** — linear: `max(0, round(1000 − 2000 × |guess − actual| / N))`
Off by 50% of players = 0 points.

**Scale 1–10** — quadratic: `max(0, round(1000 − 250 × diff²))`
Off by 2.0 from the average = 0 points.

**Multiple Choice** — winner-takes-all, rewards rarer picks:
`max(0, round(1125 − 500 × winner_votes / N))`
A unanimous answer scores 625. A minority winner scores ~1000.

**Double Down** multiplies your base score by 2× if correct, or gives 0 if wrong.

---

## Host Controls

The host screen shows the current game phase, timer, and answered count at all times. Controls available mid-game:

| Control | What it does |
|---------|-------------|
| **Pause / Resume** | Freeze and unfreeze the current phase timer |
| **Skip Question** | Immediately end the current phase (useful if stuck waiting on a slow player) |
| **Kick Player** | Remove a player from the game; if all remaining players have already answered, the phase auto-advances |
| **Next Round / Game Summary** | Advance from the results screen to the leaderboard, or from the leaderboard to the next round; on the final round, advances to the game summary instead |

The host can also **delete question submissions** during the question submission phase, and can **disband the room** at any time from the lobby or end screen.

---

## Question Types In Depth

### Yes / No
A binary question. Phase 2 prediction is a count of how many people said YES (a slider from 0 to N). Scoring is linear — off by 1 person costs 200 points, off by 50% of the room = 0.

### Multiple Choice
2–4 labeled options. Phase 2 prediction is picking which option was most popular. If two options tie for most votes, either counts as correct. Rarer winning options score more — so if everyone picks the same answer, predicting it is only worth 625 points. Predicting a minority winner (~25% of votes) scores ~1000.

### Scale 1–10
A sliding scale. Phase 2 prediction is guessing the group's average to one decimal place. Scoring drops steeply — off by 2.0 or more = 0 points regardless.

---

## Tips

- **Read the room, not the question.** The right answer is whatever your group thinks, not the objectively correct one.
- **Save Double Down** for a round where you're very confident — a wrong prediction wastes it entirely.
- **Multiple Choice minority picks** pay more. If you think the crowd will split, predicting the less obvious winner is the high-EV play.
- **Scale questions**: aim for the average, not your own answer. A group that skews high will have a high average even if you answered low.
- **Yes/No questions**: being off by just 1 person costs 200 points — rounding your count matters.
- **Host tip**: cast the `/tv` screen to a TV or projector so everyone can see questions and results together — it makes the game significantly more fun.
