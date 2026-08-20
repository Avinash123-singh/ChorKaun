import {
  createContext,
  useCallback,
  useContext,
  useReducer,
  type ReactNode,
} from "react";
import type {
  ChatMessage,
  GameState,
  Player,
  Role,
  RoundResultData,
  Screen,
  UserProfile,
} from "../types/game";
import { makePlayers } from "../data/players";

const ROLES: Role[] = ["raja", "sipahi", "mantri", "chor"];
const PROFILE_KEY = "chorkaun_profile";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function assignRoles(players: Player[]): Player[] {
  const pool = shuffle(ROLES);
  return players.map((p, i) => ({ ...p, role: pool[i % pool.length] }));
}

function makeRoomId(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function makeInviteLink(roomId: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://chorkaun.app";
  return `${origin}/join/${roomId}`;
}

function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw) as UserProfile;
  } catch {
    /* ignore */
  }
  return {
    name: "",
    avatar: "/assets/rahul-avatar.png",
    level: 1,
    coins: 500,
    gamesPlayed: 0,
    wins: 0,
    setupComplete: false,
  };
}

function saveProfile(profile: UserProfile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}

const defaultNotifications = [
  {
    id: "n1",
    title: "Welcome to ChorKaun!",
    body: "Create a room with 4 friends and find the hidden Chor.",
    time: "Just now",
    read: false,
  },
  {
    id: "n2",
    title: "Daily Bonus Ready",
    body: "Claim +50 coins from the Store today.",
    time: "2h ago",
    read: false,
  },
  {
    id: "n3",
    title: "Tips for Sipahi",
    body: "Watch body language during discussion — the Chor often over-explains.",
    time: "Yesterday",
    read: true,
  },
];

const initialState: GameState = {
  screen: "splash",
  roomId: "",
  roomName: "",
  inviteLink: "",
  maxPlayers: 4,
  isPrivate: true,
  password: "",
  players: [],
  round: 1,
  totalRounds: 3,
  revealIndex: 0,
  discussionSecondsLeft: 30,
  discussionDuration: 30,
  rajaPoints: 1000,
  sipahiGuessId: null,
  lastResult: null,
  chatMessages: [
    { id: "c1", playerId: "p1", playerName: "Rahul", text: "Hello Everyone! 👋" },
    { id: "c2", playerId: "p2", playerName: "Aman", text: "Ready to Play!" },
    { id: "c3", playerId: "p3", playerName: "Priya", text: "Let's Go! 🎉" },
  ],
  chatOpen: false,
  userProfile: loadProfile(),
  notifications: defaultNotifications,
  soundEnabled: true,
  suspenseMusic: true,
  micEnabled: false,
  lobbySettingsOpen: false,
  setupNextScreen: "createRoom",
};

type Action =
  | { type: "SET_SCREEN"; screen: Screen }
  | { type: "BEGIN_SETUP"; next: Screen }
  | { type: "SAVE_PROFILE"; name: string; avatar: string }
  | {
      type: "CREATE_ROOM";
      roomName: string;
      totalRounds: number;
      isPrivate: boolean;
    }
  | { type: "GO_TO_LOBBY" }
  | { type: "JOIN_ROOM"; roomId: string }
  | { type: "TOGGLE_READY"; playerId: string }
  | { type: "START_GAME" }
  | { type: "REVEAL_NEXT" }
  | { type: "TICK_DISCUSSION" }
  | { type: "SKIP_DISCUSSION" }
  | { type: "SET_SIPAHI_GUESS"; playerId: string }
  | { type: "CONFIRM_SIPAHI_GUESS" }
  | { type: "CONTINUE_TO_RESULT" }
  | { type: "NEXT_ROUND" }
  | { type: "PLAY_AGAIN" }
  | { type: "EXIT_ROOM" }
  | { type: "TOGGLE_CHAT" }
  | { type: "SEND_CHAT"; text: string }
  | { type: "MARK_NOTIFICATIONS_READ" }
  | { type: "SET_SOUND"; enabled: boolean }
  | { type: "SET_SUSPENSE"; enabled: boolean }
  | { type: "SET_MIC"; enabled: boolean }
  | { type: "TOGGLE_LOBBY_SETTINGS" }
  | { type: "SPEND_COINS"; amount: number }
  | { type: "ADD_COINS"; amount: number };

function withHostFromProfile(players: Player[], profile: UserProfile): Player[] {
  return players.map((p, i) =>
    i === 0
      ? {
          ...p,
          name: profile.name || p.name,
          avatar: profile.avatar || p.avatar,
          isBot: false,
          isHost: true,
        }
      : p,
  );
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "SET_SCREEN":
      return { ...state, screen: action.screen };

    case "BEGIN_SETUP":
      return { ...state, setupNextScreen: action.next, screen: "playerSetup" };

    case "SAVE_PROFILE": {
      const userProfile: UserProfile = {
        ...state.userProfile,
        name: action.name.trim() || "Player",
        avatar: action.avatar,
        setupComplete: true,
      };
      saveProfile(userProfile);
      return { ...state, userProfile };
    }

    case "CREATE_ROOM": {
      const roomId = makeRoomId();
      const players = withHostFromProfile(makePlayers(4), state.userProfile);
      return {
        ...state,
        roomId,
        inviteLink: makeInviteLink(roomId),
        roomName: action.roomName || `${state.userProfile.name || "Player"}'s Room`,
        maxPlayers: 4,
        isPrivate: action.isPrivate,
        password: "",
        totalRounds: action.totalRounds,
        players,
        round: 1,
        screen: "roomCreated",
      };
    }

    case "GO_TO_LOBBY":
      return { ...state, screen: "lobby", lobbySettingsOpen: false };

    case "JOIN_ROOM": {
      const roomId = action.roomId || makeRoomId();
      const players = withHostFromProfile(makePlayers(4), state.userProfile).map((p, i) =>
        i === 0 ? { ...p, isHost: false } : i === 1 ? { ...p, isHost: true } : p,
      );
      // Joining user is first non-host slot visually as "you"
      players[0] = {
        ...players[0],
        name: state.userProfile.name || players[0].name,
        avatar: state.userProfile.avatar,
        isHost: false,
        isBot: false,
      };
      return {
        ...state,
        roomId,
        inviteLink: makeInviteLink(roomId),
        roomName: "Friend's Room",
        maxPlayers: 4,
        players,
        round: 1,
        screen: "lobby",
      };
    }

    case "TOGGLE_READY":
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.playerId ? { ...p, isReady: !p.isReady } : p,
        ),
      };

    case "START_GAME":
      return {
        ...state,
        players: assignRoles(state.players),
        round: 1,
        revealIndex: 0,
        screen: "roleReveal",
        lobbySettingsOpen: false,
      };

    case "REVEAL_NEXT": {
      const next = state.revealIndex + 1;
      if (next >= state.players.length) {
        return {
          ...state,
          revealIndex: next,
          screen: "discussion",
          discussionSecondsLeft: state.discussionDuration,
        };
      }
      return { ...state, revealIndex: next };
    }

    case "TICK_DISCUSSION": {
      const left = state.discussionSecondsLeft - 1;
      if (left <= 0) {
        return {
          ...state,
          discussionSecondsLeft: 0,
          screen: "sipahiGuess",
          sipahiGuessId: null,
        };
      }
      return { ...state, discussionSecondsLeft: left };
    }

    case "SKIP_DISCUSSION":
      return {
        ...state,
        screen: "sipahiGuess",
        discussionSecondsLeft: 0,
        sipahiGuessId: null,
      };

    case "SET_SIPAHI_GUESS":
      return { ...state, sipahiGuessId: action.playerId };

    case "CONFIRM_SIPAHI_GUESS": {
      const chor = state.players.find((p) => p.role === "chor");
      const sipahi = state.players.find((p) => p.role === "sipahi");
      const raja = state.players.find((p) => p.role === "raja");
      const mantri = state.players.find((p) => p.role === "mantri");
      const guessId = state.sipahiGuessId ?? "";
      const sipahiWon = !!chor && guessId === chor.id;

      const pointsAwarded: Record<string, number> = {};
      if (raja) pointsAwarded[raja.id] = state.rajaPoints;
      if (sipahi) pointsAwarded[sipahi.id] = sipahiWon ? 800 : 0;
      if (mantri) pointsAwarded[mantri.id] = 500;
      if (chor) pointsAwarded[chor.id] = sipahiWon ? 0 : 800;

      const players = state.players.map((p) => ({
        ...p,
        lastRoundPoints: pointsAwarded[p.id] ?? 0,
        totalScore: p.totalScore + (pointsAwarded[p.id] ?? 0),
      }));

      const lastResult: RoundResultData = {
        roundNumber: state.round,
        chorId: chor?.id ?? "",
        sipahiId: sipahi?.id ?? "",
        guessId,
        sipahiWon,
        pointsAwarded,
      };

      return { ...state, players, lastResult, screen: "revealRoles" };
    }

    case "CONTINUE_TO_RESULT":
      return { ...state, screen: "roundResult" };

    case "NEXT_ROUND": {
      if (state.round >= state.totalRounds) {
        return { ...state, screen: "scoreboard" };
      }
      return {
        ...state,
        round: state.round + 1,
        revealIndex: 0,
        players: assignRoles(state.players),
        screen: "roleReveal",
      };
    }

    case "PLAY_AGAIN":
      return {
        ...state,
        round: 1,
        players: assignRoles(
          state.players.map((p) => ({ ...p, totalScore: 0, lastRoundPoints: 0 })),
        ),
        revealIndex: 0,
        screen: "roleReveal",
      };

    case "EXIT_ROOM":
      return {
        ...initialState,
        screen: "home",
        userProfile: state.userProfile,
        notifications: state.notifications,
        soundEnabled: state.soundEnabled,
        suspenseMusic: state.suspenseMusic,
        chatMessages: initialState.chatMessages,
      };

    case "TOGGLE_CHAT":
      return { ...state, chatOpen: !state.chatOpen };

    case "SEND_CHAT": {
      const host = state.players.find((p) => !p.isBot) ?? state.players[0];
      const msg: ChatMessage = {
        id: `c${Date.now()}-${Math.random()}`,
        playerId: host?.id ?? "p1",
        playerName: state.userProfile.name || host?.name || "You",
        text: action.text,
      };
      return { ...state, chatMessages: [...state.chatMessages, msg] };
    }

    case "MARK_NOTIFICATIONS_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      };

    case "SET_SOUND":
      return { ...state, soundEnabled: action.enabled };

    case "SET_SUSPENSE":
      return { ...state, suspenseMusic: action.enabled };

    case "SET_MIC":
      return {
        ...state,
        micEnabled: action.enabled,
        players: state.players.map((p) =>
          p.isBot ? p : { ...p, micOn: action.enabled, speaking: action.enabled },
        ),
      };

    case "TOGGLE_LOBBY_SETTINGS":
      return { ...state, lobbySettingsOpen: !state.lobbySettingsOpen };

    case "SPEND_COINS": {
      if (state.userProfile.coins < action.amount) return state;
      const userProfile = {
        ...state.userProfile,
        coins: state.userProfile.coins - action.amount,
      };
      saveProfile(userProfile);
      return { ...state, userProfile };
    }

    case "ADD_COINS": {
      const userProfile = {
        ...state.userProfile,
        coins: state.userProfile.coins + action.amount,
      };
      saveProfile(userProfile);
      return { ...state, userProfile };
    }

    default:
      return state;
  }
}

interface GameContextValue {
  state: GameState;
  setScreen: (screen: Screen) => void;
  saveProfile: (name: string, avatar: string) => void;
  beginCreateRoom: () => void;
  beginJoinRoom: () => void;
  beginEditProfile: () => void;
  createRoom: (roomName: string, totalRounds: number, isPrivate: boolean) => void;
  goToLobby: () => void;
  joinRoom: (roomId: string) => void;
  toggleReady: (playerId: string) => void;
  startGame: () => void;
  revealNext: () => void;
  tickDiscussion: () => void;
  skipDiscussion: () => void;
  setSipahiGuess: (playerId: string) => void;
  confirmSipahiGuess: () => void;
  continueToResult: () => void;
  nextRound: () => void;
  playAgain: () => void;
  exitRoom: () => void;
  toggleChat: () => void;
  sendChat: (text: string) => void;
  markNotificationsRead: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  setSuspenseMusic: (enabled: boolean) => void;
  setMicEnabled: (enabled: boolean) => void;
  toggleLobbySettings: () => void;
  spendCoins: (amount: number) => void;
  addCoins: (amount: number) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const beginCreateRoom = useCallback(() => {
    if (!state.userProfile.setupComplete) {
      dispatch({ type: "BEGIN_SETUP", next: "createRoom" });
    } else {
      dispatch({ type: "SET_SCREEN", screen: "createRoom" });
    }
  }, [state.userProfile.setupComplete]);

  const beginJoinRoom = useCallback(() => {
    if (!state.userProfile.setupComplete) {
      dispatch({ type: "BEGIN_SETUP", next: "joinRoom" });
    } else {
      dispatch({ type: "SET_SCREEN", screen: "joinRoom" });
    }
  }, [state.userProfile.setupComplete]);

  const beginEditProfile = useCallback(() => {
    dispatch({ type: "BEGIN_SETUP", next: "profile" });
  }, []);

  const value: GameContextValue = {
    state,
    setScreen: useCallback((screen: Screen) => dispatch({ type: "SET_SCREEN", screen }), []),
    saveProfile: useCallback(
      (name: string, avatar: string) => dispatch({ type: "SAVE_PROFILE", name, avatar }),
      [],
    ),
    beginCreateRoom,
    beginJoinRoom,
    beginEditProfile,
    createRoom: useCallback(
      (roomName: string, totalRounds: number, isPrivate: boolean) =>
        dispatch({ type: "CREATE_ROOM", roomName, totalRounds, isPrivate }),
      [],
    ),
    goToLobby: useCallback(() => dispatch({ type: "GO_TO_LOBBY" }), []),
    joinRoom: useCallback((roomId: string) => dispatch({ type: "JOIN_ROOM", roomId }), []),
    toggleReady: useCallback((playerId: string) => dispatch({ type: "TOGGLE_READY", playerId }), []),
    startGame: useCallback(() => dispatch({ type: "START_GAME" }), []),
    revealNext: useCallback(() => dispatch({ type: "REVEAL_NEXT" }), []),
    tickDiscussion: useCallback(() => dispatch({ type: "TICK_DISCUSSION" }), []),
    skipDiscussion: useCallback(() => dispatch({ type: "SKIP_DISCUSSION" }), []),
    setSipahiGuess: useCallback(
      (playerId: string) => dispatch({ type: "SET_SIPAHI_GUESS", playerId }),
      [],
    ),
    confirmSipahiGuess: useCallback(() => dispatch({ type: "CONFIRM_SIPAHI_GUESS" }), []),
    continueToResult: useCallback(() => dispatch({ type: "CONTINUE_TO_RESULT" }), []),
    nextRound: useCallback(() => dispatch({ type: "NEXT_ROUND" }), []),
    playAgain: useCallback(() => dispatch({ type: "PLAY_AGAIN" }), []),
    exitRoom: useCallback(() => dispatch({ type: "EXIT_ROOM" }), []),
    toggleChat: useCallback(() => dispatch({ type: "TOGGLE_CHAT" }), []),
    sendChat: useCallback((text: string) => dispatch({ type: "SEND_CHAT", text }), []),
    markNotificationsRead: useCallback(() => dispatch({ type: "MARK_NOTIFICATIONS_READ" }), []),
    setSoundEnabled: useCallback(
      (enabled: boolean) => dispatch({ type: "SET_SOUND", enabled }),
      [],
    ),
    setSuspenseMusic: useCallback(
      (enabled: boolean) => dispatch({ type: "SET_SUSPENSE", enabled }),
      [],
    ),
    setMicEnabled: useCallback(
      (enabled: boolean) => dispatch({ type: "SET_MIC", enabled }),
      [],
    ),
    toggleLobbySettings: useCallback(() => dispatch({ type: "TOGGLE_LOBBY_SETTINGS" }), []),
    spendCoins: useCallback((amount: number) => dispatch({ type: "SPEND_COINS", amount }), []),
    addCoins: useCallback((amount: number) => dispatch({ type: "ADD_COINS", amount }), []),
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
