import { Bell, Coins } from "lucide-react";
import { useGame } from "../../state/gameStore";

interface HomeHeaderProps {
  onNotifications?: () => void;
  onProfile?: () => void;
  onStore?: () => void;
}

const HomeHeader = ({ onNotifications, onProfile, onStore }: HomeHeaderProps) => {
  const { state } = useGame();
  const profile = state.userProfile;
  const unread = state.notifications.filter((n) => !n.read).length;

  return (
    <header className="flex items-center justify-between">
      <button type="button" onClick={onProfile} className="flex items-center gap-2 text-left">
        <div className="h-[43px] w-[43px] overflow-hidden rounded-full border-2 border-[var(--gold-2)] bg-[var(--bg-panel-2)]">
          <img
            src={profile.avatar || "/assets/rahul-avatar.png"}
            alt={profile.name || "Player"}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="leading-tight">
          <p className="text-[14px] font-bold text-white">{profile.name || "Guest"}</p>
          <p className="text-[11px] text-white/75">Level {profile.level}</p>
        </div>
      </button>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onStore}
          className="flex h-[31px] items-center gap-[5px] rounded-full border border-[var(--border-soft)] bg-[var(--bg-panel)] px-[10px] transition hover:border-[var(--gold-2)]/50"
        >
          <div className="flex h-[17px] w-[17px] items-center justify-center rounded-full bg-[var(--gold-2)]">
            <Coins size={11} strokeWidth={3} className="text-[#7A4B00]" />
          </div>
          <span className="text-[12px] font-bold">{profile.coins.toLocaleString()}</span>
        </button>

        <button
          type="button"
          onClick={onNotifications}
          className="relative flex h-[31px] w-[31px] items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--bg-panel)] transition hover:border-[var(--gold-2)]/50"
        >
          <Bell size={15} strokeWidth={2.5} className="text-[var(--gold-1)]" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[var(--danger)] px-0.5 text-[8px] font-black">
              {unread}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

export default HomeHeader;
