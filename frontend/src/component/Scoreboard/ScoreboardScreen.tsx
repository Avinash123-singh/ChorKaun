import ScreenShell from "../shared/ScreenShell";
import PlayerAvatar from "../shared/PlayerAvatar";
import { useGame } from "../../state/gameStore";

const ScoreboardScreen = () => {
  const { state, playAgain, exitRoom } = useGame();
  const ranked = [...state.players].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <ScreenShell title="SCOREBOARD">
      <div className="flex flex-1 flex-col gap-5">
        <div className="flex flex-col gap-2.5">
          {ranked.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${
                i === 0
                  ? "border-[var(--gold-2)]/50 bg-[#241a06]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-panel-2)]"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 text-center text-[13px] font-black text-white/60">
                  {i === 0 ? "👑" : i + 1}
                </span>
                <PlayerAvatar src={p.avatar} name={p.name} size={38} />
                <span className="text-[13px] font-bold text-white">{p.name}</span>
              </div>
              <span className="text-[15px] font-black text-[var(--gold-2)]">
                {p.totalScore}
              </span>
            </div>
          ))}
        </div>

        <div className="flex-1" />

        <div className="flex gap-3">
          <button
            onClick={playAgain}
            className="
              flex-1 rounded-2xl bg-gradient-to-r from-[var(--purple-3)] to-[var(--purple-4)]
              py-3.5 text-[14px] font-black tracking-wide text-white
              transition hover:scale-[1.01] active:scale-[0.98]
            "
          >
            PLAY AGAIN
          </button>
          <button
            onClick={exitRoom}
            className="
              flex-1 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-panel-2)]
              py-3.5 text-[14px] font-black tracking-wide text-white/80
              transition hover:border-white/30
            "
          >
            EXIT ROOM
          </button>
        </div>
      </div>
    </ScreenShell>
  );
};

export default ScoreboardScreen;
