Game Design Document: Consensus
1. Executive Summary
Consensus is a "Wisdom of the Crowds" social game where players win by accurately predicting the aggregate opinions and behaviors of the room. It is played with a central Broadcast Screen (TV) and individual Mobile Controllers (Phones).
2. Core Game Loop
A standard game consists of 10 rounds, each following a strict three-phase structure:
Phase 1: The Input (20–30 Seconds)
Action: A subjective prompt appears on the TV. Players answer privately on their phones.
Prompt Types: * Binary: Yes/No or True/False.
Multiple Choice: 4 distinct options.
Scale: 1–10 rating.
Goal: Answer honestly; there are no "wrong" answers in this phase.
Phase 2: The Prediction & Wager (20 Seconds)
Action: Players guess the total room outcome.
Binary: "How many people said Yes?"
Multiple Choice: "Which option was the #1 most popular?"
Scale: "What is the average room score?" (Calculated to 1 decimal point).
The Double Down (Wager): Players may toggle a "Double Down" button.
Effect: Doubles points for the round if the guess is highly accurate.
Penalty: Awards 0 points for the round if the guess falls outside the "Inner Circle."
Phase 3: The Reveal & Scoring (30 Seconds)
Action: The TV animates the results.
Visuals: Bar charts or scales filling up in real-time.
Hot Take Reveal: Identifies "Outliers" (players who chose an option selected by <10% of the room) and awards them a flat bonus.

3. Scoring & Accuracy Logic
The game prioritizes Accuracy over speed. Points are awarded based on proximity to the actual result ($N$).
Proximity Tiers
Tier
Accuracy Range
Base Points
Bullseye
Exact Match
1,000
Inner Circle
$\pm 1$ (for <20 players) or $\pm 2$ (for 20+ players)
750
Outer Circle
Within $10\%$ of total player count
400
The Fringe
Within $20\%$ of total player count
100
Miss
Beyond $20\%$
0

Multipliers (Rubber-Band Mechanic)
To ensure late-game engagement, round values increase as the game progresses:
Rounds 1–4: $1x$ multiplier.
Rounds 5–8: $1.5x$ multiplier.
Rounds 9–10: $3x$ multiplier.

4. Key Features & Characteristics
The "Locked Lobby"
Once the Host starts the game, the room is locked.
No mid-game joins are permitted to keep the "Total Player Count" ($N$) consistent for accuracy calculations.
Special Bonuses
Hot Take Bonus: Awarded to players who provided a unique or rare answer in Phase 1.
Oracle Bonus: Awarded to players who predicted the exact number of a "Hot Take" (e.g., guessing only 1 person would say "No").
The Chaos Factor: If a result is a perfect 50/50 split, all players receive a small "Chaos Bonus" for the unpredictability of the room.
End-Game: The "All-In"
In the final round, players in the bottom half of the leaderboard are given an "All-In" option. They can risk 50% of their total score to quadruple their points for the final round, allowing for dramatic last-second shifts.

5. Technical Requirements (UI/UX)
Broadcast Screen (TV)
Lobby: Displays Room Code/QR Code and player avatars.
Dynamic Visuals: Shows "Votes Submitted" count to pressure late responders.
The Reveal: High-tension animations (e.g., a "Totalizer" counting up).
Leaderboard: Shows "Big Climbers" (players who moved up the most spots).
Mobile Controller (Phone)
Haptic Feedback: Vibrates when the "Reveal" happens on the TV.
Input Methods: Clean sliders for numbers/scales and large tap targets for binary/multiple choice.
Status Indicators: Clearly shows if the "Double Down" wager is active.

6. Follow-up Development Areas
Room "Vibe" Analytics: Post-game summary showing how "in-sync" or "divided" the group is.
Custom Prompt Injection: Allowing the host to type a custom question mid-game.
Sentiment History: Tracking if a specific player is consistently the "Hot Take" outlier across mul