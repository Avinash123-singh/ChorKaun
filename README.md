# ChorKaun

Digital **Raja · Mantri · Chor · Sipahi** party game (exactly 4 players).

## Repo structure

```
ChorKaun/
├── frontend/   # React + Vite + Tailwind UI
└── backend/    # Express + Socket.IO multiplayer API
```

## Quick start

```bash
# Install both apps
npm run install:all

# Terminal 1 — API (http://127.0.0.1:4000)
npm run dev:backend

# Terminal 2 — UI (http://127.0.0.1:5180 or Vite default)
npm run dev:frontend
```

## Frontend highlights

- Splash, Home (notifications, leaderboard, profile, store, settings, how-to-play, about)
- First-time player setup → Create Room (4 players, round picker) → Room Created (code + invite link) → Lobby
- Lobby settings: game sound, suspense music, microphone
- Role shuffle reveal with character portraits

## Backend API (REST)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/rooms` | List public lobby rooms |
| POST | `/api/rooms` | Create room |
| GET | `/api/rooms/:code` | Room details |

## Socket events

- `room:join` / `room:ready` / `room:start`
- `room:update` broadcast
- `game:started` with role assignments
- `chat:message`

Set `CLIENT_ORIGIN` and `PORT` env vars as needed.
