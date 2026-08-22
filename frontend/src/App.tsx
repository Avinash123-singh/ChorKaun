import { useCallback } from "react";
import { GameProvider, useGame } from "./state/gameStore";
import SplashScreen from "./component/Splash/SplashScreen";
import HomeScreen from "./component/Home/HomeScreen";
import PlayerSetupScreen from "./component/PlayerSetup/PlayerSetupScreen";
import CreateRoomScreen from "./component/CreateRoom/CreateRoomScreen";
import RoomCreatedScreen from "./component/RoomCreated/RoomCreatedScreen";
import JoinRoomScreen from "./component/JoinRoom/JoinRoomScreen";
import LobbyScreen from "./component/Lobby/LobbyScreen";
import NotificationsScreen from "./component/Notifications/NotificationsScreen";
import LeaderboardScreen from "./component/Profile/LeaderboardScreen";
import ProfileScreen from "./component/Profile/ProfileScreen";
import StoreScreen from "./component/Store/StoreScreen";
import SettingsScreen from "./component/Settings/SettingsScreen";
import HowToPlayScreen from "./component/Info/HowToPlayScreen";
import AboutScreen from "./component/Info/AboutScreen";
import RoleRevealScreen from "./component/RoleReveal/RoleRevealScreen";
import DiscussionScreen from "./component/Discussion/DiscussionScreen";
import SipahiGuessScreen from "./component/SipahiTurn/SipahiGuessScreen";
import RevealRolesScreen from "./component/RevealRoles/RevealRolesScreen";
import RoundResultScreen from "./component/RoundResult/RoundResultScreen";
import ScoreboardScreen from "./component/Scoreboard/ScoreboardScreen";
import ChatPanel from "./component/Chat/ChatPanel";
import PageBackdrop from "./component/shared/PageBackdrop";
import VoiceChatFab from "./component/shared/VoiceChatFab";
import InGameSettingsFab from "./component/shared/InGameSettingsFab";

const WIDE_SCREENS = new Set([
  "lobby",
  "discussion",
  "sipahiGuess",
  "revealRoles",
  "roundResult",
  "scoreboard",
  "howToPlay",
  "leaderboard",
]);

const AppShell = () => {
  const { state, setScreen } = useGame();
  const { screen } = state;
  const backHome = () => setScreen("home");
  const finishSplash = useCallback(() => setScreen("home"), [setScreen]);

  if (screen === "splash") {
    return <SplashScreen onComplete={finishSplash} />;
  }

  let body;
  switch (screen) {
    case "home":
      body = <HomeScreen />;
      break;
    case "playerSetup":
      body = (
        <PlayerSetupScreen onBack={backHome} nextScreen={state.setupNextScreen || "createRoom"} />
      );
      break;
    case "createRoom":
      body = <CreateRoomScreen onBack={backHome} />;
      break;
    case "roomCreated":
      body = <RoomCreatedScreen />;
      break;
    case "joinRoom":
      body = <JoinRoomScreen onBack={backHome} />;
      break;
    case "lobby":
      body = <LobbyScreen />;
      break;
    case "notifications":
      body = <NotificationsScreen onBack={backHome} />;
      break;
    case "leaderboard":
      body = <LeaderboardScreen onBack={backHome} />;
      break;
    case "profile":
      body = <ProfileScreen onBack={backHome} />;
      break;
    case "store":
      body = <StoreScreen onBack={backHome} />;
      break;
    case "settings":
      body = <SettingsScreen onBack={backHome} />;
      break;
    case "howToPlay":
      body = <HowToPlayScreen onBack={backHome} />;
      break;
    case "about":
      body = <AboutScreen onBack={backHome} />;
      break;
    case "roleReveal":
      body = <RoleRevealScreen />;
      break;
    case "discussion":
      body = <DiscussionScreen />;
      break;
    case "sipahiGuess":
      body = <SipahiGuessScreen />;
      break;
    case "revealRoles":
      body = <RevealRolesScreen />;
      break;
    case "roundResult":
      body = <RoundResultScreen />;
      break;
    case "scoreboard":
      body = <ScoreboardScreen />;
      break;
    default:
      body = <HomeScreen />;
  }

  return (
    <>
      <PageBackdrop wide={WIDE_SCREENS.has(screen)}>{body}</PageBackdrop>
      <InGameSettingsFab />
      <VoiceChatFab />
      <ChatPanel />
    </>
  );
};

function App() {
  return (
    <GameProvider>
      <AppShell />
    </GameProvider>
  );
}

export default App;
