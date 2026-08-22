import ScreenShell from "../shared/ScreenShell";
import PlayerAvatar from "../shared/PlayerAvatar";
import RoleBadge from "../shared/RoleBadge";
import { useGame } from "../../state/gameStore";

/** Optional wrap screen — roles are public after Sipahi guesses. */
const RevealRolesScreen = () => {
  const { state, continueToResult } = useGame();
  const { players, myPlayerId } = state;

  return (
    <ScreenShell title="ROUND WRAP">
      <div className="flex flex-1 flex-col gap-5">
        <p className="text-center text-[12px] text-white/55">All roles revealed for this round</p>
        <div className="flex flex-col gap-2.5">
          {players.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-2)] px-3 py-2.5"
            >
              <div className="flex items-center gap-3">
                <PlayerAvatar src={p.avatar} name={p.name} size={38} />
                <span className="text-[13px] font-bold text-white">
                  {p.name}
                  {p.id === myPlayerId ? " (You)" : ""}
                </span>
              </div>
              {p.role ? (
                <RoleBadge role={p.role} />
              ) : (
                <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold text-white/40">
                  —
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="flex-1" />

        <button
          type="button"
          onClick={continueToResult}
          className="w-full rounded-2xl bg-gradient-to-r from-[var(--gold-2)] to-[var(--gold-3)] py-3.5 text-[15px] font-black text-[#241600]"
        >
          SEE RESULT
        </button>
      </div>
    </ScreenShell>
  );
};

export default RevealRolesScreen;
