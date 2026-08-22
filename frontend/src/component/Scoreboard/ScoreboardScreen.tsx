import ScreenShell from "../shared/ScreenShell";
import PlayerAvatar from "../shared/PlayerAvatar";
import { useGame } from "../../state/gameStore";

const ScoreboardScreen = () => {
  const { state, playAgain, exitRoom } = useGame();
  const ranked = [...state.players].sort((a, b) => b.totalScore - a.totalScore);
  const me = state.players.find((p) => p.id === state.myPlayerId);
  const isHost = !!me?.isHost;
  const winner = ranked[0];

  return (
    <ScreenShell title="SCOREBOARD">
      <div className="relative flex flex-1 flex-col gap-5">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,rgba(255,200,46,0.15),transparent)]" />

        {winner && (
          <div className="relative overflow-hidden rounded-2xl border border-[var(--gold-2)]/40 bg-gradient-to-br from-[#3a2a08] via-[#241a06] to-[#1C0C3B] p-4 text-center shadow-[0_12px_40px_rgba(255,200,46,0.12)]">
            <p className="text-[11px] font-black tracking-[3px] text-[var(--gold-2)]">CHAMPION</p>
            <div className="mt-2 flex items-center justify-center gap-3">
              <span className="text-[28px]">👑</span>
              <PlayerAvatar src={winner.avatar} name={winner.name} size={48} />
              <div className="text-left">
                <p className="font-display text-[18px] font-black text-white">{winner.name}</p>
                <p className="text-[14px] font-black text-[var(--gold-2)]">{winner.totalScore} pts</p>
              </div>
            </div>
          </div>
        )}

        <div className="relative flex flex-col gap-2.5">
          {ranked.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center justify-between rounded-xl border px-3 py-2.5 backdrop-blur-sm ${
                i === 0
                  ? "border-[var(--gold-2)]/50 bg-gradient-to-r from-[#3a2a08]/80 to-[#241a06]/60 shadow-[0_4px_20px_rgba(255,200,46,0.1)]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-panel-2)]/90"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-center text-[14px] font-black text-white/60">
                  {i === 0 ? "👑" : i + 1}
                </span>
                <PlayerAvatar src={p.avatar} name={p.name} size={38} />
                <span className="text-[13px] font-bold text-white">
                  {p.name}
                  {p.id === state.myPlayerId ? " (You)" : ""}
                </span>
              </div>
              <span className="text-[15px] font-black text-[var(--gold-2)]">{p.totalScore}</span>
            </div>
          ))}
        </div>

        <div className="flex-1" />

        <div className="relative flex gap-3">
          {isHost ? (
            <button
              type="button"
              onClick={playAgain}
              className="flex-1 rounded-2xl bg-gradient-to-r from-[var(--purple-3)] to-[var(--purple-4)] py-3.5 text-[14px] font-black tracking-wide text-white shadow-[0_8px_24px_rgba(116,36,211,0.3)]"
            >
              PLAY AGAIN
            </button>
          ) : (
            <div className="flex-1 rounded-2xl border border-[var(--border-soft)] bg-black/30 py-3.5 text-center text-[12px] font-semibold text-white/50">
              Waiting for host to start…
            </div>
          )}
          <button
            type="button"
            onClick={exitRoom}
            className="flex-1 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-panel-2)] py-3.5 text-[14px] font-black tracking-wide text-white/80"
          >
            EXIT ROOM
          </button>
        </div>
      </div>
    </ScreenShell>
  );
};

export default ScoreboardScreen;
