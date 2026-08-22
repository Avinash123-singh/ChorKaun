import { io, type Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "";
const FETCH_TIMEOUT_MS = 30_000;
const SOCKET_TIMEOUT_MS = 30_000;

let socket: Socket | null = null;

export function getApiUrl() {
  return API_URL;
}

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error("Server took too long — check your connection and try again.");
    }
    throw new Error("Cannot reach server — check your connection.");
  } finally {
    clearTimeout(timer);
  }
}

export async function apiCreateUser(name: string, avatar: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/users`, {
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
  const res = await fetchWithTimeout(`${API_URL}/api/users/${id}`);
  if (!res.ok) return null;
  return (await res.json()).user;
}

export async function apiUpdateUser(id: string, patch: Record<string, unknown>) {
  const res = await fetchWithTimeout(`${API_URL}/api/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) return null;
  return (await res.json()).user;
}

export async function apiGetLeaderboard() {
  const res = await fetchWithTimeout(`${API_URL}/api/leaderboard`);
  if (!res.ok) return [];
  return (await res.json()).leaders || [];
}

function waitForSocketAuth(sock: Socket, userId: string): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Connection timed out — slow network, try again."));
    }, SOCKET_TIMEOUT_MS);

    const finish = (ok: boolean, error?: string) => {
      clearTimeout(timer);
      if (ok) resolve(sock);
      else reject(new Error(error || "Auth failed"));
    };

    if (sock.connected) {
      sock.emit("auth", { userId }, (ack: { ok: boolean; error?: string }) => {
        finish(!!ack?.ok, ack?.error);
      });
      return;
    }

    sock.once("connect", () => {
      sock.emit("auth", { userId }, (ack: { ok: boolean; error?: string }) => {
        finish(!!ack?.ok, ack?.error);
      });
    });
    sock.once("connect_error", (err) => {
      clearTimeout(timer);
      reject(new Error(err?.message || "Cannot connect to server"));
    });
  });
}

export function connectSocket(userId: string): Promise<Socket> {
  if (socket?.connected) {
    return waitForSocketAuth(socket, userId);
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  socket = io(API_URL || undefined, {
    transports: ["polling", "websocket"],
    upgrade: true,
    timeout: SOCKET_TIMEOUT_MS,
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  return waitForSocketAuth(socket, userId);
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
    const timer = setTimeout(() => {
      resolve({ ok: false, error: "Request timed out — try again" } as T & { ok: boolean; error?: string });
    }, SOCKET_TIMEOUT_MS);
    socket.emit(event, payload, (ack: T & { ok: boolean; error?: string }) => {
      clearTimeout(timer);
      resolve(ack);
    });
  });
}

/** Preload splash / avatar images so first paint is fast on slow networks. */
export function preloadAssets(urls: string[]) {
  for (const url of urls) {
    const img = new Image();
    img.src = url;
  }
}
