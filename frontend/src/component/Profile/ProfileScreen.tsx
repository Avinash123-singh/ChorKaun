import ScreenShell from "../shared/ScreenShell";
import { useGame } from "../../state/gameStore";

interface ProfileScreenProps {
  onBack: () => void;
}

const ProfileScreen = ({ onBack }: ProfileScreenProps) => {
  const { state, beginEditProfile } = useGame();
  const p = state.userProfile;

  return (
    <ScreenShell title="PROFILE" onBack={onBack}>
      <div className="flex flex-1 flex-col items-center gap-5">
        <div className="h-28 w-28 overflow-hidden rounded-full border-2 border-[var(--gold-2)] shadow-[0_0_28px_rgba(255,200,46,0.35)]">
          <img src={p.avatar} alt={p.name} className="h-full w-full object-cover" />
        </div>
        <div className="text-center">
          <h2 className="font-display text-[26px] font-black text-gold-gradient">
            {p.name || "Guest Player"}
          </h2>
          <p className="mt-1 text-[13px] text-white/60">Level {p.level}</p>
        </div>

        <div className="grid w-full grid-cols-3 gap-2">
          {[
            ["Coins", p.coins.toLocaleString()],
            ["Games", String(p.gamesPlayed)],
            ["Wins", String(p.wins)],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-panel-2)] px-3 py-3 text-center"
            >
              <p className="font-display text-[18px] font-black text-[var(--gold-2)]">{value}</p>
              <p className="text-[11px] text-white/50">{label}</p>
            </div>
          ))}
        </div>

        <div className="w-full rounded-xl border border-[var(--border-soft)] bg-black/25 p-4 text-[12px] leading-relaxed text-white/65">
          Complete rounds as Sipahi to climb the leaderboard. Host rooms with friends and keep your
          mic ready for live discussion.
        </div>

        <div className="flex-1" />

        <button
          type="button"
          onClick={beginEditProfile}
          className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-panel-2)] py-3 text-[14px] font-bold text-white transition hover:bg-white/5"
        >
          Edit Profile
        </button>
      </div>
    </ScreenShell>
  );
};

export default ProfileScreen;
