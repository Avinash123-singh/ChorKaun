const REGISTRY_KEY = "chorkaun_rooms";

export interface StoredRoom {
  code: string;
  roomName: string;
  isPrivate: boolean;
  totalRounds: number;
  hostName: string;
  createdAt: number;
}

function readAll(): Record<string, StoredRoom> {
  try {
    return JSON.parse(localStorage.getItem(REGISTRY_KEY) || "{}") as Record<string, StoredRoom>;
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, StoredRoom>) {
  try {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function registerRoom(room: StoredRoom) {
  const map = readAll();
  map[room.code] = room;
  writeAll(map);
}

export function findRoom(code: string): StoredRoom | null {
  const map = readAll();
  return map[String(code)] || null;
}

export function listPublicStoredRooms(): StoredRoom[] {
  return Object.values(readAll()).filter((r) => !r.isPrivate);
}

const API = "http://127.0.0.1:4000";

export async function apiCreateRoom(payload: {
  roomName: string;
  totalRounds: number;
  isPrivate: boolean;
  host: { name: string; avatar: string };
}): Promise<{ code: string } | null> {
  try {
    const res = await fetch(`${API}/api/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { code: data.room.code };
  } catch {
    return null;
  }
}

export async function apiGetRoom(code: string): Promise<{
  code: string;
  roomName: string;
  isPrivate: boolean;
  totalRounds: number;
} | null> {
  try {
    const res = await fetch(`${API}/api/rooms/${code}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.room;
  } catch {
    return null;
  }
}
