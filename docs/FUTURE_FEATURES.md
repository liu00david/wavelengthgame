# Future Features

Planned features not yet implemented, roughly in priority order.

---

## All-In (Final Round Mechanic)

Players in the bottom half of the leaderboard get an optional **All-In** at the start of the final round:
- Risk 50% of their total score
- If they win the final round, they quadruple their points for that round
- Creates dramatic last-second comeback potential

Requires a leaderboard snapshot at the start of round N, server-side validation to prevent tampering, and a new UI flow at the transition to the final round.

---

## Hot Take / Oracle Bonus

- **Hot Take Bonus** — awarded to players whose Phase 1 answer was chosen by fewer than 10% of the room
- **Oracle Bonus** — awarded to players who predicted the exact count of a Hot Take answer

Requires cross-referencing Phase 1 and Phase 2 data per player. Would add a new section to the Phase 3 reveal animation on the TV.

---

## Round Multiplier

Points scale up in later rounds to create comeback opportunities:

| Rounds | Multiplier |
|--------|------------|
| 1–4 | 1× |
| 5–8 | 1.5× |
| 9+ | 3× |

Deferred — scoring math is clean without it and adds complexity to communicate to players.

---

## Mobile Haptics

Vibrate the player's phone at key moments (Phase 3 reveal, Double Down result). `navigator.vibrate()` is supported on Android but not iOS Safari — a visual fallback (screen flash) would be needed for iOS.

---

## Music / Audio

Background music and sound effects to enhance atmosphere. Options: royalty-free tracks from Free Music Archive, ccMixter, or Pixabay. Requires audio context + autoplay policy handling per browser.

## Backend login

Add log in for users to access the game for limited release.
Add contact email to be added to waitlist or access list.