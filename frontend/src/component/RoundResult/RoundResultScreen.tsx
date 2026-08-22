import ScreenShell from "../shared/ScreenShell";
import PlayerAvatar from "../shared/PlayerAvatar";
import RoleBadge from "../shared/RoleBadge";
import { ROLE_CARD_BG, ROLE_EMOJI } from "../../types/game";
import { useGame } from "../../state/gameStore";

const RoundResultScreen = () => {
  const { state, nextRound, goScoreboard } = useGame();
  const { players, lastResult, round, totalRounds, myPlayerId } = state;
  const me = players.find((p) => p.id === myPlayerId);
  const isHost = !!me?.isHost;
  const isFinal = round >= totalRounds;
  const chor = players.find((p) => p.id === lastResult?.chorId);

  return (
    <ScreenShell>
      <div className="relative flex flex-1 flex-col items-center gap-5 pt-[2vh]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_at_top,rgba(255,200,46,0.12),transparent)]" />

        <h1 className="relative text-[13px] font-black tracking-[3px] text-[var(--gold-2)]">
          ROUND RESULT
        </h1>

        <div className="relative text-center">
          {lastResult?.timedOut ? (
            <>
              <p className="text-[26px] font-black text-[var(--danger)]">TIME UP!</p>
              <p className="mt-1 text-[12px] text-white/60">Sipahi got 0 — Chor takes the points</p>
            </>
          ) : (
            <>
              <p
                className={`text-[26px] font-black ${
                  lastResult?.sipahiWon ? "text-[var(--success)]" : "text-[var(--danger)]"
                }`}
              >
                {lastResult?.sipahiWon ? "SIPAHI WON!" : "SIPAHI LOST!"}
              </p>
              <p className="mt-1 text-[12px] font-medium text-white/60">
                {lastResult?.sipahiWon ? "Correct!" : "Wrong guess!"} {chor?.name || "Someone"} was
                the CHOR
              </p>
            </>
          )}
        </div>

        <div className="flex w-full flex-col gap-2.5">
          {players.map((p) => {
            const pts = lastResult?.pointsAwarded?.[p.id] ?? p.lastRoundPoints ?? 0;
            const bg = p.role ? ROLE_CARD_BG[p.role] : "from-[#1a1028] to-[#0B061B]";
            return (
              <div
                key={p.id}
                className={`flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-gradient-to-r px-3 py-2.5 ${bg}`}
              >
                <div className="flex items-center gap-3">
                  <PlayerAvatar src={p.avatar} name={p.name} size={36} />
                  <div className="leading-tight">
                    <p className="text-[13px] font-bold text-white">
                      {p.role && <span className="mr-1">{ROLE_EMOJI[p.role]}</span>}
                      {p.name}
                      {p.id === myPlayerId ? " (You)" : ""}
                    </p>
                    {p.role && <RoleBadge role={p.role} />}
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-[14px] font-black text-[var(--gold-2)]">+{pts}</span>
                  <span className="text-[10px] text-white/40">Total {p.totalScore}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex-1" />

        {isFinal ? (
          <button
            type="button"
            onClick={goScoreboard}
            className="w-full rounded-2xl bg-gradient-to-r from-[var(--gold-2)] to-[var(--gold-3)] py-3.5 text-[15px] font-black tracking-wide text-[#241600] shadow-[0_8px_24px_rgba(255,180,20,0.3)]"
          >
            SEE FINAL SCOREBOARD
          </button>
        ) : isHost ? (
          <button
            type="button"
            onClick={nextRound}
            className="w-full rounded-2xl bg-gradient-to-r from-[var(--gold-2)] to-[var(--gold-3)] py-3.5 text-[15px] font-black tracking-wide text-[#241600] shadow-[0_8px_24px_rgba(255,180,20,0.3)]"
          >
            NEXT ROUND
          </button>
        ) : (
          <p className="w-full rounded-2xl border border-[var(--border-soft)] bg-black/30 py-3.5 text-center text-[13px] font-semibold text-white/55">
            Waiting for host to start next round…
          </p>
        )}

        <p className="text-[11px] font-semibold text-white/40">
          Round {round} / {totalRounds}
        </p>
      </div>
    </ScreenShell>
  );
};

export default RoundResultScreen;
