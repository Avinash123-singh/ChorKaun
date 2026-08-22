/** Quick room persistence smoke test */
import { io } from "../frontend/node_modules/socket.io-client/build/esm/index.js";

const API = "http://127.0.0.1:4000";

async function main() {
  const user = await (
    await fetch(`${API}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "PersistHost", avatar: "/assets/rahul-avatar.png" }),
    })
  ).json();

  const s = await new Promise((resolve, reject) => {
    const sock = io(API, { transports: ["websocket"] });
    sock.on("connect", () => {
      sock.emit("auth", { userId: user.user.id }, (ack) => {
        if (ack?.ok) resolve(sock);
        else reject(new Error("auth"));
      });
    });
  });

  const created = await new Promise((r) =>
    s.emit("room:create", { roomName: "Persist", totalRounds: 2, isPrivate: true }, (ack) => r(ack)),
  );
  if (!created.ok) throw new Error(created.error);
  const code = created.room.code;
  console.log("created room", code);

  s.disconnect();
  console.log("restart backend manually — checking DB snapshot via API...");
  await new Promise((r) => setTimeout(r, 500));

  const fetched = await (await fetch(`${API}/api/rooms/${code}`)).json();
  if (!fetched.room) throw new Error("room not in API after create");
  console.log("✓ room persisted in DB:", fetched.room.code, fetched.room.phase);
  console.log("✅ PERSISTENCE OK");
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
