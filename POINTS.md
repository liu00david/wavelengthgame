# Scoring System

Points are awarded in **Phase 2** based on how close your prediction was to the actual group result. Maximum base score per round is **1,000 points**. There are no points for Phase 1 — that phase is pure input.

---

## Formulas by Question Type

### Yes / No

Predict how many players (out of N who answered) said YES.

**Formula:** `max(0, round(1000 − 2000 × |guess − actual| / N))`

| Example (N = 10, actual = 6) | Score |
|------------------------------|-------|
| Guess 6 (exact) | 1000 |
| Guess 5 or 7 (off by 1) | 800 |
| Guess 4 or 8 (off by 2) | 600 |
| Guess 3 or 9 (off by 3) | 400 |
| Guess 1 or 0 (off by 5+) | 0 |

Score degrades linearly — you reach 0 when you're off by 50% of N.

---

### Scale (1–10)

Predict the group's average answer (to 1 decimal place).

**Formula:** `max(0, round(1000 − 250 × diff²))`

| Difference from actual average | Score |
|--------------------------------|-------|
| 0.0 | 1000 |
| 0.5 | 938 |
| 1.0 | 750 |
| 1.5 | 438 |
| 2.0 | 0 |

Score drops steeply — off by 2.0 or more always scores 0.

---

### Multiple Choice

Predict which option got the most votes. Wrong guess = 0. Correct guess scores higher when the winning option was less dominant.

**Formula (correct only):** `max(0, round(1125 − 500 × winner_votes / N))`

| Winner vote share | Score |
|-------------------|-------|
| 25% (minority winner) | ~1000 |
| 50% | 875 |
| 75% | 750 |
| 100% (unanimous) | 625 |

Ties: if multiple options tie for most votes, predicting any tied winner counts as correct.

---

## Double Down

Each player has **one Double Down** per game, usable in Phase 2 before submitting.

| Outcome | Points |
|---------|--------|
| Any non-zero base score | **2× base score** |
| Score would be 0 | **0 points** |

Once used, it's gone for the rest of the game. Use it when you're confident — a wrong prediction wastes it entirely.

---

## Notes

- N is always the number of players who actually answered Phase 1 that round (not total players in lobby)
- If nobody answers Phase 1, the round is skipped and no points are awarded
- Leaderboard uses **dense ranking** — tied players share a rank (e.g. two players tied at 1st, next player is 2nd)
