import ScreenShell from "../shared/ScreenShell";
import PlayerAvatar from "../shared/PlayerAvatar";
import RoleBadge from "../shared/RoleBadge";
import { useGame } from "../../state/gameStore";

const RoundResultScreen = () => {
  const { state, nextRound } = useGame();
  const { players, lastResult, round, totalRounds } = state;
  const chor = players.find((p) => p.id === lastResult?.chorId);

  return (
    <ScreenShell>
      <div className="flex flex-1 flex-col items-center gap-5 pt-[2vh]">
        <h1 className="text-[13px] font-black tracking-[3px] text-[var(--gold-2)]">
          ROUND RESULT
        </h1>

        <div className="text-center">
          <p
            className={`text-[26px] font-black ${
              lastResult?.sipahiWon ? "text-[var(--success)]" : "text-[var(--danger)]"
            }`}
          >
            {lastResult?.sipahiWon ? "SIPAHI WON!" : "SIPAHI LOST!"}
          </p>
          <p className="mt-1 text-[12px] font-medium text-white/60">
            {lastResult?.sipahiWon ? "Correct!" : "Wrong guess!"} {chor?.name} was the CHOR
          </p>
        </div>

        <div className="flex w-full flex-col gap-2.5">
          {players.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-2)] px-3 py-2.5"
            >
              <div className="flex items-center gap-3">
                <PlayerAvatar src={p.avatar} name={p.name} size={36} />
                <div className="leading-tight">
                  <p className="text-[13px] font-bold text-white">{p.name}</p>
                  {p.role && <RoleBadge role={p.role} />}
                </div>
              </div>
              <span className="text-[14px] font-black text-[var(--gold-2)]">
                +{p.lastRoundPoints}
              </span>
            </div>
          ))}
        </div>

        <div className="flex-1" />

        <button
          onClick={nextRound}
          className="
            w-full rounded-2xl bg-gradient-to-r from-[var(--gold-2)] to-[var(--gold-3)]
            py-3.5 text-[15px] font-black tracking-wide text-[#241600]
            shadow-[0_6px_15px_rgba(255,180,20,0.2)]
            transition hover:scale-[1.01] active:scale-[0.98]
          "
        >
          {round >= totalRounds ? "SEE FINAL SCOREBOARD" : "NEXT ROUND"}
        </button>

        <p className="text-[11px] font-semibold text-white/40">
          Round {round} / {totalRounds}
        </p>
      </div>
    </ScreenShell>
  );
};

export default RoundResultScreen;
