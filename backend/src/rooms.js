import { deleteRoomSnapshot, loadRoomSnapshots, saveRoomSnapshot } from "./db.js";

const ROLES = ["raja", "sipahi", "mantri", "chor"];

export const POINTS = {
  raja: 1000,
  mantri: 750,
  sipahi: 500, // when correct; chor gets this when sipahi is wrong
};

export const DISCUSSION_MS = 60_000;
export const SIPAHI_GUESS_MS = 15_000;

/** @type {Map<string, any>} */
const rooms = new Map();
/** @type {Map<string, ReturnType<typeof setTimeout>>} */
const sipahiTimers = new Map();

function makeCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function clearSipahiTimer(code) {
  const t = sipahiTimers.get(code);
  if (t) clearTimeout(t);
  sipahiTimers.delete(code);
}

function persist(code) {
  const room = rooms.get(code);
  if (room) saveRoomSnapshot(room);
}

function commit(code, room) {
  if (!room) {
    unpersist(code);
    return null;
  }
  persist(code);
  return room;
}

/** Restore rooms after server restart; players reconnect with room code. */
export function initRoomsFromDb() {
  let count = 0;
  for (const raw of loadRoomSnapshots()) {
    const room = reconcileLoadedRoom(raw);
    if (room) {
      rooms.set(room.code, room);
      count += 1;
    }
  }
  return count;
}

function reconcileLoadedRoom(room) {
  if (!room?.code) return null;
  room.players = (room.players || []).map((p) => ({
    ...p,
    socketId: null,
    connected: false,
    micOn: false,
  }));
  const now = Date.now();
  if (room.phase === "discussion") {
    if (!room.discussionEndsAt || room.discussionEndsAt <= now) {
      room.phase = "sipahiGuess";
      room.discussionEndsAt = null;
      room.sipahiEndsAt = now + SIPAHI_GUESS_MS;
    }
  }
  if (room.phase === "sipahiGuess") {
    if (!room.sipahiEndsAt || room.sipahiEndsAt <= now) {
      room.phase = "roundResult";
      room.sipahiEndsAt = null;
    }
  }
  return room;
}

export function createRoom({ roomName, totalRounds, isPrivate, host }) {
  let code = makeCode();
  while (rooms.has(code)) code = makeCode();

  const hostId = host.id;
  const room = {
    code,
    roomName: roomName || `${host.name}'s Room`,
    inviteLink: `${process.env.CLIENT_ORIGIN || "http://127.0.0.1:5173"}/?join=${code}`,
    maxPlayers: 4,
    isPrivate: Boolean(isPrivate),
    totalRounds: Math.min(7, Math.max(1, Number(totalRounds) || 3)),
    status: "lobby",
    phase: "lobby",
    hostId,
    players: [
      {
        id: hostId,
        socketId: host.socketId || null,
        name: host.name,
        avatar: host.avatar || "/assets/rahul-avatar.png",
        isReady: true,
        micOn: false,
        role: null,
        totalScore: 0,
        connected: true,
      },
    ],
    chat: [],
    round: 1,
    sipahiGuessId: null,
    lastResult: null,
    discussionEndsAt: null,
    sipahiEndsAt: null,
    createdAt: Date.now(),
  };

  rooms.set(code, room);
  persist(code);
  return room;
}

export function getRoom(code) {
  if (!code) return null;
  return rooms.get(String(code)) || null;
}

export function listPublicRooms() {
  return [...rooms.values()]
    .filter((r) => !r.isPrivate && r.players.length < 4 && r.status !== "finished")
    .map((r) => ({
      code: r.code,
      roomName: r.roomName,
      players: r.players.length,
      maxPlayers: r.maxPlayers,
      totalRounds: r.totalRounds,
      status: r.status,
      phase: r.phase,
    }))
    .sort((a, b) => b.players - a.players);
}

export function findOrCreatePublicRoom(host) {
  const open = [...rooms.values()]
    .filter((r) => !r.isPrivate && r.players.length < 4 && r.status !== "finished")
    .sort((a, b) => b.players.length - a.players.length);
  if (open.length) return open[0];
  return createRoom({
    roomName: "Public Match",
    totalRounds: 3,
    isPrivate: false,
    host,
  });
}

export function joinRoom(code, player) {
  const room = getRoom(code);
  if (!room) throw new Error("Room not found. Check the code and try again.");

  const existing = room.players.find((p) => p.id === player.id);
  if (existing) {
    existing.socketId = player.socketId || existing.socketId;
    existing.name = player.name || existing.name;
    existing.avatar = player.avatar || existing.avatar;
    existing.connected = true;
    return commit(code, room);
  }

  if (room.players.length >= room.maxPlayers) throw new Error("Room is full");

  if (room.status === "lobby") {
    room.players.push({
      id: player.id,
      socketId: player.socketId || null,
      name: player.name,
      avatar: player.avatar,
      isReady: false,
      micOn: false,
      role: null,
      totalScore: 0,
      connected: true,
    });
    return commit(code, room);
  }

  if (room.isPrivate) {
    throw new Error("Game already started. Ask the host for a new invite after this round.");
  }

  const taken = new Set(room.players.map((p) => p.role).filter(Boolean));
  const vacantRole = ROLES.find((r) => !taken.has(r)) || null;

  room.players.push({
    id: player.id,
    socketId: player.socketId || null,
    name: player.name,
    avatar: player.avatar,
    isReady: true,
    micOn: false,
    role: room.status === "playing" ? vacantRole : null,
    totalScore: 0,
    connected: true,
  });
  return commit(code, room);
}

export function leaveRoom(code, playerId, { soft = false } = {}) {
  const room = getRoom(code);
  if (!room) return null;

  if (soft) {
    const p = room.players.find((x) => x.id === playerId);
    if (p) {
      p.socketId = null;
      p.connected = false;
      p.micOn = false;
    }
    if (room.hostId === playerId) {
      const next = room.players.find((x) => x.id !== playerId && x.connected !== false);
      if (next) {
        room.hostId = next.id;
        next.isReady = true;
      }
    }
    return commit(code, room);
  }

  room.players = room.players.filter((p) => p.id !== playerId);
  if (room.players.length === 0) {
    clearSipahiTimer(code);
    rooms.delete(code);
    return commit(code, null);
  }
  if (room.hostId === playerId) {
    room.hostId = room.players[0].id;
    room.players[0].isReady = true;
    room.players[0].connected = true;
  }
  return commit(code, room);
}

export function setReady(code, playerId, ready) {
  const room = getRoom(code);
  if (!room) return null;
  const player = room.players.find((p) => p.id === playerId);
  if (player) player.isReady = ready;
  return commit(code, room);
}

export function setMic(code, playerId, micOn) {
  const room = getRoom(code);
  if (!room) return null;
  const player = room.players.find((p) => p.id === playerId);
  if (player) player.micOn = micOn;
  return commit(code, room);
}

export function startGame(code, requesterId) {
  const room = getRoom(code);
  if (!room) throw new Error("Room not found");
  if (room.hostId !== requesterId) throw new Error("Only host can start");
  if (room.players.length !== 4) throw new Error("Need exactly 4 players");
  if (!room.players.every((p) => p.isReady)) throw new Error("All players must be ready");

  clearSipahiTimer(code);
  const roles = shuffle(ROLES);
  room.players = room.players.map((p, i) => ({ ...p, role: roles[i] }));
  room.status = "playing";
  room.phase = "roleReveal";
  room.round = 1;
  room.sipahiGuessId = null;
  room.lastResult = null;
  room.discussionEndsAt = null;
  room.sipahiEndsAt = null;
  return commit(code, room);
}

export function setPhase(code, phase) {
  const room = getRoom(code);
  if (!room) return null;
  room.phase = phase;
  if (phase === "discussion") {
    room.discussionEndsAt = Date.now() + DISCUSSION_MS;
    room.sipahiEndsAt = null;
    clearSipahiTimer(code);
  } else if (phase === "sipahiGuess") {
    room.discussionEndsAt = null;
    clearDiscussionTimer(code);
    room.sipahiEndsAt = Date.now() + SIPAHI_GUESS_MS;
  } else {
    room.discussionEndsAt = null;
    clearDiscussionTimer(code);
    if (phase !== "sipahiGuess") room.sipahiEndsAt = null;
  }
  return commit(code, room);
}

/** Schedule auto-fail when Sipahi runs out of time. */
export function armSipahiTimeout(code, onTimeout) {
  clearSipahiTimer(code);
  const room = getRoom(code);
  if (!room || room.phase !== "sipahiGuess") return;
  const ms = Math.max(0, (room.sipahiEndsAt || Date.now()) - Date.now());
  const t = setTimeout(() => onTimeout(code), ms + 50);
  sipahiTimers.set(code, t);
}

/** @type {Map<string, ReturnType<typeof setTimeout>>} */
const discussionTimers = new Map();

function clearDiscussionTimer(code) {
  const t = discussionTimers.get(code);
  if (t) clearTimeout(t);
  discussionTimers.delete(code);
}

export function armDiscussionTimeout(code, onTimeout) {
  clearDiscussionTimer(code);
  const room = getRoom(code);
  if (!room || room.phase !== "discussion") return;
  const ms = Math.max(0, (room.discussionEndsAt || Date.now()) - Date.now());
  const t = setTimeout(() => onTimeout(code), ms + 50);
  discussionTimers.set(code, t);
}

export function submitGuess(code, sipahiId, guessId, { timedOut = false } = {}) {
  const room = getRoom(code);
  if (!room) throw new Error("Room not found");
  if (room.phase === "roundResult" || room.phase === "scoreboard") return commit(code, room);

  const sipahi = room.players.find((p) => p.role === "sipahi");
  if (!timedOut) {
    if (!sipahi || sipahi.id !== sipahiId) throw new Error("Only Sipahi can guess");
  }

  clearSipahiTimer(code);
  const chor = room.players.find((p) => p.role === "chor");
  const raja = room.players.find((p) => p.role === "raja");
  const mantri = room.players.find((p) => p.role === "mantri");

  const sipahiWon = !timedOut && !!chor && guessId === chor.id;
  const pointsAwarded = {};
  if (raja) pointsAwarded[raja.id] = POINTS.raja;
  if (mantri) pointsAwarded[mantri.id] = POINTS.mantri;
  if (sipahi) pointsAwarded[sipahi.id] = sipahiWon ? POINTS.sipahi : 0;
  if (chor) pointsAwarded[chor.id] = sipahiWon ? 0 : POINTS.sipahi;

  room.players = room.players.map((p) => ({
    ...p,
    totalScore: (p.totalScore || 0) + (pointsAwarded[p.id] || 0),
  }));

  room.sipahiGuessId = timedOut ? null : guessId;
  room.lastResult = {
    roundNumber: room.round,
    chorId: chor?.id || "",
    sipahiId: sipahi?.id || "",
    guessId: timedOut ? null : guessId,
    sipahiWon,
    timedOut: !!timedOut,
    pointsAwarded,
  };
  room.phase = "roundResult";
  room.sipahiEndsAt = null;
  room.discussionEndsAt = null;
  return commit(code, room);
}

export function nextRound(code, requesterId) {
  const room = getRoom(code);
  if (!room) throw new Error("Room not found");
  if (room.hostId !== requesterId) throw new Error("Only host can continue");

  clearSipahiTimer(code);
  if (room.round >= room.totalRounds) {
    room.phase = "scoreboard";
    room.status = "finished";
    room.discussionEndsAt = null;
    room.sipahiEndsAt = null;
    return commit(code, room);
  }

  room.round += 1;
  const roles = shuffle(ROLES);
  room.players = room.players.map((p, i) => ({ ...p, role: roles[i], isReady: true }));
  room.phase = "roleReveal";
  room.status = "playing";
  room.sipahiGuessId = null;
  room.lastResult = null;
  room.discussionEndsAt = null;
  room.sipahiEndsAt = null;
  return commit(code, room);
}

export function goScoreboard(code) {
  const room = getRoom(code);
  if (!room) throw new Error("Room not found");
  if (room.round < room.totalRounds) throw new Error("Game not finished yet");
  clearSipahiTimer(code);
  room.phase = "scoreboard";
  room.status = "finished";
  room.discussionEndsAt = null;
  room.sipahiEndsAt = null;
  return commit(code, room);
}

export function resetToLobby(code) {
  const room = getRoom(code);
  if (!room) return null;
  clearSipahiTimer(code);
  room.status = "lobby";
  room.phase = "lobby";
  room.round = 1;
  room.sipahiGuessId = null;
  room.lastResult = null;
  room.discussionEndsAt = null;
  room.sipahiEndsAt = null;
  room.players = room.players.map((p) => ({
    ...p,
    role: null,
    isReady: p.id === room.hostId,
    totalScore: 0,
  }));
  room.statsRecorded = false;
  return commit(code, room);
}

export function addChat(code, message) {
  const room = getRoom(code);
  if (!room) return null;
  room.chat.push(message);
  if (room.chat.length > 50) room.chat.shift();
  return commit(code, room);
}

function secondsLeft(endsAt) {
  if (!endsAt) return null;
  return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
}

export function publicRoom(room, forPlayerId = null, { revealAll = false } = {}) {
  const showAll =
    revealAll ||
    room.phase === "revealRoles" ||
    room.phase === "roundResult" ||
    room.phase === "scoreboard";
  return {
    code: room.code,
    roomName: room.roomName,
    inviteLink: room.inviteLink,
    maxPlayers: room.maxPlayers,
    isPrivate: room.isPrivate,
    totalRounds: room.totalRounds,
    status: room.status,
    phase: room.phase || "lobby",
    hostId: room.hostId,
    round: room.round || 1,
    chat: room.chat || [],
    sipahiGuessId: room.sipahiGuessId,
    lastResult: room.lastResult,
    discussionEndsAt: room.discussionEndsAt,
    sipahiEndsAt: room.sipahiEndsAt,
    discussionSecondsLeft: secondsLeft(room.discussionEndsAt),
    sipahiSecondsLeft: secondsLeft(room.sipahiEndsAt),
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      isHost: p.id === room.hostId,
      isReady: p.isReady,
      micOn: !!p.micOn,
      totalScore: p.totalScore || 0,
      connected: p.connected !== false,
      role: showAll || (forPlayerId && p.id === forPlayerId) ? p.role : null,
    })),
  };
}

export function personalGameStart(room) {
  return room.players.map((p) => ({
    playerId: p.id,
    role: p.role,
    round: room.round || 1,
    totalRounds: room.totalRounds,
  }));
}
