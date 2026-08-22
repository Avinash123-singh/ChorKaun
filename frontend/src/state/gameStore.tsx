import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
import {
  apiCreateUser,
  apiGetUser,
  apiUpdateUser,
  connectSocket,
  getSocket,
  socketEmit,
} from "../lib/api";
import { disableVoice, setListening } from "../lib/voiceChat";
import { playClick, setSuspenseEnabled, stopSuspenseMusic } from "../lib/sound";

const PROFILE_KEY = "chorkaun_user_id";

function emptyProfile(): UserProfile {
  return {
    id: "",
    name: "",
    avatar: "/assets/rahul-avatar.png",
    level: 1,
    coins: 500,
    gamesPlayed: 0,
    wins: 0,
    setupComplete: false,
  };
}

function syncTimers(room: any, state: GameState) {
  return {
    discussionSecondsLeft:
      typeof room?.discussionSecondsLeft === "number"
        ? room.discussionSecondsLeft
        : state.discussionSecondsLeft,
    sipahiSecondsLeft:
      typeof room?.sipahiSecondsLeft === "number"
        ? room.sipahiSecondsLeft
        : state.sipahiSecondsLeft,
  };
}

function mapServerPlayers(
  list: any[],
  _myId: string,
  lastResult?: RoundResultData | null,
): Player[] {
  const points = lastResult?.pointsAwarded || {};
  return (list || []).map((p) => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    isHost: !!p.isHost,
    isReady: !!p.isReady,
    isBot: false,
    // Trust server: it already hides others' roles until reveal/result
    role: (p.role as Role | null) ?? null,
    totalScore: typeof p.totalScore === "number" ? p.totalScore : 0,
    lastRoundPoints: typeof points[p.id] === "number" ? points[p.id] : 0,
    micOn: !!p.micOn,
  }));
}

const initialState: GameState = {
  screen: "splash",
  roomId: "",
  roomName: "",
  inviteLink: "",
  maxPlayers: 4,
  isPrivate: true,
  password: "",
  players: [],
  myPlayerId: "",
  myRole: null,
  round: 1,
  totalRounds: 3,
  revealIndex: 0,
  discussionSecondsLeft: 60,
  discussionDuration: 60,
  sipahiSecondsLeft: 15,
  rajaPoints: 1000,
  sipahiGuessId: null,
  lastResult: null,
  chatMessages: [],
  chatOpen: false,
  userProfile: emptyProfile(),
  notifications: [
    {
      id: "n1",
      title: "Welcome to ChorKaun!",
      body: "Create a private room and invite 3 friends with your code.",
      time: "Just now",
      read: false,
    },
  ],
  soundEnabled: true,
  suspenseMusic: true,
  micEnabled: false,
  voiceListen: true,
  lobbySettingsOpen: false,
  setupNextScreen: "createRoom",
  connected: false,
  lastError: "",
};

type Action =
  | { type: "SET_SCREEN"; screen: Screen }
  | { type: "BEGIN_SETUP"; next: Screen }
  | { type: "SET_PROFILE"; profile: UserProfile }
  | { type: "SET_CONNECTED"; connected: boolean }
  | { type: "SET_ERROR"; error: string }
  | { type: "ROOM_SYNC"; room: any }
  | { type: "GAME_STARTED"; myRole: Role; room: any; round: number; totalRounds: number }
  | { type: "PHASE_SYNC"; phase: string; room: any; lastResult?: RoundResultData | null }
  | { type: "ADD_CHAT"; message: ChatMessage }
  | { type: "SET_MIC"; enabled: boolean }
  | { type: "SET_VOICE_LISTEN"; enabled: boolean }
  | { type: "TICK_SIPAHI" }
  | { type: "SET_SOUND"; enabled: boolean }
  | { type: "SET_SUSPENSE"; enabled: boolean }
  | { type: "TOGGLE_LOBBY_SETTINGS" }
  | { type: "TOGGLE_CHAT" }
  | { type: "MARK_NOTIFICATIONS_READ" }
  | { type: "REVEAL_DONE" }
  | { type: "TICK_DISCUSSION" }
  | { type: "SKIP_DISCUSSION" }
  | { type: "SET_SIPAHI_GUESS"; playerId: string }
  | { type: "CONFIRM_SIPAHI_GUESS" }
  | { type: "CONTINUE_TO_RESULT" }
  | { type: "NEXT_ROUND" }
  | { type: "PLAY_AGAIN" }
  | { type: "EXIT_ROOM" }
  | { type: "SPEND_COINS"; amount: number }
  | { type: "ADD_COINS"; amount: number };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "SET_SCREEN":
      return { ...state, screen: action.screen, lastError: "" };
    case "BEGIN_SETUP":
      return { ...state, setupNextScreen: action.next, screen: "playerSetup" };
    case "SET_PROFILE":
      return {
        ...state,
        userProfile: action.profile,
        myPlayerId: action.profile.id,
      };
    case "SET_CONNECTED":
      return { ...state, connected: action.connected };
    case "SET_ERROR":
      return { ...state, lastError: action.error };

    case "ROOM_SYNC": {
      const room = action.room;
      const lastResult = room.lastResult ?? state.lastResult;
      const players = mapServerPlayers(
        room.players,
        state.myPlayerId || state.userProfile.id,
        lastResult,
      );
      const myRole =
        (players.find((p) => p.id === (state.myPlayerId || state.userProfile.id))?.role as Role) ||
        state.myRole;
      return {
        ...state,
        roomId: room.code,
        roomName: room.roomName,
        inviteLink: room.inviteLink,
        maxPlayers: room.maxPlayers || 4,
        isPrivate: !!room.isPrivate,
        totalRounds: room.totalRounds || state.totalRounds,
        round: room.round || state.round,
        players,
        myRole,
        lastResult,
        chatMessages: room.chat?.length ? room.chat : state.chatMessages,
        lastError: "",
        ...syncTimers(room, state),
      };
    }

    case "GAME_STARTED": {
      const players = mapServerPlayers(action.room.players, state.myPlayerId, null).map((p) =>
        p.id === state.myPlayerId ? { ...p, role: action.myRole } : { ...p, role: null },
      );
      return {
        ...state,
        myRole: action.myRole,
        players,
        round: action.round,
        totalRounds: action.totalRounds,
        revealIndex: 0,
        sipahiGuessId: null,
        lastResult: null,
        screen: "roleReveal",
        lobbySettingsOpen: false,
        chatOpen: false,
      };
    }

    case "PHASE_SYNC": {
      const phase = action.phase;
      const screenMap: Record<string, Screen> = {
        lobby: "lobby",
        roleReveal: "roleReveal",
        discussion: "discussion",
        sipahiGuess: "sipahiGuess",
        revealRoles: "revealRoles",
        roundResult: "roundResult",
        scoreboard: "scoreboard",
      };
      const screen = screenMap[phase] || state.screen;
      const lastResult = action.lastResult ?? state.lastResult;
      const players = mapServerPlayers(
        action.room?.players || state.players,
        state.myPlayerId,
        lastResult,
      );
      return {
        ...state,
        screen,
        players,
        lastResult,
        round: action.room?.round || state.round,
        totalRounds: action.room?.totalRounds || state.totalRounds,
        myRole:
          (players.find((p) => p.id === state.myPlayerId)?.role as Role) ||
          state.myRole,
        ...syncTimers(action.room, state),
      };
    }

    case "ADD_CHAT":
      return { ...state, chatMessages: [...state.chatMessages, action.message] };

    case "SET_MIC":
      return {
        ...state,
        micEnabled: action.enabled,
        players: state.players.map((p) =>
          p.id === state.myPlayerId ? { ...p, micOn: action.enabled } : p,
        ),
      };

    case "SET_VOICE_LISTEN":
      return { ...state, voiceListen: action.enabled };

    case "TICK_SIPAHI": {
      const left = state.sipahiSecondsLeft - 1;
      return { ...state, sipahiSecondsLeft: Math.max(0, left) };
    }

    case "SET_SOUND":
      return { ...state, soundEnabled: action.enabled };
    case "SET_SUSPENSE":
      return { ...state, suspenseMusic: action.enabled };
    case "TOGGLE_LOBBY_SETTINGS":
      return { ...state, lobbySettingsOpen: !state.lobbySettingsOpen };
    case "TOGGLE_CHAT":
      return { ...state, chatOpen: !state.chatOpen };
    case "MARK_NOTIFICATIONS_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      };

    case "REVEAL_DONE":
      return {
        ...state,
        screen: "discussion",
      };

    case "TICK_DISCUSSION": {
      const left = state.discussionSecondsLeft - 1;
      if (left <= 0) {
        return { ...state, discussionSecondsLeft: 0 };
      }
      return { ...state, discussionSecondsLeft: left };
    }

    case "SKIP_DISCUSSION":
      return { ...state, discussionSecondsLeft: 0 };

    case "SET_SIPAHI_GUESS":
      return { ...state, sipahiGuessId: action.playerId };

    case "CONFIRM_SIPAHI_GUESS":
      return state;

    case "CONTINUE_TO_RESULT":
      return { ...state, screen: "roundResult" };

    case "NEXT_ROUND": {
      if (state.round >= state.totalRounds) return { ...state, screen: "scoreboard" };
      return { ...state, round: state.round + 1, screen: "lobby", myRole: null };
    }

    case "PLAY_AGAIN":
      return { ...state, round: 1, screen: "lobby", myRole: null };

    case "EXIT_ROOM":
      disableVoice();
      stopSuspenseMusic();
      return {
        ...initialState,
        screen: "home",
        userProfile: state.userProfile,
        myPlayerId: state.userProfile.id,
        notifications: state.notifications,
        soundEnabled: state.soundEnabled,
        suspenseMusic: state.suspenseMusic,
        connected: state.connected,
      };

    case "SPEND_COINS": {
      if (state.userProfile.coins < action.amount) return state;
      return {
        ...state,
        userProfile: { ...state.userProfile, coins: state.userProfile.coins - action.amount },
      };
    }
    case "ADD_COINS":
      return {
        ...state,
        userProfile: { ...state.userProfile, coins: state.userProfile.coins + action.amount },
      };

    default:
      return state;
  }
}

interface GameContextValue {
  state: GameState;
  setScreen: (screen: Screen) => void;
  saveProfile: (name: string, avatar: string) => Promise<void>;
  beginCreateRoom: () => void;
  beginJoinRoom: () => void;
  beginEditProfile: () => void;
  createRoom: (roomName: string, totalRounds: number, isPrivate: boolean) => Promise<{ ok: boolean; error?: string }>;
  goToLobby: () => void;
  joinRoom: (roomId: string) => Promise<{ ok: boolean; error?: string }>;
  joinPublicMatch: () => Promise<{ ok: boolean; error?: string }>;
  toggleReady: () => void;
  startGame: () => Promise<void>;
  revealDone: () => void;
  tickDiscussion: () => void;
  tickSipahi: () => void;
  skipDiscussion: () => void;
  setSipahiGuess: (playerId: string) => void;
  confirmSipahiGuess: () => void;
  continueToResult: () => void;
  nextRound: () => void;
  goScoreboard: () => void;
  playAgain: () => void;
  exitRoom: () => void;
  toggleChat: () => void;
  sendChat: (text: string) => void;
  markNotificationsRead: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  setSuspenseMusic: (enabled: boolean) => void;
  setMicEnabled: (enabled: boolean) => void;
  setVoiceListen: (enabled: boolean) => void;
  toggleLobbySettings: () => void;
  spendCoins: (amount: number) => void;
  addCoins: (amount: number) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load persisted user from DB via id
  useEffect(() => {
    const id = localStorage.getItem(PROFILE_KEY);
    if (!id) return;
    void (async () => {
      try {
        const user = await apiGetUser(id);
        if (user) {
          dispatch({
            type: "SET_PROFILE",
            profile: {
              id: user.id,
              name: user.name,
              avatar: user.avatar,
              level: user.level,
              coins: user.coins,
              gamesPlayed: user.gamesPlayed,
              wins: user.wins,
              setupComplete: true,
            },
          });
          await connectSocket(user.id);
          dispatch({ type: "SET_CONNECTED", connected: true });
          wireSocket();
        }
      } catch {
        dispatch({ type: "SET_CONNECTED", connected: false });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wireSocket = useCallback(() => {
    const s = getSocket();
    if (!s) return;
    s.off("room:update");
    s.off("game:started");
    s.off("game:phase");
    s.off("chat:message");
    s.on("room:update", (room) => dispatch({ type: "ROOM_SYNC", room }));
    s.on("game:started", (payload) => {
      dispatch({
        type: "GAME_STARTED",
        myRole: payload.myRole,
        room: payload.room,
        round: payload.round,
        totalRounds: payload.totalRounds,
      });
    });
    s.on("game:phase", (payload) => {
      dispatch({
        type: "PHASE_SYNC",
        phase: payload.phase,
        room: payload.room,
        lastResult: payload.lastResult ?? null,
      });
    });
    s.on("chat:message", (message: ChatMessage) => dispatch({ type: "ADD_CHAT", message }));
  }, []);

  useEffect(() => {
    if (state.connected) wireSocket();
  }, [state.connected, wireSocket]);

  useEffect(() => {
    if (state.suspenseMusic && (state.screen === "discussion" || state.screen === "sipahiGuess")) {
      setSuspenseEnabled(true);
    } else {
      stopSuspenseMusic();
    }
  }, [state.suspenseMusic, state.screen]);

  const ensureSocket = async (userId: string) => {
    await connectSocket(userId);
    dispatch({ type: "SET_CONNECTED", connected: true });
    wireSocket();
  };

  const saveProfile = useCallback(async (name: string, avatar: string) => {
    const trimmed = name.trim() || "Player";
    let user;
    if (state.userProfile.id) {
      user = await apiUpdateUser(state.userProfile.id, { name: trimmed, avatar });
    } else {
      user = await apiCreateUser(trimmed, avatar);
      localStorage.setItem(PROFILE_KEY, user.id);
    }
    if (!user) throw new Error("Could not save profile");
    const profile: UserProfile = {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      level: user.level,
      coins: user.coins,
      gamesPlayed: user.gamesPlayed,
      wins: user.wins,
      setupComplete: true,
    };
    dispatch({ type: "SET_PROFILE", profile });
    await ensureSocket(user.id);
  }, [state.userProfile.id, wireSocket]);

  const beginCreateRoom = useCallback(() => {
    if (!state.userProfile.setupComplete) dispatch({ type: "BEGIN_SETUP", next: "createRoom" });
    else dispatch({ type: "SET_SCREEN", screen: "createRoom" });
  }, [state.userProfile.setupComplete]);

  const beginJoinRoom = useCallback(() => {
    if (!state.userProfile.setupComplete) dispatch({ type: "BEGIN_SETUP", next: "joinRoom" });
    else dispatch({ type: "SET_SCREEN", screen: "joinRoom" });
  }, [state.userProfile.setupComplete]);

  const beginEditProfile = useCallback(() => {
    dispatch({ type: "BEGIN_SETUP", next: "profile" });
  }, []);

  const createRoom = useCallback(
    async (roomName: string, totalRounds: number, isPrivate: boolean) => {
      if (state.soundEnabled) playClick();
      try {
        await ensureSocket(state.userProfile.id);
        const ack = await socketEmit<{ ok: boolean; error?: string; room?: any }>("room:create", {
          roomName,
          totalRounds,
          isPrivate,
        });
        if (!ack.ok || !ack.room) return { ok: false, error: ack.error || "Create failed" };
        dispatch({ type: "ROOM_SYNC", room: ack.room });
        dispatch({ type: "SET_SCREEN", screen: "roomCreated" });
        return { ok: true };
      } catch (e: any) {
        return { ok: false, error: e?.message || "Server offline" };
      }
    },
    [state.userProfile.id, state.soundEnabled, wireSocket],
  );

  const joinRoom = useCallback(
    async (roomId: string) => {
      const code = String(roomId || "").trim();
      if (!/^\d{6}$/.test(code)) {
        return { ok: false, error: "Enter a valid 6-digit room code" };
      }
      try {
        await ensureSocket(state.userProfile.id);
        const ack = await socketEmit<{
          ok: boolean;
          error?: string;
          room?: any;
          rejoined?: boolean;
          myRole?: Role | null;
          phase?: string;
        }>("room:join", { code });
        if (!ack.ok || !ack.room) return { ok: false, error: ack.error || "Join failed" };
        dispatch({ type: "ROOM_SYNC", room: ack.room });

        if (ack.rejoined && ack.phase && ack.phase !== "lobby") {
          if (ack.myRole && ack.phase === "roleReveal") {
            dispatch({
              type: "GAME_STARTED",
              myRole: ack.myRole,
              room: ack.room,
              round: ack.room.round || 1,
              totalRounds: ack.room.totalRounds || 3,
            });
          } else {
            dispatch({
              type: "PHASE_SYNC",
              phase: ack.phase,
              room: ack.room,
              lastResult: ack.room.lastResult ?? null,
            });
          }
        } else {
          dispatch({ type: "SET_SCREEN", screen: "lobby" });
        }
        return { ok: true };
      } catch (e: any) {
        return { ok: false, error: e?.message || "Server offline" };
      }
    },
    [state.userProfile.id, wireSocket],
  );

  const joinPublicMatch = useCallback(async () => {
    try {
      await ensureSocket(state.userProfile.id);
      const ack = await socketEmit<{ ok: boolean; error?: string; room?: any }>("room:join-public");
      if (!ack.ok || !ack.room) {
        return { ok: false, error: ack.error || "No public rooms open" };
      }
      dispatch({ type: "ROOM_SYNC", room: ack.room });
      if (ack.room.phase && ack.room.phase !== "lobby") {
        dispatch({
          type: "PHASE_SYNC",
          phase: ack.room.phase,
          room: ack.room,
          lastResult: ack.room.lastResult ?? null,
        });
      } else {
        dispatch({ type: "SET_SCREEN", screen: "lobby" });
      }
      return { ok: true };
    } catch {
      return { ok: false, error: "Server offline" };
    }
  }, [state.userProfile.id, wireSocket]);

  const value: GameContextValue = {
    state,
    setScreen: useCallback((screen: Screen) => dispatch({ type: "SET_SCREEN", screen }), []),
    saveProfile,
    beginCreateRoom,
    beginJoinRoom,
    beginEditProfile,
    createRoom,
    goToLobby: useCallback(() => dispatch({ type: "SET_SCREEN", screen: "lobby" }), []),
    joinRoom,
    joinPublicMatch,
    toggleReady: useCallback(() => {
      const me = state.players.find((p) => p.id === state.myPlayerId);
      void socketEmit("room:ready", { ready: !me?.isReady });
    }, [state.players, state.myPlayerId]),
    startGame: useCallback(async () => {
      if (state.soundEnabled) playClick();
      const ack = await socketEmit<{ ok: boolean; error?: string }>("room:start");
      if (!ack.ok) dispatch({ type: "SET_ERROR", error: ack.error || "Cannot start" });
    }, [state.soundEnabled]),
    revealDone: useCallback(() => {
      const me = state.players.find((p) => p.id === state.myPlayerId);
      if (!me?.isHost) return;
      void socketEmit("game:phase", { phase: "discussion" });
      dispatch({ type: "REVEAL_DONE" });
    }, [state.players, state.myPlayerId]),
    tickDiscussion: useCallback(() => {
      dispatch({ type: "TICK_DISCUSSION" });
    }, []),
    tickSipahi: useCallback(() => {
      dispatch({ type: "TICK_SIPAHI" });
    }, []),
    skipDiscussion: useCallback(() => {
      const me = state.players.find((p) => p.id === state.myPlayerId);
      if (!me?.isHost) return;
      void socketEmit("game:phase", { phase: "sipahiGuess" });
      dispatch({ type: "SKIP_DISCUSSION" });
    }, [state.players, state.myPlayerId]),
    setSipahiGuess: useCallback(
      (playerId: string) => dispatch({ type: "SET_SIPAHI_GUESS", playerId }),
      [],
    ),
    confirmSipahiGuess: useCallback(() => {
      const guessId = state.sipahiGuessId;
      if (state.myRole === "sipahi" && guessId) {
        void socketEmit("game:guess", { guessId });
      }
    }, [state.sipahiGuessId, state.myRole]),
    continueToResult: useCallback(() => {
      void socketEmit("game:phase", { phase: "roundResult" });
      dispatch({ type: "CONTINUE_TO_RESULT" });
    }, []),
    nextRound: useCallback(() => {
      void socketEmit("game:next-round");
    }, []),
    goScoreboard: useCallback(() => {
      void socketEmit("game:scoreboard");
    }, []),
    playAgain: useCallback(() => {
      void socketEmit("game:play-again");
    }, []),
    exitRoom: useCallback(() => {
      void socketEmit("room:leave");
      disableVoice();
      dispatch({ type: "EXIT_ROOM" });
      if (state.userProfile.id) {
        void connectSocket(state.userProfile.id).then(() => {
          dispatch({ type: "SET_CONNECTED", connected: true });
          wireSocket();
        });
      }
    }, [state.userProfile.id, wireSocket]),
    toggleChat: useCallback(() => dispatch({ type: "TOGGLE_CHAT" }), []),
    sendChat: useCallback((text: string) => {
      void socketEmit("chat:message", { text });
    }, []),
    markNotificationsRead: useCallback(() => dispatch({ type: "MARK_NOTIFICATIONS_READ" }), []),
    setSoundEnabled: useCallback((enabled: boolean) => {
      dispatch({ type: "SET_SOUND", enabled });
      if (enabled) playClick();
    }, []),
    setSuspenseMusic: useCallback((enabled: boolean) => {
      dispatch({ type: "SET_SUSPENSE", enabled });
      setSuspenseEnabled(enabled);
    }, []),
    setMicEnabled: useCallback((enabled: boolean) => {
      dispatch({ type: "SET_MIC", enabled });
      void socketEmit("room:mic", { micOn: enabled });
    }, []),
    setVoiceListen: useCallback((enabled: boolean) => {
      setListening(enabled);
      dispatch({ type: "SET_VOICE_LISTEN", enabled });
    }, []),
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
