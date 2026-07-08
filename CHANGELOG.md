# Changelog

## Unreleased

### Question Banks
- Added three question banks: **General** (existing 212 questions), **Coworkers** (37 work-safe questions), **Hot Seat** (57 spicy questions)
- Category picker appears in the lobby when "Game" mode is selected
- Bank selection persists through Play Again
- `getPromptsForGame` now takes an optional `bank` parameter; round cap is derived from the selected bank's actual size (fixes potential `totalRounds` mismatch for smaller banks)

### Host Questions Mode
- New "Questions by: Host" mode — host enters all questions in the lobby before locking
- **Form tab**: one-at-a-time entry with type selector (Yes/No, Scale, Multi), inline validation, Enter-to-add
- **CSV Paste tab**: paste multiple questions at once; Validate shows per-row errors with line numbers; overflow rows shown struck-through before import with a discard warning
- CSV format: `type,text,opt1,opt2,opt3,opt4,labelLow,labelHigh` — types are `binary`, `scale`, `mc`
- Randomize question order toggle (off = play in entry order)
- Reducing the question count setting trims the queue immediately
- Host questions saved to `custom_questions` table at game end (same as player questions)

### Player Questions Mode
- Added **Randomize question order** toggle on the host's question collection screen (previously always shuffled)

### Host Lobby UI
- Mode descriptions: a one-sentence explanation updates below the "Questions by" buttons based on current selection
- "Questions by" toggle now has 3 options: Game / Players / Host

### Database
- Added `host_token NOT NULL` constraint and `idx_hosts_room_code_active` index to Supabase
- `custom_questions` now written for both `player_questions` and `host_questions` modes
- `reset_to_lobby` now correctly clears `hostQuestions` server-side

### Bug Fixes
- Fixed duplicate tab detection missing from the host game page
- Fixed `handleSkipQuestion` and `canSkip` declared but unused in host game page
- Fixed CSV ID collision on rapid re-import (now uses per-call random nonce)
- Fixed `host_token` column nullability in Supabase (`NOT NULL` constraint added after backfill)
- Fixed room sweep using `PROMPTS.length` cap instead of per-bank size for non-general banks

---

## 2026-06-24 — Rejoin & Active Status

- Fixed host rejoin logic: server broadcasts `host_reconnected` when host returns within grace period
- Fixed player rejoin: `duplicate_tab` detection added to host lobby
- Fixed `active` status not being set correctly on room deactivation
- 2-hour game sweep: rooms older than 24h are swept to `active: false` on next registration

---

## 2026-06-23 — Room Direct Access & Database Integration

- Added Supabase integration: `hosts`, `games`, `game_rounds`, `custom_questions` tables
- Host token authentication: 32-char token generated at registration, validated on every host join/rejoin
- Room direct-access guard: `/host/[roomCode]` checks Supabase active flag and PartyKit host presence before allowing entry
- `/api/room/[code]/deactivate` endpoint for explicit room teardown
- PartyKit deactivates room in Supabase on host timeout (10-min grace period)
- Fixed first-join logic: removed `isFirst` host auto-promotion; host status now requires explicit `isHost: true` + valid token
