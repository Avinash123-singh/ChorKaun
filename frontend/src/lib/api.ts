import { io, type Socket } from "socket.io-client";

// Empty string = same-origin. In dev (vite dev server), set VITE_API_URL to the
// backend's own address (e.g. http://127.0.0.1:4000) via frontend/.env. In production
// (Docker/nginx or any single-domain deploy), leave it unset — nginx proxies /api and
// /socket.io to the backend on the same domain, so one public URL works everywhere,
// including over a tunnel.
const API_URL = import.meta.env.VITE_API_URL || "";

let socket: Socket | null = null;

export function getApiUrl() {
  return API_URL;
}

export async function apiCreateUser(name: string, avatar: string) {
  const res = await fetch(`${API_URL}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, avatar }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Could not create user");
  }
  return (await res.json()).user;
}

export async function apiGetUser(id: string) {
  const res = await fetch(`${API_URL}/api/users/${id}`);
  if (!res.ok) return null;
  return (await res.json()).user;
}

export async function apiUpdateUser(id: string, patch: Record<string, unknown>) {
  const res = await fetch(`${API_URL}/api/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) return null;
  return (await res.json()).user;
}

export async function apiGetLeaderboard() {
  const res = await fetch(`${API_URL}/api/leaderboard`);
  if (!res.ok) return [];
  return (await res.json()).leaders || [];
}

export function connectSocket(userId: string): Promise<Socket> {
  return new Promise((resolve, reject) => {
    if (socket?.connected) {
      socket.emit("auth", { userId }, (ack: { ok: boolean; error?: string }) => {
        if (ack?.ok) resolve(socket!);
        else reject(new Error(ack?.error || "Auth failed"));
      });
      return;
    }

    socket = io(API_URL || undefined, { transports: ["websocket", "polling"], autoConnect: true });
    socket.on("connect", () => {
      socket!.emit("auth", { userId }, (ack: { ok: boolean; error?: string }) => {
        if (ack?.ok) resolve(socket!);
        else reject(new Error(ack?.error || "Auth failed"));
      });
    });
    socket.on("connect_error", (err) => reject(err));
  });
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function socketEmit<T = unknown>(
  event: string,
  payload?: unknown,
): Promise<T & { ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      resolve({ ok: false, error: "Not connected to server" } as T & { ok: boolean; error?: string });
      return;
    }
    socket.emit(event, payload, (ack: T & { ok: boolean; error?: string }) => resolve(ack));
  });
}
