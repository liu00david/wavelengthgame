# Future Features

Features planned but not yet implemented, roughly in priority order.

---

## Player-Submitted Questions

Like Quiplash's question creation phase — players submit their own questions before the game starts, making each session personal to the group.

### How It Works

1. **Pre-game submission lobby** — after all players join but before the host locks the game, a question submission screen opens on all phones
2. Players can submit any number of questions (no minimum, no maximum per player)
3. Each question has a type: **Yes / No**, **Multiple Choice**, or **Scale 1–10**
4. For Multiple Choice, the submitter also provides all 4 answer options
5. The host configures how many total questions the game will use (same setting as today)
6. Once enough questions have been submitted to fill the configured round count, the host can lock and start — or wait for more
7. Questions are shuffled and drawn from the player-submitted pool; any unused questions are discarded

### Open Design Questions
- Should the host be able to delete/reject individual submissions before starting?
- Should question authors be revealed after the round, or kept anonymous?
- Should the pool draw randomly or try to give each player equal representation?
- Minimum question count before "Start" is allowed (at least equal to round count)?

### Technical Notes
- Needs a new `submittedQuestions: Prompt[]` field on `LobbyState` (or separate server state)
- New client message: `{ type: "submit_question"; prompt: Omit<Prompt, "id"> }`
- New `GamePhase`: `"question_submission"` between `"lobby"` and `"countdown"`
- Host UI needs a live count of submitted questions vs. target
- TV screen during submission phase should show a live feed of questions being added (without revealing who submitted)

---

## All-In (Final Round Mechanic)

Players in the bottom half of the leaderboard get an optional **All-In** at the start of the final round:
- Risk 50% of their total score
- If they win the final round, they quadruple their points for that round
- Creates dramatic last-second comeback potential

Requires a leaderboard snapshot at the start of round N, server-side validation to prevent tampering, and a new UI flow at the transition to the final round.

---

## Hot Take / Oracle Bonus

- **Hot Take Bonus** — awarded to players whose Phase 1 answer was chosen by fewer than 10% of the room (they went against the grain)
- **Oracle Bonus** — awarded to players who predicted the exact count of a Hot Take answer (e.g. guessing exactly 1 person said "No" when only 1 did)

Requires cross-referencing Phase 1 and Phase 2 data per player. Would add a new section to the Phase 3 reveal animation.

---

## Round Multiplier

Points scale up in later rounds to create comeback opportunities and keep the game exciting through the end:

| Rounds | Multiplier |
|--------|------------|
| 1–4 | 1× |
| 5–8 | 1.5× |
| 9+ | 3× |

Currently deferred — scoring math is clean without it and it adds complexity to communicate to players.

---

## Mobile Haptics

Vibrate the player's phone at key moments (Phase 3 reveal, Double Down result). `navigator.vibrate()` is supported on Android but not iOS Safari, so a visual fallback (screen flash) would be needed.

