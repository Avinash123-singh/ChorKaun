import ScreenShell from "../shared/ScreenShell";
import PlayerAvatar from "../shared/PlayerAvatar";
import RoleBadge from "../shared/RoleBadge";
import { useGame } from "../../state/gameStore";

const RevealRolesScreen = () => {
  const { state, continueToResult } = useGame();
  const { players, lastResult } = state;
  const chor = players.find((p) => p.role === "chor");

  return (
    <ScreenShell title="REVEALING ROLES">
      <div className="flex flex-1 flex-col gap-5">
        <div className="flex flex-col gap-2.5">
          {players.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-2)] px-3 py-2.5"
            >
              <div className="flex items-center gap-3">
                <PlayerAvatar src={p.avatar} name={p.name} size={38} />
                <span className="text-[13px] font-bold text-white">{p.name}</span>
              </div>
              {p.role && <RoleBadge role={p.role} />}
            </div>
          ))}
        </div>

        <div className="flex-1" />

        {chor && (
          <div className="rounded-xl border border-[var(--danger)]/40 bg-[#3a0f18] px-4 py-3 text-center">
            <p className="text-[13px] font-black tracking-wide text-[var(--danger)]">
              Chor was: {chor.name}
            </p>
          </div>
        )}

        <button
          onClick={continueToResult}
          className="
            w-full rounded-2xl bg-gradient-to-r from-[var(--gold-2)] to-[var(--gold-3)]
            py-3.5 text-[15px] font-black tracking-wide text-[#241600]
            shadow-[0_6px_15px_rgba(255,180,20,0.2)]
            transition hover:scale-[1.01] active:scale-[0.98]
          "
        >
          {lastResult?.sipahiWon ? "SEE RESULT — SIPAHI WON!" : "SEE RESULT"}
        </button>
      </div>
    </ScreenShell>
  );
};

export default RevealRolesScreen;
