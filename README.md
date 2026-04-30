# Consensus

A real-time party game about reading the room. Players answer questions, then predict what the group said — points go to whoever best understands the crowd.

## How It Works

**Setup**
- One person hosts a game and shares a room code
- Players join on their phones at the game URL
- Cast `/tv/[roomCode]` to a display for everyone to watch (recommended)
- Host configures rounds, timers, and question mode — then starts the game

**Each Round Has 3 Phases**

1. **Answer** — Everyone answers the same question (Yes/No, Multiple Choice, or Scale 1–10). Timer counts down, answers are hidden.

2. **Predict** — Players predict what the group said (how many said YES, which option was most popular, or the average). Optionally use your one-time **Double Down** to bet ×2 points — but score 0 if wrong.

3. **Results** — The real answer is revealed on the TV with animated bar charts. Points awarded based on prediction accuracy.

**End of Game**
- "Who figured out the consensus?" animation plays
- Final podium shows top 3 with confetti
- Host can view a full game summary or start a new game

## Question Types

| Type | Phase 1 | Phase 2 Prediction |
|------|---------|--------------------|
| Yes / No | Tap YES or NO | How many said YES? (slider) |
| Multiple Choice | Pick one of 4 options | Which option was most popular? |
| Scale 1–10 | Drag a slider | What was the average answer? |

## Question Modes

- **Game Questions** — drawn from the built-in bank of 116 shuffled questions
- **Player Questions** — players submit their own questions before the game starts; host can delete submissions; game begins once enough are collected

## Tech Stack

- **Next.js** (App Router) — frontend
- **PartyKit** — real-time WebSocket server
- **Tailwind CSS v4** — styling
- **Vercel** — frontend deployment
- **partykit.dev** — server deployment

## Running Locally

```bash
npm install
npm run dev
```

Starts both the Next.js frontend and PartyKit dev server. Open [http://localhost:3000](http://localhost:3000).

## Deploying

```bash
# Frontend
vercel

# PartyKit server
npx partykit deploy
```

## Routes

| URL | Role |
|-----|------|
| `/` | Landing page — host or join |
| `/host/[roomCode]` | Host lobby & game controls |
| `/play/[roomCode]` | Player view (mobile) |
| `/tv/[roomCode]` | TV/display screen (lobby + game) |
