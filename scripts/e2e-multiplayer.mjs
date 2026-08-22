/**
 * E2E multiplayer smoke test (4 clients via socket.io-client)
 * Run: node scripts/e2e-multiplayer.mjs
 */
import { io } from "../frontend/node_modules/socket.io-client/build/esm/index.js";

const API = process.env.API || "http://127.0.0.1:4000";

async function createUser(name) {
  const res = await fetch(`${API}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, avatar: "/assets/rahul-avatar.png" }),
  });
  if (!res.ok) throw new Error(`createUser ${name}: ${await res.text()}`);
  return (await res.json()).user;
}

function connect(userId) {
  return new Promise((resolve, reject) => {
    const s = io(API, { transports: ["websocket"] });
    s.on("connect", () => {
      s.emit("auth", { userId }, (ack) => {
        if (ack?.ok) resolve(s);
        else reject(new Error(ack?.error || "auth fail"));
      });
    });
    s.on("connect_error", reject);
  });
}

function emit(socket, event, payload) {
  return new Promise((resolve) => {
    socket.emit(event, payload, (ack) => resolve(ack));
  });
}

function waitFor(socket, event, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout waiting ${event}`)), timeoutMs);
    socket.once(event, (data) => {
      clearTimeout(t);
      resolve(data);
    });
  });
}

async function main() {
  const health = await (await fetch(`${API}/health`)).json();
  console.log("health:", health);
  if (!health.ok) throw new Error(`Backend unhealthy: ${JSON.stringify(health)}`);

  const users = await Promise.all([
    createUser("HostA"),
    createUser("BobB"),
    createUser("CatC"),
    createUser("DanD"),
  ]);
  console.log("users ok:", users.map((u) => u.name).join(", "));

  const sockets = await Promise.all(users.map((u) => connect(u.id)));
  console.log("sockets connected:", sockets.length);

  const createAck = await emit(sockets[0], "room:create", {
    roomName: "E2E Room",
    totalRounds: 2,
    isPrivate: true,
  });
  if (!createAck.ok) throw new Error(createAck.error);
  const code = createAck.room.code;
  console.log("room created:", code, "players:", createAck.room.players.length);

  for (let i = 1; i < 4; i++) {
    const ack = await emit(sockets[i], "room:join", { code });
    if (!ack.ok) throw new Error(`join ${i}: ${ack.error}`);
    console.log(`joined ${users[i].name}:`, ack.room.players.length, "/4");
  }

  for (let i = 1; i < 4; i++) {
    await emit(sockets[i], "room:ready", { ready: true });
  }

  const started = Promise.all(sockets.map((s) => waitFor(s, "game:started")));
  const startAck = await emit(sockets[0], "room:start");
  if (!startAck.ok) throw new Error(startAck.error || "start failed");
  const payloads = await started;
  const roles = payloads.map((p) => p.myRole);
  console.log("roles dealt:", roles.join(", "));
  if (new Set(roles).size !== 4) throw new Error("Roles not unique across players");

  // Each payload room should only show that player's role (others null) until reveal
  for (const p of payloads) {
    const mine = p.room.players.find((x) => x.role === p.myRole);
    const othersHidden = p.room.players.filter((x) => x.id !== mine?.id).every((x) => x.role == null);
    if (!othersHidden) throw new Error("Other players' roles leaked in personal payload");
  }
  console.log("role privacy: OK");

  const phaseWait = Promise.all(sockets.map((s) => waitFor(s, "game:phase")));
  await emit(sockets[0], "game:phase", { phase: "discussion" });
  const phases = await phaseWait;
  if (phases[0].phase !== "discussion") throw new Error("phase sync failed");
  console.log("phase discussion: OK");

  await emit(sockets[0], "game:phase", { phase: "sipahiGuess" });

  const sipahiIdx = payloads.findIndex((p) => p.myRole === "sipahi");
  const chorId = null; // unknown to client — pick a non-sipahi id from room
  const sipahiRoom = payloads[sipahiIdx].room;
  const guessTarget = sipahiRoom.players.find((p) => p.id !== users[sipahiIdx].id)?.id;
  const revealWait = Promise.all(sockets.map((s) => waitFor(s, "game:phase")));
  const guessAck = await emit(sockets[sipahiIdx], "game:guess", { guessId: guessTarget });
  if (!guessAck.ok) throw new Error(guessAck.error || "guess failed");
  const reveal = await revealWait;
  if (reveal[0].phase !== "roundResult") throw new Error(`expected roundResult, got ${reveal[0].phase}`);
  const revealedRoles = reveal[0].room.players.map((p) => p.role).filter(Boolean);
  if (revealedRoles.length !== 4) throw new Error("roles not fully revealed");
  console.log("guess + full reveal: OK", revealedRoles.join(", "));

  // chat
  const chatWait = waitFor(sockets[1], "chat:message");
  await emit(sockets[0], "chat:message", { text: "hello friends" });
  const chat = await chatWait;
  if (chat.text !== "hello friends") throw new Error("chat failed");
  console.log("chat: OK");

  // next round
  const nextWait = Promise.all(sockets.map((s) => waitFor(s, "game:started", 8000)));
  const nextAck = await emit(sockets[0], "game:next-round");
  if (!nextAck.ok) throw new Error(nextAck.error || "next round failed");
  await nextWait;
  console.log("next round: OK");

  sockets.forEach((s) => s.disconnect());
  console.log("\n✅ E2E multiplayer smoke test PASSED");
}

main().catch((err) => {
  console.error("\n❌ E2E FAILED:", err.message || err);
  process.exit(1);
});
