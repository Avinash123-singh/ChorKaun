import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuid } from "uuid";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR || path.join(__dirname, "..", "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "chorkaun.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar TEXT NOT NULL,
    coins INTEGER NOT NULL DEFAULT 500,
    level INTEGER NOT NULL DEFAULT 1,
    games_played INTEGER NOT NULL DEFAULT 0,
    wins INTEGER NOT NULL DEFAULT 0,
    total_score INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rooms (
    code TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

try {
  db.prepare(`ALTER TABLE users ADD COLUMN total_score INTEGER NOT NULL DEFAULT 0`).run();
} catch {
  /* column exists */
}

export function createUser({ name, avatar }) {
  const id = uuid();
  const now = Date.now();
  db.prepare(
    `INSERT INTO users (id, name, avatar, coins, level, games_played, wins, total_score, created_at, updated_at)
     VALUES (?, ?, ?, 500, 1, 0, 0, 0, ?, ?)`,
  ).run(id, name.trim() || "Player", avatar || "/assets/rahul-avatar.png", now, now);
  return getUser(id);
}

export function getUser(id) {
  const row = db.prepare(`SELECT * FROM users WHERE id = ?`).get(id);
  return row ? mapUser(row) : null;
}

export function updateUser(id, { name, avatar, coins, level, gamesPlayed, wins, totalScore }) {
  const existing = getUser(id);
  if (!existing) return null;
  const next = {
    name: name ?? existing.name,
    avatar: avatar ?? existing.avatar,
    coins: coins ?? existing.coins,
    level: level ?? existing.level,
    gamesPlayed: gamesPlayed ?? existing.gamesPlayed,
    wins: wins ?? existing.wins,
    totalScore: totalScore ?? existing.totalScore,
  };
  db.prepare(
    `UPDATE users SET name=?, avatar=?, coins=?, level=?, games_played=?, wins=?, total_score=?, updated_at=? WHERE id=?`,
  ).run(
    next.name,
    next.avatar,
    next.coins,
    next.level,
    next.gamesPlayed,
    next.wins,
    next.totalScore,
    Date.now(),
    id,
  );
  return getUser(id);
}

/** Record end-of-game stats for all players in a room. */
export function recordGameResults(players) {
  if (!players?.length) return;
  const ranked = [...players].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
  const winnerId = ranked[0]?.id;
  const stmt = db.prepare(
    `UPDATE users SET
      games_played = games_played + 1,
      wins = wins + ?,
      total_score = total_score + ?,
      level = 1 + CAST((total_score + ?) / 3000 AS INTEGER),
      updated_at = ?
     WHERE id = ?`,
  );
  const now = Date.now();
  for (const p of players) {
    const score = p.totalScore || 0;
    stmt.run(p.id === winnerId ? 1 : 0, score, score, now, p.id);
  }
}

export function getLeaderboard(limit = 25) {
  return db
    .prepare(
      `SELECT id, name, avatar, total_score, wins, games_played
       FROM users
       ORDER BY total_score DESC, wins DESC
       LIMIT ?`,
    )
    .all(limit)
    .map((row) => ({
      id: row.id,
      name: row.name,
      avatar: row.avatar,
      totalScore: row.total_score,
      wins: row.wins,
      gamesPlayed: row.games_played,
    }));
}

export function saveRoomSnapshot(room) {
  if (!room?.code) return;
  const snapshot = {
    ...room,
    players: (room.players || []).map((p) => ({
      ...p,
      socketId: null,
      connected: false,
      micOn: false,
    })),
  };
  db.prepare(
    `INSERT INTO rooms (code, data, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(code) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at`,
  ).run(room.code, JSON.stringify(snapshot), Date.now());
}

export function deleteRoomSnapshot(code) {
  if (!code) return;
  db.prepare(`DELETE FROM rooms WHERE code = ?`).run(String(code));
}

export function loadRoomSnapshots() {
  const rows = db.prepare(`SELECT data FROM rooms`).all();
  return rows.map((r) => {
    try {
      return JSON.parse(r.data);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

function mapUser(row) {
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    coins: row.coins,
    level: row.level,
    gamesPlayed: row.games_played,
    wins: row.wins,
    totalScore: row.total_score ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
