import HomeHeader from "./HomeHeader";
import GameLogo from "./GameLogo";
import GameActions from "./GameActions";
import QuickActions from "./QuickActions";
import BottomLinks from "./BottomLinks";
import ScreenShell from "../shared/ScreenShell";
import { useGame } from "../../state/gameStore";
import type { Screen } from "../../types/game";

const HomeScreen = () => {
  const { beginCreateRoom, beginJoinRoom, setScreen, joinRoom, state } = useGame();

  const go = (screen: Screen) => setScreen(screen);

  return (
    <ScreenShell>
      <div className="flex flex-1 flex-col gap-5">
        <HomeHeader
          onNotifications={() => go("notifications")}
          onProfile={() => go("profile")}
          onStore={() => go("store")}
        />

        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-2">
          <GameLogo />

          <p className="-mt-1 text-center text-[13px] font-semibold tracking-wide text-white/60">
            Find the Hidden Chor
          </p>

          <div className="mt-4 w-full">
            <GameActions
              onCreateRoom={beginCreateRoom}
              onJoinRoom={beginJoinRoom}
              onPlayOnline={() => {
                if (!state.userProfile.setupComplete) {
                  setScreen("playerSetup");
                  return;
                }
                joinRoom(String(Math.floor(100000 + Math.random() * 900000)));
              }}
            />
          </div>

          <div className="w-full">
            <QuickActions onNavigate={go} />
          </div>
        </div>

        <BottomLinks onHowToPlay={() => go("howToPlay")} onAbout={() => go("about")} />
      </div>
    </ScreenShell>
  );
};

export default HomeScreen;
