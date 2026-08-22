import { useEffect } from "react";
import { Check } from "lucide-react";
import ScreenShell from "../shared/ScreenShell";
import StepBadge from "../shared/StepBadge";
import { useGame } from "../../state/gameStore";

const SipahiGuessScreen = () => {
  const { state, setSipahiGuess, confirmSipahiGuess, tickSipahi } = useGame();
  const { players, sipahiGuessId, myRole, myPlayerId, sipahiSecondsLeft } = state;

  useEffect(() => {
    if (state.screen !== "sipahiGuess") return;
    const t = setInterval(() => tickSipahi(), 1000);
    return () => clearInterval(t);
  }, [state.screen, tickSipahi]);

  if (myRole && myRole !== "sipahi") {
    return (
      <div>
        <StepBadge step={10} label="Sipahi Guesses" />
        <ScreenShell title="WAITING">
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <p className="font-display text-[20px] font-black text-gold-gradient">
              Sipahi is choosing…
            </p>
            <p className="text-[36px] font-black text-[var(--gold-2)]">{sipahiSecondsLeft}s</p>
            <p className="max-w-[260px] text-[13px] text-white/60">
              Result shows automatically when they pick or time runs out.
            </p>
          </div>
        </ScreenShell>
      </div>
    );
  }

  const suspects = players.filter((p) => p.id !== myPlayerId);
  const urgent = sipahiSecondsLeft <= 5;

  return (
    <div>
      <StepBadge step={10} label="Sipahi Guesses" />
      <ScreenShell title="WHO IS CHOR?">
        <div className="flex flex-1 flex-col gap-4">
          <div className="text-center">
            <p className="-mt-2 text-[13px] text-white/55">You are Sipahi — pick the Chor</p>
            <p
              className={`mt-2 font-display text-[32px] font-black ${urgent ? "text-[var(--danger)]" : "text-[var(--gold-2)]"}`}
            >
              {sipahiSecondsLeft}s left
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            {suspects.map((p) => {
              const selected = sipahiGuessId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSipahiGuess(p.id)}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2.5 transition ${
                    selected
                      ? "border-[var(--success)] bg-[var(--success)]/15 shadow-[0_0_20px_rgba(61,214,140,0.15)]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-panel-2)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-[var(--gold-2)]">
                      <img src={p.avatar} alt={p.name} className="h-full w-full object-cover" />
                    </div>
                    <span className="text-[13px] font-bold text-white">{p.name}</span>
                  </div>
                  {selected && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--success)]">
                      <Check size={14} className="text-white" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex-1" />

          <button
            type="button"
            onClick={confirmSipahiGuess}
            disabled={!sipahiGuessId || sipahiSecondsLeft <= 0}
            className={`w-full rounded-2xl py-3.5 text-[15px] font-black tracking-wide transition ${
              sipahiGuessId && sipahiSecondsLeft > 0
                ? "bg-gradient-to-r from-[var(--purple-2)] to-[var(--purple-3)] text-white shadow-[0_8px_24px_rgba(116,36,211,0.35)]"
                : "cursor-not-allowed bg-[var(--border-subtle)] text-white/30"
            }`}
          >
            CONFIRM
          </button>
        </div>
      </ScreenShell>
    </div>
  );
};

export default SipahiGuessScreen;
