import { Trophy } from "lucide-react";
import ScreenShell from "../shared/ScreenShell";
import { useGame } from "../../state/gameStore";

const LEADERS = [
  { name: "Priya", score: 12400, avatar: "/assets/priya-avatar.png" },
  { name: "Aman", score: 11250, avatar: "/assets/aman-avatar.png" },
  { name: "Neha", score: 9800, avatar: "/assets/neha-avatar.png" },
  { name: "Vikram", score: 8750, avatar: "/assets/vikram-avatar.png" },
  { name: "Isha", score: 7600, avatar: "/assets/isha-avatar.png" },
];

interface LeaderboardScreenProps {
  onBack: () => void;
}

const LeaderboardScreen = ({ onBack }: LeaderboardScreenProps) => {
  const { state } = useGame();
  const you = {
    name: state.userProfile.name || "You",
    score: state.userProfile.wins * 800 + state.userProfile.gamesPlayed * 120,
    avatar: state.userProfile.avatar,
  };

  const rows = [...LEADERS, you]
    .sort((a, b) => b.score - a.score)
    .map((row, i) => ({ ...row, rank: i + 1 }));

  return (
    <ScreenShell title="LEADERBOARD" onBack={onBack}>
      <div className="flex flex-1 flex-col gap-3">
        <div className="mb-2 flex items-center justify-center gap-2 text-[var(--gold-2)]">
          <Trophy size={22} />
          <p className="text-[13px] font-semibold text-white/70">Top Chor hunters this week</p>
        </div>
        {rows.map((row) => (
          <div
            key={`${row.name}-${row.rank}`}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
              row.name === you.name
                ? "border-[var(--gold-2)]/50 bg-[var(--gold-2)]/10"
                : "border-[var(--border-subtle)] bg-[var(--bg-panel-2)]"
            }`}
          >
            <span className="w-6 text-center font-display text-[16px] font-black text-[var(--gold-2)]">
              {row.rank}
            </span>
            <img src={row.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
            <div className="flex-1">
              <p className="text-[13px] font-bold text-white">{row.name}</p>
              <p className="text-[11px] text-white/45">{row.score.toLocaleString()} pts</p>
            </div>
          </div>
        ))}
      </div>
    </ScreenShell>
  );
};

export default LeaderboardScreen;
