# ChorKaun

Digital **Raja · Mantri · Chor · Sipahi** — real-time 4-player web game.

## Structure

```
ChorKaun/
├── frontend/     # React + Vite
├── backend/      # Express + Socket.IO + SQLite
├── Dockerfile    # Single production image (recommended for cloud)
└── docker-compose.yml
```

## Quick start (local dev)

```bash
cd backend && npm install && npm start          # http://127.0.0.1:4000
cd frontend && npm install && cp .env.example .env && npm run dev   # http://127.0.0.1:5173
```

## Production (Docker — one URL for everything)

```bash
docker build -t chorkaun .
docker run -p 8080:8080 -v chorkaun_data:/data chorkaun
```

Open **http://localhost:8080** on any device on your network (or your public IP).

- Frontend, API, and WebSockets share one origin — works on phones, tablets, laptops
- SQLite data persists in the `/data` volume (users, leaderboard, active rooms)
- Custom **ChorKaun** favicon (not the Vite logo)

## Deploy live (Render — recommended)

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New** → **Blueprint** → connect `ChorKaun`
3. Render reads `render.yaml` and deploys automatically
4. Your live URL: **`https://chorkaun.onrender.com`** (or add a custom domain in Render settings)

Storage: 1 GB persistent disk mounted at `/data` — SQLite WAL handles thousands of users for this game.

## Deploy on a VPS

```bash
git clone https://github.com/Avinash123-singh/ChorKaun.git
cd ChorKaun
docker compose up -d --build
```

Put Caddy or nginx in front with HTTPS on ports 80/443, pointing to `:8080`.

## Multiplayer flow

1. Create profile (saved in SQLite)
2. Host creates room → share 6-digit code
3. 4 players join → host starts
4. Tap card → shuffle → see your role → host continues
5. Discussion (1 min) → Sipahi picks (15 sec) → scores
6. Rejoin anytime with the same room code

## Voice (speak / listen)

- Tap the **voice button** (bottom-right)
- **Speak ON** — only when you want to talk
- **Listen OFF** — play silently without hearing others
- Best tested on **2 phones** (not multiple tabs on one laptop)

## Run tests

```bash
# Backend must be running on :4000
node scripts/e2e-multiplayer.mjs
```

## Features

- Real-time lobby, chat, in-game settings
- Host-only continue / next round / play again
- Public matchmaking (Play Online)
- Leaderboard from SQLite
- Rooms survive server restart — rejoin with room code
- Mobile-friendly responsive UI
