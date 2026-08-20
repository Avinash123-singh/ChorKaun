import type { Player } from "../types/game";

export const PLAYER_POOL: Omit<
  Player,
  "isReady" | "role" | "totalScore" | "lastRoundPoints" | "isHost"
>[] = [
  { id: "p1", name: "Rahul", avatar: "/assets/rahul-avatar.png", isBot: false },
  { id: "p2", name: "Aman", avatar: "/assets/aman-avatar.png", isBot: true },
  { id: "p3", name: "Priya", avatar: "/assets/priya-avatar.png", isBot: true },
  { id: "p4", name: "Neha", avatar: "/assets/neha-avatar.png", isBot: true },
  { id: "p5", name: "Vikram", avatar: "/assets/vikram-avatar.png", isBot: true },
  { id: "p6", name: "Isha", avatar: "/assets/isha-avatar.png", isBot: true },
];

export function makePlayers(count: number): Player[] {
  return PLAYER_POOL.slice(0, count).map((p, i) => ({
    ...p,
    isHost: i === 0,
    isReady: true,
    role: null,
    totalScore: 0,
    lastRoundPoints: 0,
  }));
}
