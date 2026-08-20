import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createRoom, getRoom, joinRoom, leaveRoom, listPublicRooms, setReady, startGame } from "./rooms.js";

const PORT = Number(process.env.PORT) || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://127.0.0.1:5173";

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "chorkaun-backend", version: "1.0.0" });
});

app.get("/api/rooms", (_req, res) => {
  res.json({ rooms: listPublicRooms() });
});

app.post("/api/rooms", (req, res) => {
  const { roomName, totalRounds = 3, isPrivate = true, host } = req.body ?? {};
  if (!host?.name) {
    res.status(400).json({ error: "Host name is required" });
    return;
  }
  const room = createRoom({
    roomName: roomName || `${host.name}'s Room`,
    totalRounds: Number(totalRounds) || 3,
    isPrivate: Boolean(isPrivate),
    host,
  });
  res.status(201).json({ room });
});

app.get("/api/rooms/:code", (req, res) => {
  const room = getRoom(req.params.code);
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  res.json({ room: publicRoom(room) });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CLIENT_ORIGIN, methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  socket.data.playerId = socket.id;
  socket.data.roomCode = null;

  socket.on("room:join", (payload, ack) => {
    try {
      const { code, player } = payload ?? {};
      const room = joinRoom(code, {
        id: socket.id,
        name: player?.name || "Player",
        avatar: player?.avatar || "/assets/rahul-avatar.png",
      });
      socket.join(room.code);
      socket.data.roomCode = room.code;
      io.to(room.code).emit("room:update", publicRoom(room));
      ack?.({ ok: true, room: publicRoom(room) });
    } catch (err) {
      ack?.({ ok: false, error: err.message || "Join failed" });
    }
  });

  socket.on("room:ready", (payload, ack) => {
    const code = socket.data.roomCode;
    if (!code) {
      ack?.({ ok: false, error: "Not in a room" });
      return;
    }
    const room = setReady(code, socket.id, Boolean(payload?.ready));
    if (!room) {
      ack?.({ ok: false, error: "Room missing" });
      return;
    }
    io.to(code).emit("room:update", publicRoom(room));
    ack?.({ ok: true });
  });

  socket.on("room:start", (_payload, ack) => {
    const code = socket.data.roomCode;
    if (!code) {
      ack?.({ ok: false, error: "Not in a room" });
      return;
    }
    try {
      const room = startGame(code, socket.id);
      io.to(code).emit("room:update", publicRoom(room));
      io.to(code).emit("game:started", {
        code: room.code,
        roles: room.players.map((p) => ({ id: p.id, role: p.role })),
        totalRounds: room.totalRounds,
      });
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, error: err.message || "Start failed" });
    }
  });

  socket.on("chat:message", (payload) => {
    const code = socket.data.roomCode;
    if (!code || !payload?.text) return;
    const room = getRoom(code);
    const player = room?.players.find((p) => p.id === socket.id);
    io.to(code).emit("chat:message", {
      id: `${Date.now()}`,
      playerId: socket.id,
      playerName: player?.name || "Player",
      text: String(payload.text).slice(0, 280),
    });
  });

  socket.on("disconnect", () => {
    const code = socket.data.roomCode;
    if (!code) return;
    const room = leaveRoom(code, socket.id);
    if (room) io.to(code).emit("room:update", publicRoom(room));
  });
});

function publicRoom(room) {
  return {
    code: room.code,
    roomName: room.roomName,
    inviteLink: room.inviteLink,
    maxPlayers: room.maxPlayers,
    isPrivate: room.isPrivate,
    totalRounds: room.totalRounds,
    status: room.status,
    hostId: room.hostId,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      isHost: p.id === room.hostId,
      isReady: p.isReady,
      // roles stay private until game:started personal reveal on client
    })),
  };
}

httpServer.listen(PORT, () => {
  console.log(`ChorKaun backend listening on http://127.0.0.1:${PORT}`);
});
