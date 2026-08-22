import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import ScreenShell from "../shared/ScreenShell";
import { useGame } from "../../state/gameStore";
import { apiGetLeaderboard } from "../../lib/api";

interface LeaderRow {
  id: string;
  name: string;
  avatar: string;
  totalScore: number;
  wins: number;
}

interface LeaderboardScreenProps {
  onBack: () => void;
}

const LeaderboardScreen = ({ onBack }: LeaderboardScreenProps) => {
  const { state } = useGame();
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const leaders = await apiGetLeaderboard();
      setRows(leaders);
      setLoading(false);
    })();
  }, []);

  const youId = state.userProfile.id;

  return (
    <ScreenShell title="LEADERBOARD" onBack={onBack}>
      <div className="flex flex-1 flex-col gap-3">
        <div className="mb-2 flex items-center justify-center gap-2 text-[var(--gold-2)]">
          <Trophy size={22} />
          <p className="text-[13px] font-semibold text-white/70">All-time top players</p>
        </div>

        {loading && (
          <p className="text-center text-[12px] text-white/45">Loading rankings…</p>
        )}

        {!loading && rows.length === 0 && (
          <p className="text-center text-[12px] text-white/45">
            Play a full game to appear on the board!
          </p>
        )}

        {rows.map((row, i) => (
          <div
            key={row.id}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
              row.id === youId
                ? "border-[var(--gold-2)]/50 bg-gradient-to-r from-[#3a2a08]/60 to-[#241a06]/40"
                : i === 0
                  ? "border-[var(--gold-2)]/30 bg-[var(--bg-panel-2)]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-panel-2)]"
            }`}
          >
            <span className="w-6 text-center font-display text-[16px] font-black text-[var(--gold-2)]">
              {i === 0 ? "👑" : i + 1}
            </span>
            <img src={row.avatar} alt="" className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10" />
            <div className="flex-1">
              <p className="text-[13px] font-bold text-white">
                {row.name}
                {row.id === youId ? " (You)" : ""}
              </p>
              <p className="text-[11px] text-white/45">
                {row.totalScore.toLocaleString()} pts · {row.wins} wins
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScreenShell>
  );
};

export default LeaderboardScreen;
