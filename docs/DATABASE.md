# Database — What We Write and When

## Tables

### `hosts`
One row written when the host submits the register form (`/register`) and a room code is generated — before any players join.

| Column | Value |
|---|---|
| `first_name` | Host's first name |
| `last_name` | Host's last name |
| `token` | Access token if entered, otherwise null |
| `room_code` | The 4-letter code generated for this session |
| `created_at` | Timestamp of room creation |

---

### `games`
One row written when the last round ends and the game transitions to the `ended` phase. This is triggered automatically by the server — no host action required beyond finishing the final round.

| Column | Value |
|---|---|
| `room_code` | The 4-letter room code |
| `host_name` | Full name from the register form |
| `started_at` | When the host clicked Lock & Start Game |
| `ended_at` | When the final round resolved |
| `duration_seconds` | Difference between the two |
| `player_count` | Number of non-host players at game end |
| `total_rounds` | How many rounds were played |
| `mode` | `game_questions`, `player_questions`, or `host_questions` |
| `final_scores` | JSON array of `{nickname, emoji, total, rank}` for all players |

---

### `game_rounds`
One row per round, written at the same moment as the `games` row (end of game), in a single batch insert. Foreign key references `games.id`.

| Column | Value |
|---|---|
| `game_id` | References the parent `games` row |
| `round_number` | 1-indexed round number |
| `question_text` | The full question text |
| `question_type` | `binary`, `multiple_choice`, or `scale` |
| `question_options` | JSON array of options (multiple choice only, otherwise null) |
| `actual_result` | The consensus answer — e.g. `"yes"`, `"Pizza"`, `"6.4"` |
| `phase1_answers` | JSON object of `{nickname: answer}` — every player's raw answer |
| `phase2_predictions` | JSON object of `{nickname: prediction}` — every player's guess at the consensus |
| `phase2_wagers` | JSON object of `{nickname: true/false}` — who used their double-down |
| `scores` | JSON object of `{nickname: points}` — points earned this round |

**Example for a binary question with 6 players:**
```json
{
  "question_text": "Can you swim?",
  "question_type": "binary",
  "actual_result": "yes",
  "phase1_answers": {"Alice": "yes", "Bob": "yes", "Carol": "no", "Dave": "yes", "Eve": "no", "Frank": "yes"},
  "phase2_predictions": {"Alice": "yes", "Bob": "no", "Carol": "yes", "Dave": "yes", "Eve": "no", "Frank": "yes"},
  "scores": {"Alice": 750, "Bob": 0, "Carol": 500, "Dave": 750, "Eve": 0, "Frank": 1500}
}
```

---

### `custom_questions`
Written when `mode = player_questions` or `mode = host_questions`. One row per question. Written at the same time as `games` and `game_rounds` at game end. Foreign key references `games.id`.

- **player_questions**: `submitted_by` is the player's nickname; questions are collected during the question submission phase before the game starts.
- **host_questions**: `submitted_by` is the host's name; questions are entered in the lobby before Lock & Start and sent with the `start_game` message.

| Column | Value |
|---|---|
| `game_id` | References the parent `games` row |
| `submitted_by` | Nickname of the player who submitted it |
| `text` | The question text |
| `question_type` | `binary`, `multiple_choice`, or `scale` |
| `options` | JSON array of options (multiple choice only, otherwise null) |
| `label_low` | Scale label for 1 (scale only, otherwise null) |
| `label_high` | Scale label for 10 (scale only, otherwise null) |
| `created_at` | When the question was submitted |

---

## Write timeline

```
Host submits /register
  → INSERT hosts (1 row)

Host clicks Lock & Start Game
  → nothing written yet; gameStartedAt timestamp captured in server memory

Each round plays out (phase1 → phase2 → phase3)
  → round result accumulated in server memory; nothing written to DB yet

Last round ends (phase3 of final round)
  → INSERT games (1 row)
  → INSERT game_rounds (N rows, one per round, batched)
  → INSERT custom_questions (if player_questions or host_questions mode, one per question)
```

All game writes happen in a single async burst at the end — they are non-blocking and do not affect gameplay if they fail (errors are logged server-side).

---

## Environment variables

| Variable | Used by | Where to set |
|---|---|---|
| `SUPABASE_URL` | Next.js API routes + PartyKit server | `.env.local` (dev), Vercel env vars (prod), `.env` (PartyKit dev), `npx partykit env add` (PartyKit prod) |
| `SUPABASE_SERVICE_ROLE_KEY` | Next.js API routes + PartyKit server | Same as above |

PartyKit accesses these via `this.room.env`. Next.js accesses them via `process.env`. Both use the service role key (bypasses Row Level Security). Neither variable is ever sent to the browser.
