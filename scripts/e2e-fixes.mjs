/**
 * E2E coverage for fixed flows
 */
import { io } from "../frontend/node_modules/socket.io-client/build/esm/index.js";

const API = "http://127.0.0.1:4000";

async function createUser(name) {
  const res = await fetch(`${API}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, avatar: "/assets/rahul-avatar.png" }),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()).user;
}

function connect(userId) {
  return new Promise((resolve, reject) => {
    const s = io(API, { transports: ["websocket"] });
    s.on("connect", () => {
      s.emit("auth", { userId }, (ack) => (ack?.ok ? resolve(s) : reject(new Error(ack?.error))));
    });
    s.on("connect_error", reject);
  });
}

function emit(socket, event, payload) {
  return new Promise((resolve) => socket.emit(event, payload, (ack) => resolve(ack)));
}

function waitFor(socket, event, timeoutMs = 6000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout ${event}`)), timeoutMs);
    socket.once(event, (data) => {
      clearTimeout(t);
      resolve(data);
    });
  });
}

async function main() {
  const health = await (await fetch(`${API}/health`)).json();
  console.log("health", health);
  if (!String(health.version).startsWith("1.3")) throw new Error("need backend 1.3.x");

  const users = await Promise.all([1, 2, 3, 4].map((i) => createUser(`P${i}${Date.now() % 1000}`)));
  const sockets = await Promise.all(users.map((u) => connect(u.id)));

  // Create + join
  const created = await emit(sockets[0], "room:create", {
    roomName: "FixTest",
    totalRounds: 2,
    isPrivate: true,
  });
  if (!created.ok) throw new Error(created.error);
  const code = created.room.code;
  console.log("room", code);

  for (let i = 1; i < 4; i++) {
    const j = await emit(sockets[i], "room:join", { code });
    if (!j.ok) throw new Error(j.error);
  }
  for (let i = 1; i < 4; i++) await emit(sockets[i], "room:ready", { ready: true });

  const startedP = Promise.all(sockets.map((s) => waitFor(s, "game:started")));
  const st = await emit(sockets[0], "room:start");
  if (!st.ok) throw new Error(st.error);
  const starts = await startedP;
  console.log("roles", starts.map((s) => s.myRole).join(","));

  // Soft disconnect + rejoin mid-game
  const leaveId = users[3].id;
  sockets[3].disconnect();
  await new Promise((r) => setTimeout(r, 200));
  const s3b = await connect(users[3].id);
  const rejoin = await emit(s3b, "room:join", { code });
  if (!rejoin.ok) throw new Error("rejoin failed: " + rejoin.error);
  if (!rejoin.rejoined) throw new Error("expected rejoined flag");
  console.log("rejoin OK phase=", rejoin.phase, "role=", rejoin.myRole);
  sockets[3] = s3b;

  // Host soft leave → host transfer
  const oldHost = users[0].id;
  sockets[0].disconnect();
  await new Promise((r) => setTimeout(r, 300));
  const roomAfter = await (await fetch(`${API}/api/rooms/${code}`)).json();
  if (roomAfter.room.hostId === oldHost) throw new Error("host should transfer on disconnect");
  console.log("host transferred to", roomAfter.room.hostId);

  // Reconnect old host
  sockets[0] = await connect(users[0].id);
  await emit(sockets[0], "room:join", { code });

  // Discussion → sipahi guess → result with scores
  const hostSock = sockets.find((_, i) => users[i].id === roomAfter.room.hostId) || sockets[1];
  // Use any socket still in room — find current host among connected
  let hostIdx = users.findIndex((u) => u.id === roomAfter.room.hostId);
  if (hostIdx < 0) hostIdx = 1;

  await emit(sockets[hostIdx], "game:phase", { phase: "discussion" });
  await emit(sockets[hostIdx], "game:phase", { phase: "sipahiGuess" });

  const sipahiIdx = starts.findIndex((s) => s.myRole === "sipahi");
  // After reconnect roles may differ for p3 - use room from rejoin
  // Find sipahi from current starts or re-fetch via guess try
  let sipahiSocket = sockets[sipahiIdx];
  let guessTarget = starts[sipahiIdx].room.players.find((p) => p.id !== users[sipahiIdx].id)?.id;

  const resultWait = Promise.all(
    sockets.map((s) => waitFor(s, "game:phase", 8000).catch(() => null)),
  );
  let guessAck = await emit(sipahiSocket, "game:guess", { guessId: guessTarget });
  if (!guessAck.ok) {
    // Try each socket as sipahi
    for (let i = 0; i < 4; i++) {
      const target = users[(i + 1) % 4].id;
      guessAck = await emit(sockets[i], "game:guess", { guessId: target });
      if (guessAck.ok) {
        sipahiSocket = sockets[i];
        break;
      }
    }
  }
  if (!guessAck.ok) throw new Error("guess failed " + guessAck.error);
  const phases = (await resultWait).filter(Boolean);
  const resultPhase = phases.find((p) => p.phase === "roundResult");
  if (!resultPhase) throw new Error("expected roundResult auto sync");
  const pts = resultPhase.lastResult?.pointsAwarded || {};
  if (!Object.keys(pts).length) throw new Error("no points awarded");
  console.log("roundResult scores OK", pts);

  // Non-host next-round should fail
  const nonHostIdx = users.findIndex((u) => u.id !== resultPhase.room.hostId);
  const bad = await emit(sockets[nonHostIdx], "game:next-round");
  if (bad.ok) throw new Error("non-host should not next-round");
  console.log("non-host next-round blocked OK");

  const hostId = resultPhase.room.hostId;
  const hIdx = users.findIndex((u) => u.id === hostId);
  const nextWait = Promise.all(sockets.map((s) => waitFor(s, "game:started", 8000)));
  const next = await emit(sockets[hIdx], "game:next-round");
  if (!next.ok) throw new Error(next.error);
  await nextWait;
  console.log("host next-round OK");

  // Public matchmaking
  const pubUsers = await Promise.all([createUser("PubA"), createUser("PubB")]);
  const pubSocks = await Promise.all(pubUsers.map((u) => connect(u.id)));
  const m1 = await emit(pubSocks[0], "room:join-public");
  if (!m1.ok) throw new Error(m1.error);
  const m2 = await emit(pubSocks[1], "room:join-public");
  if (!m2.ok) throw new Error(m2.error);
  if (m1.room.code !== m2.room.code) throw new Error("public should fill same room");
  console.log("public fill OK", m1.room.code, m2.room.players.length);

  sockets.forEach((s) => s.disconnect());
  pubSocks.forEach((s) => s.disconnect());
  console.log("\n✅ ALL FIX TESTS PASSED");
}

main().catch((e) => {
  console.error("\n❌", e.message || e);
  process.exit(1);
});
