import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createUser, getLeaderboard, getUser, recordGameResults, updateUser } from "./db.js";
import {
  addChat,
  armSipahiTimeout,
  armDiscussionTimeout,
  createRoom,
  findOrCreatePublicRoom,
  getRoom,
  goScoreboard,
  initRoomsFromDb,
  joinRoom,
  leaveRoom,
  listPublicRooms,
  nextRound,
  personalGameStart,
  publicRoom,
  resetToLobby,
  setMic,
  setPhase,
  setReady,
  startGame,
  submitGuess,
} from "./rooms.js";

const PORT = Number(process.env.PORT) || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "*";

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN === "*" ? true : CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "chorkaun-backend", version: "1.5.0" });
});

app.post("/api/users", (req, res) => {
  const { name, avatar } = req.body ?? {};
  if (!name || String(name).trim().length < 2) {
    res.status(400).json({ error: "Name is required (min 2 characters)" });
    return;
  }
  const user = createUser({ name: String(name).trim().slice(0, 16), avatar });
  res.status(201).json({ user });
});

app.get("/api/users/:id", (req, res) => {
  const user = getUser(req.params.id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user });
});

app.patch("/api/users/:id", (req, res) => {
  const user = updateUser(req.params.id, req.body ?? {});
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user });
});

app.get("/api/rooms", (_req, res) => {
  res.json({ rooms: listPublicRooms() });
});

app.get("/api/rooms/:code", (req, res) => {
  const room = getRoom(req.params.code);
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  res.json({ room: publicRoom(room) });
});

app.get("/api/leaderboard", (_req, res) => {
  res.json({ leaders: getLeaderboard(25) });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CLIENT_ORIGIN === "*" ? true : CLIENT_ORIGIN, methods: ["GET", "POST"] },
});

function emitPhase(room, phase, extra = {}) {
  const reveal =
    phase === "revealRoles" || phase === "roundResult" || phase === "scoreboard";
  io.to(room.code).emit("game:phase", {
    phase,
    room: publicRoom(room, null, { revealAll: reveal }),
    lastResult: room.lastResult,
    ...extra,
  });
}

function resolveSipahiTimeout(code) {
  const room0 = getRoom(code);
  if (!room0 || room0.phase !== "sipahiGuess") return;
  try {
    const room = submitGuess(code, room0.players.find((p) => p.role === "sipahi")?.id, null, {
      timedOut: true,
    });
    broadcastRoom(room);
    emitPhase(room, "roundResult", { lastResult: room.lastResult });
  } catch {
    /* ignore */
  }
}

function maybeRecordStats(room) {
  if (!room || room.statsRecorded || room.phase !== "scoreboard") return;
  room.statsRecorded = true;
  recordGameResults(room.players);
}

function applyPhase(code, phase) {
  setPhase(code, phase);
  const updated = getRoom(code);
  if (phase === "scoreboard" && updated) {
    updated.status = "finished";
    maybeRecordStats(updated);
  }
  if (phase === "discussion" && updated) {
    armDiscussionTimeout(code, (c) => applyPhase(c, "sipahiGuess"));
  }
  if (phase === "sipahiGuess" && updated) {
    armSipahiTimeout(code, resolveSipahiTimeout);
  }
  broadcastRoom(updated);
  emitPhase(updated, phase);
  return updated;
}

function broadcastRoom(room) {
  if (!room) return;
  const revealAll =
    room.phase === "revealRoles" || room.phase === "roundResult" || room.phase === "scoreboard";
  for (const p of room.players) {
    if (p.socketId) {
      io.to(p.socketId).emit("room:update", publicRoom(room, p.id, { revealAll }));
    }
  }
  io.to(room.code).emit("room:presence", {
    code: room.code,
    count: room.players.length,
    maxPlayers: room.maxPlayers,
    names: room.players.map((p) => p.name),
    phase: room.phase,
    hostId: room.hostId,
  });
}

function emitPersonalStarts(room) {
  for (const personal of personalGameStart(room)) {
    const target = room.players.find((p) => p.id === personal.playerId);
    if (target?.socketId) {
      io.to(target.socketId).emit("game:started", {
        myRole: personal.role,
        round: personal.round,
        totalRounds: personal.totalRounds,
        phase: "roleReveal",
        room: publicRoom(room, personal.playerId),
      });
    }
  }
}

io.on("connection", (socket) => {
  socket.data.userId = null;
  socket.data.roomCode = null;

  socket.on("auth", (payload, ack) => {
    const user = getUser(payload?.userId);
    if (!user) {
      ack?.({ ok: false, error: "Unknown user" });
      return;
    }
    socket.data.userId = user.id;
    ack?.({ ok: true, user });
  });

  socket.on("room:create", (payload, ack) => {
    try {
      const userId = socket.data.userId || payload?.host?.id;
      const user = getUser(userId);
      if (!user) throw new Error("Sign in / create profile first");
      socket.data.userId = user.id;

      const room = createRoom({
        roomName: payload?.roomName,
        totalRounds: payload?.totalRounds ?? 3,
        isPrivate: payload?.isPrivate !== false,
        host: { id: user.id, name: user.name, avatar: user.avatar, socketId: socket.id },
      });
      socket.join(room.code);
      socket.data.roomCode = room.code;
      ack?.({ ok: true, room: publicRoom(room, user.id) });
    } catch (err) {
      ack?.({ ok: false, error: err.message || "Create failed" });
    }
  });

  socket.on("room:join-public", (_payload, ack) => {
    try {
      const userId = socket.data.userId;
      const user = getUser(userId);
      if (!user) throw new Error("Sign in / create profile first");

      let room = findOrCreatePublicRoom({
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        socketId: socket.id,
      });

      // If we just created it, host is already in; else join
      const alreadyIn = room.players.some((p) => p.id === user.id);
      if (!alreadyIn) {
        room = joinRoom(room.code, {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          socketId: socket.id,
        });
      } else {
        const me = room.players.find((p) => p.id === user.id);
        if (me) {
          me.socketId = socket.id;
          me.connected = true;
        }
      }

      socket.join(room.code);
      socket.data.roomCode = room.code;
      broadcastRoom(room);
      ack?.({
        ok: true,
        room: publicRoom(room, user.id),
        peers: room.players.filter((p) => p.id !== user.id && p.micOn).map((p) => p.id),
      });
    } catch (err) {
      ack?.({ ok: false, error: err.message || "Matchmaking failed" });
    }
  });

  socket.on("room:join", (payload, ack) => {
    try {
      const userId = socket.data.userId || payload?.player?.id;
      const user = getUser(userId);
      if (!user) throw new Error("Sign in / create profile first");
      socket.data.userId = user.id;

      const room = joinRoom(payload?.code, {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        socketId: socket.id,
      });
      socket.join(room.code);
      socket.data.roomCode = room.code;
      broadcastRoom(room);

      const personal = {
        ok: true,
        room: publicRoom(room, user.id),
        peers: room.players.filter((p) => p.id !== user.id && p.micOn).map((p) => p.id),
        rejoined: room.status !== "lobby",
        myRole: room.players.find((p) => p.id === user.id)?.role || null,
        phase: room.phase,
      };
      ack?.(personal);

      // Rejoin mid-game: send them current phase + role
      if (room.status === "playing" || room.phase === "scoreboard" || room.phase === "roundResult") {
        const me = room.players.find((p) => p.id === user.id);
        if (room.phase === "roleReveal" && me?.role) {
          io.to(socket.id).emit("game:started", {
            myRole: me.role,
            round: room.round,
            totalRounds: room.totalRounds,
            phase: "roleReveal",
            room: publicRoom(room, user.id),
          });
        } else {
          io.to(socket.id).emit("game:phase", {
            phase: room.phase,
            room: publicRoom(room, user.id, {
              revealAll:
                room.phase === "roundResult" ||
                room.phase === "scoreboard" ||
                room.phase === "revealRoles",
            }),
            lastResult: room.lastResult,
            myRole: me?.role || null,
          });
        }
      }
    } catch (err) {
      ack?.({ ok: false, error: err.message || "Join failed" });
    }
  });

  socket.on("room:leave", (_payload, ack) => {
    const code = socket.data.roomCode;
    const userId = socket.data.userId;
    if (code && userId) {
      socket.leave(code);
      const room = leaveRoom(code, userId, { soft: false });
      socket.data.roomCode = null;
      if (room) {
        broadcastRoom(room);
        io.to(code).emit("voice:peer-left", { playerId: userId });
        io.to(code).emit("room:host", { hostId: room.hostId });
      }
    }
    ack?.({ ok: true });
  });

  socket.on("room:ready", (payload, ack) => {
    const code = socket.data.roomCode;
    const userId = socket.data.userId;
    if (!code || !userId) {
      ack?.({ ok: false, error: "Not in a room" });
      return;
    }
    const room = setReady(code, userId, Boolean(payload?.ready));
    if (!room) {
      ack?.({ ok: false, error: "Room missing" });
      return;
    }
    broadcastRoom(room);
    ack?.({ ok: true });
  });

  socket.on("room:mic", (payload, ack) => {
    const code = socket.data.roomCode;
    const userId = socket.data.userId;
    if (!code || !userId) {
      ack?.({ ok: false, error: "Not in a room" });
      return;
    }
    const room = setMic(code, userId, Boolean(payload?.micOn));
    if (!room) {
      ack?.({ ok: false, error: "Room missing" });
      return;
    }
    broadcastRoom(room);
    io.to(code).emit("voice:peer-mic", { playerId: userId, micOn: Boolean(payload?.micOn) });
    ack?.({ ok: true });
  });

  socket.on("room:start", (_payload, ack) => {
    const code = socket.data.roomCode;
    const userId = socket.data.userId;
    if (!code || !userId) {
      ack?.({ ok: false, error: "Not in a room" });
      return;
    }
    try {
      const room = startGame(code, userId);
      broadcastRoom(room);
      emitPersonalStarts(room);
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, error: err.message || "Start failed" });
    }
  });

  socket.on("game:phase", (payload, ack) => {
    const code = socket.data.roomCode;
    const userId = socket.data.userId;
    if (!code || !userId) {
      ack?.({ ok: false, error: "Not in a room" });
      return;
    }
    const room = getRoom(code);
    if (!room) {
      ack?.({ ok: false, error: "Room missing" });
      return;
    }
    const phase = payload?.phase;
    const isHost = room.hostId === userId;
    // Host: discussion (after role reveal), sipahiGuess skip
    // Anyone: scoreboard when last round done; sipahiGuess from local timer backup
    if (phase === "discussion" && !isHost) {
      ack?.({ ok: false, error: "Only host can continue" });
      return;
    }
    if (phase === "sipahiGuess" && !isHost && room.phase !== "discussion") {
      ack?.({ ok: false, error: "Only host advances this phase" });
      return;
    }
    if (phase === "scoreboard" && room.round < room.totalRounds) {
      ack?.({ ok: false, error: "Game not finished yet" });
      return;
    }
    if (!["discussion", "sipahiGuess", "scoreboard", "roundResult"].includes(phase)) {
      ack?.({ ok: false, error: "Invalid phase" });
      return;
    }
    applyPhase(code, phase);
    ack?.({ ok: true });
  });

  socket.on("game:guess", (payload, ack) => {
    const code = socket.data.roomCode;
    const userId = socket.data.userId;
    if (!code || !userId) {
      ack?.({ ok: false, error: "Not in a room" });
      return;
    }
    try {
      const room = submitGuess(code, userId, payload?.guessId);
      broadcastRoom(room);
      emitPhase(room, "roundResult", { lastResult: room.lastResult });
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, error: err.message || "Guess failed" });
    }
  });

  socket.on("game:next-round", (_payload, ack) => {
    const code = socket.data.roomCode;
    const userId = socket.data.userId;
    if (!code || !userId) {
      ack?.({ ok: false, error: "Not in a room" });
      return;
    }
    try {
      const room = nextRound(code, userId);
      broadcastRoom(room);
      if (room.phase === "scoreboard") {
        maybeRecordStats(room);
        emitPhase(room, "scoreboard");
      } else {
        emitPersonalStarts(room);
      }
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, error: err.message || "Next round failed" });
    }
  });

  socket.on("game:scoreboard", (_payload, ack) => {
    const code = socket.data.roomCode;
    const userId = socket.data.userId;
    if (!code || !userId) {
      ack?.({ ok: false, error: "Not in a room" });
      return;
    }
    try {
      const room = goScoreboard(code);
      maybeRecordStats(room);
      broadcastRoom(room);
      emitPhase(room, "scoreboard");
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, error: err.message || "Cannot open scoreboard" });
    }
  });

  socket.on("game:play-again", (_payload, ack) => {
    const code = socket.data.roomCode;
    const userId = socket.data.userId;
    const room0 = getRoom(code);
    if (!code || !userId || !room0 || room0.hostId !== userId) {
      ack?.({ ok: false, error: "Only host can reset" });
      return;
    }
    const room = resetToLobby(code);
    broadcastRoom(room);
    emitPhase(room, "lobby");
    ack?.({ ok: true });
  });

  socket.on("rtc:signal", (payload) => {
    const code = socket.data.roomCode;
    const from = socket.data.userId;
    if (!code || !from || !payload?.to || !payload?.data) return;
    const room = getRoom(code);
    const target = room?.players.find((p) => p.id === payload.to);
    if (target?.socketId) {
      io.to(target.socketId).emit("rtc:signal", { from, data: payload.data });
    }
  });

  socket.on("chat:message", (payload, ack) => {
    const code = socket.data.roomCode;
    const userId = socket.data.userId;
    if (!code || !userId || !payload?.text) {
      ack?.({ ok: false });
      return;
    }
    const room = getRoom(code);
    const player = room?.players.find((p) => p.id === userId);
    const msg = {
      id: `c${Date.now()}`,
      playerId: userId,
      playerName: player?.name || "Player",
      text: String(payload.text).slice(0, 280),
    };
    addChat(code, msg);
    io.to(code).emit("chat:message", msg);
    ack?.({ ok: true });
  });

  socket.on("disconnect", () => {
    const code = socket.data.roomCode;
    const userId = socket.data.userId;
    if (!code || !userId) return;
    // Soft leave — keep seat so they can rejoin with the same code
    const room = leaveRoom(code, userId, { soft: true });
    if (room) {
      broadcastRoom(room);
      io.to(code).emit("voice:peer-left", { playerId: userId });
    }
  });
});

const restored = initRoomsFromDb();
if (restored) console.log(`Restored ${restored} room(s) from database`);

httpServer.listen(PORT, () => {
  console.log(`ChorKaun backend listening on http://127.0.0.1:${PORT}`);
});
