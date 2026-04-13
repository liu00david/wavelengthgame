# Consensus

A real-time party game about reading the room. Players answer questions, then predict what the group said — points go to whoever best understands the crowd.

## How It Works

**Setup**
- One person hosts a game and shares a room code
- Players join on their phones at the game URL
- Optionally cast the TV screen to a display for everyone to watch

**Each Round Has 3 Phases**

1. **Answer** — Everyone answers the same question (Yes/No, Multiple Choice, or Scale 1–10). Timer counts down, answers are hidden from other players.

2. **Predict** — Players see the question again and predict what the group said (e.g. how many said YES, which option was most popular, or what the average was). Optionally use your one-time **Double Down** to bet x2 points — but you score 0 if wrong.

3. **Results** — The real answer is revealed on the TV screen with a breakdown. Points are awarded based on how close each player's prediction was.

**Scoring**
- Closer predictions = more points
- Double Down: correct = 2× points, wrong = 0 points
- Leaderboard updates after each round

**End of Game**
- Final podium shows top 3 players
- Host can view a full round-by-round summary

## Question Types

- **Yes / No** — Binary questions. Predict how many people said YES.
- **Multiple Choice** — 4 options. Predict which option got the most votes.
- **Scale 1–10** — Numeric questions. Predict the group's average.

## Tech Stack

- **Next.js** (App Router) — frontend
- **PartyKit** — real-time WebSocket server
- **Tailwind CSS v4** — styling
- **Vercel** — deployment

## Running Locally

```bash
npm install
npm run dev
```

This starts both the Next.js frontend and the PartyKit dev server. Open [http://localhost:3000](http://localhost:3000) to host or join a game.

## Roles

| URL | Role |
|-----|------|
| `/` | Landing page — host or join |
| `/host/[roomCode]` | Host lobby & game controls |
| `/play/[roomCode]` | Player view (mobile) |
| `/tv/[roomCode]` | TV/display screen |
