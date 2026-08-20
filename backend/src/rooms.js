const ROLES = ["raja", "sipahi", "mantri", "chor"];

/** @type {Map<string, any>} */
const rooms = new Map();

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

export function createRoom({ roomName, totalRounds, isPrivate, host }) {
  let code = makeCode();
  while (rooms.has(code)) code = makeCode();

  const room = {
    code,
    roomName,
    inviteLink: `${process.env.CLIENT_ORIGIN || "http://127.0.0.1:5173"}/join/${code}`,
    maxPlayers: 4,
    isPrivate,
    totalRounds: Math.min(7, Math.max(1, totalRounds)),
    status: "lobby",
    hostId: host.id || `host-${code}`,
    players: [
      {
        id: host.id || `host-${code}`,
        name: host.name,
        avatar: host.avatar || "/assets/rahul-avatar.png",
        isReady: true,
        role: null,
      },
    ],
    createdAt: Date.now(),
  };

  rooms.set(code, room);
  return room;
}

export function getRoom(code) {
  if (!code) return null;
  return rooms.get(String(code)) || null;
}

export function listPublicRooms() {
  return [...rooms.values()]
    .filter((r) => !r.isPrivate && r.status === "lobby")
    .map((r) => ({
      code: r.code,
      roomName: r.roomName,
      players: r.players.length,
      maxPlayers: r.maxPlayers,
      totalRounds: r.totalRounds,
    }));
}

export function joinRoom(code, player) {
  const room = getRoom(code);
  if (!room) throw new Error("Room not found");
  if (room.status !== "lobby") throw new Error("Game already started");
  if (room.players.length >= room.maxPlayers) throw new Error("Room is full");
  if (room.players.some((p) => p.id === player.id)) return room;

  room.players.push({
    id: player.id,
    name: player.name,
    avatar: player.avatar,
    isReady: false,
    role: null,
  });
  return room;
}

export function leaveRoom(code, playerId) {
  const room = getRoom(code);
  if (!room) return null;
  room.players = room.players.filter((p) => p.id !== playerId);
  if (room.players.length === 0) {
    rooms.delete(code);
    return null;
  }
  if (room.hostId === playerId) {
    room.hostId = room.players[0].id;
  }
  return room;
}

export function setReady(code, playerId, ready) {
  const room = getRoom(code);
  if (!room) return null;
  const player = room.players.find((p) => p.id === playerId);
  if (player) player.isReady = ready;
  return room;
}

export function startGame(code, requesterId) {
  const room = getRoom(code);
  if (!room) throw new Error("Room not found");
  if (room.hostId !== requesterId) throw new Error("Only host can start");
  if (room.players.length !== 4) throw new Error("Need exactly 4 players");
  if (!room.players.every((p) => p.isReady)) throw new Error("All players must be ready");

  const roles = shuffle(ROLES);
  room.players = room.players.map((p, i) => ({ ...p, role: roles[i] }));
  room.status = "playing";
  return room;
}
