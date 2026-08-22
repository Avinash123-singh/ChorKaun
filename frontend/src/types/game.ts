export type Role = "raja" | "sipahi" | "mantri" | "chor";

export const ROLE_LABEL: Record<Role, string> = {
  raja: "RAJA",
  sipahi: "SIPAHI",
  mantri: "MANTRI",
  chor: "CHOR",
};

export const ROLE_EMOJI: Record<Role, string> = {
  raja: "👑",
  sipahi: "🛡️",
  mantri: "🎩",
  chor: "🎭",
};

export const ROLE_GRADIENT: Record<Role, [string, string]> = {
  raja: ["#FFD866", "#B8860B"],
  sipahi: ["#5EA8F5", "#1B4C8C"],
  mantri: ["#B47AF0", "#5A1A8A"],
  chor: ["#F0596E", "#7A1A2A"],
};

export const ROLE_CARD_BG: Record<Role, string> = {
  raja: "from-[#3a2a08] via-[#2a1a10] to-[#1C0C3B]",
  sipahi: "from-[#0d2740] via-[#0d1a3a] to-[#0B061B]",
  mantri: "from-[#241040] via-[#1C0C3B] to-[#0B061B]",
  chor: "from-[#2a0f14] via-[#1a0c1e] to-[#0B061B]",
};

export const ROLE_POINTS: Record<Role, number> = {
  raja: 1000,
  sipahi: 500,
  mantri: 750,
  chor: 500, // when Sipahi guesses wrong
};

export const SHUFFLE_ROLES: Role[] = ["raja", "mantri", "chor", "sipahi"];

export const ROLE_MISSION: Record<Role, string> = {
  raja: "Announce points and enjoy the show.",
  sipahi: "Your mission is to find the CHOR",
  mantri: "Stay hidden, let others take the blame.",
  chor: "Bluff your way out. Don't get caught!",
};

export const ROLE_REVEAL_TEXT: Record<Role, string> = {
  raja: "You don't know who is Sipahi, Mantri or Chor. Stay calm and observe!",
  sipahi: "Find the Chor! Watch closely, ask questions and trust your gut.",
  mantri: "You're safe this round. Sit back and enjoy the chaos!",
  chor: "You are the Chor! Stay calm, blend in and don't get caught.",
};

export const ROLE_PORTRAIT: Record<Role, string> = {
  raja: "/assets/roles/raja-portrait.png",
  sipahi: "/assets/roles/sipahi.png",
  mantri: "/assets/roles/mantri.png",
  chor: "/assets/roles/chor.png",
};

export const ROLE_ACCENT: Record<Role, string> = {
  raja: "#ffc82e",
  sipahi: "#3dd68c",
  mantri: "#e8c35d",
  chor: "#e04555",
};

export const AVATAR_OPTIONS = [
  "/assets/rahul-avatar.png",
  "/assets/aman-avatar.png",
  "/assets/priya-avatar.png",
  "/assets/neha-avatar.png",
  "/assets/vikram-avatar.png",
  "/assets/isha-avatar.png",
] as const;

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  isBot: boolean;
  role: Role | null;
  totalScore: number;
  lastRoundPoints: number;
  speaking?: boolean;
  micOn?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  level: number;
  coins: number;
  gamesPlayed: number;
  wins: number;
  setupComplete: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  system?: boolean;
}

export type Screen =
  | "splash"
  | "home"
  | "playerSetup"
  | "createRoom"
  | "roomCreated"
  | "joinRoom"
  | "lobby"
  | "notifications"
  | "leaderboard"
  | "profile"
  | "store"
  | "settings"
  | "howToPlay"
  | "about"
  | "roleReveal"
  | "discussion"
  | "sipahiGuess"
  | "revealRoles"
  | "roundResult"
  | "scoreboard";

export interface RoundResultData {
  roundNumber: number;
  chorId: string;
  sipahiId: string;
  guessId: string | null;
  sipahiWon: boolean;
  timedOut?: boolean;
  pointsAwarded: Record<string, number>;
}

export interface GameState {
  screen: Screen;
  roomId: string;
  roomName: string;
  inviteLink: string;
  maxPlayers: number;
  isPrivate: boolean;
  password: string;
  players: Player[];
  myPlayerId: string;
  myRole: Role | null;
  round: number;
  totalRounds: number;
  revealIndex: number;
  discussionSecondsLeft: number;
  discussionDuration: number;
  sipahiSecondsLeft: number;
  rajaPoints: number;
  sipahiGuessId: string | null;
  lastResult: RoundResultData | null;
  chatMessages: ChatMessage[];
  chatOpen: boolean;
  userProfile: UserProfile;
  notifications: AppNotification[];
  soundEnabled: boolean;
  suspenseMusic: boolean;
  micEnabled: boolean;
  voiceListen: boolean;
  lobbySettingsOpen: boolean;
  setupNextScreen: Screen;
  connected: boolean;
  lastError: string;
}
