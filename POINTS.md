# Consensus — Points System

Points are awarded at the end of **Phase 2** based on how accurately you predicted the group's answer.

---

## Scoring Formulas

### Yes / No

Predict how many players said YES (a number from 0 to N).

**Formula:** `max(0, round(1000 − 2000 × |guess − actual| / N))`

| Example (N = 10, actual = 6) | Score |
|------------------------------|-------|
| Guess 6 (exact) | 1000 |
| Guess 5 or 7 (off by 1) | 800 |
| Guess 4 or 8 (off by 2) | 600 |
| Guess 3 or 9 (off by 3) | 400 |
| Guess 1 or 0 (off by 5+) | 0 |

The penalty scales linearly with your miss distance relative to N.

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

The penalty grows quickly — being off by 2 or more scores 0.

---

### Multiple Choice

Predict which option was most popular. Only correct guesses score points. **Rarer answers score higher** — if everyone picked the same answer, it's worth less.

**Formula (correct guess only):** `max(0, round(1125 − 500 × votes_for_winner / N))`

| Winner vote share | Score |
|-------------------|-------|
| 25% of players (minority) | 1000 |
| 50% of players | 875 |
| 75% of players | 750 |
| 100% of players | 625 |

> Ties: if two answers are equally popular, predicting either one counts as correct (using that option's vote count).

---

## Double Down

During Phase 2, players can optionally Double Down before submitting.

- **Score ≥ 750:** score × 2
- **Score < 750:** score = 0

Double Down is all-or-nothing — only use it when you're confident.

---

## Round Multiplier

Points scale up in later rounds to create comeback opportunities.

| Rounds | Multiplier |
|--------|------------|
| 1–4 | 1× |
| 5–8 | 1.5× |
| 9+ | 3× |

The multiplier is applied after Double Down.

---

## Example Round

10 players, round 6 (1.5× multiplier). Question: "Would you rather live alone in the woods for a year?" — 6 said YES.

- Player A guessed **6** → `1000 − 2000×0/10 = 1000` × 1.5 = **1500 pts**
- Player B guessed **5** (off by 1) → `1000 − 2000×1/10 = 800` × 1.5 = **1200 pts**
- Player C guessed **5** with Double Down → 800 ≥ 750 → `800 × 2 = 1600` × 1.5 = **2400 pts**
- Player D guessed **2** (off by 4) → `1000 − 2000×4/10 = 200` × 1.5 = **300 pts**
- Player E guessed **0** (off by 6) → `1000 − 2000×6/10 = −200 → 0` × 1.5 = **0 pts**
