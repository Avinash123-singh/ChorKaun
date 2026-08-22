/**
 * E2E: 7 fixes — points, host continue, sipahi timeout, rejoin timer, etc.
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

function waitFor(socket, event, timeoutMs = 8000) {
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
  if (!String(health.version).startsWith("1.")) throw new Error("need backend 1.x");

  const users = await Promise.all([1, 2, 3, 4].map((i) => createUser(`T${i}${Date.now() % 999}`)));
  const sockets = await Promise.all(users.map((u) => connect(u.id)));

  const created = await emit(sockets[0], "room:create", {
    roomName: "SevenFix",
    totalRounds: 1,
    isPrivate: true,
  });
  const code = created.room.code;

  for (let i = 1; i < 4; i++) {
    const j = await emit(sockets[i], "room:join", { code });
    if (!j.ok) throw new Error(j.error);
    await emit(sockets[i], "room:ready", { ready: true });
  }

  const startedP = Promise.all(sockets.map((s) => waitFor(s, "game:started")));
  await emit(sockets[0], "room:start");
  const starts = await startedP;
  console.log("✓ game started", starts.map((s) => s.myRole).join(","));

  // Host-only discussion (non-host should fail)
  const bad = await emit(sockets[1], "game:phase", { phase: "discussion" });
  if (bad.ok) throw new Error("non-host should not start discussion");
  console.log("✓ host-only continue enforced");

  const discP = Promise.all(sockets.map((s) => waitFor(s, "game:phase")));
  await emit(sockets[0], "game:phase", { phase: "discussion" });
  const disc = await discP;
  const left = disc[0].room.discussionSecondsLeft;
  if (typeof left !== "number" || left > 60 || left < 55) {
    throw new Error(`discussion timer bad: ${left}`);
  }
  console.log("✓ discussion timer synced:", left, "s");

  // Rejoin mid-discussion — should get remaining time not 60
  sockets[3].disconnect();
  await new Promise((r) => setTimeout(r, 2000));
  const s3b = await connect(users[3].id);
  const rejoin = await emit(s3b, "room:join", { code });
  if (!rejoin.ok) throw new Error("rejoin failed");
  const rem = rejoin.room.discussionSecondsLeft;
  if (typeof rem !== "number" || rem >= left || rem > 58) {
    throw new Error(`rejoin timer should be less than ${left}, got ${rem}`);
  }
  console.log("✓ rejoin timer remaining:", rem, "s (was", left, ")");
  sockets[3] = s3b;

  // Skip to sipahi
  await emit(sockets[0], "game:phase", { phase: "sipahiGuess" });
  await new Promise((r) => setTimeout(r, 100));
  const roomSnap = await (await fetch(`${API}/api/rooms/${code}`)).json();
  const sipLeft = roomSnap.room.sipahiSecondsLeft;
  if (typeof sipLeft !== "number" || sipLeft > 15 || sipLeft < 10) {
    throw new Error(`sipahi timer bad: ${sipLeft}`);
  }
  console.log("✓ sipahi 15s timer:", sipLeft, "s");

  // Timeout — sipahi gets 0, chor gets 500
  const resultP = Promise.all(sockets.map((s) => waitFor(s, "game:phase", 20000)));
  await new Promise((r) => setTimeout(r, (sipLeft + 1) * 1000));
  const results = await resultP;
  const r0 = results.find((r) => r.phase === "roundResult");
  if (!r0) throw new Error("no roundResult after timeout");
  if (!r0.lastResult?.timedOut) throw new Error("expected timedOut");
  const pts = r0.lastResult.pointsAwarded;
  const chor = starts.find((s) => s.myRole === "chor");
  const sipahi = starts.find((s) => s.myRole === "sipahi");
  const mantri = starts.find((s) => s.myRole === "mantri");
  const raja = starts.find((s) => s.myRole === "raja");
  const chorPlayer = starts.find((s) => s.myRole === "chor")?.room.players.find((p) =>
    starts.some((st) => st.myRole === "chor" && st.room.players.find((x) => x.id === p.id && x.role === "chor")),
  );
  // Find chor id from result
  const chorId = r0.lastResult.chorId;
  const sipahiId = r0.lastResult.sipahiId;
  if (pts[sipahiId] !== 0) throw new Error(`sipahi should get 0 on timeout, got ${pts[sipahiId]}`);
  if (pts[chorId] !== 500) throw new Error(`chor should get 500, got ${pts[chorId]}`);
  // Find mantri and raja ids
  for (const p of r0.room.players) {
    if (p.role === "mantri" && pts[p.id] !== 750) throw new Error(`mantri should get 750, got ${pts[p.id]}`);
    if (p.role === "raja" && pts[p.id] !== 1000) throw new Error(`raja should get 1000, got ${pts[p.id]}`);
  }
  console.log("✓ points on timeout:", pts);

  sockets.forEach((s) => s.disconnect());
  console.log("\n✅ ALL 7-FIX TESTS PASSED");
}

main().catch((e) => {
  console.error("\n❌", e.message || e);
  process.exit(1);
});
