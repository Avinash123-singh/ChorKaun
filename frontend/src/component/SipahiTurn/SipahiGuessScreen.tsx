import { Check } from "lucide-react";
import ScreenShell from "../shared/ScreenShell";
import StepBadge from "../shared/StepBadge";
import { useGame } from "../../state/gameStore";

const SUSPECT_AVATAR: Record<string, string> = {
  Rahul: "/assets/suspect_rahul.png",
  Aman: "/assets/suspect_aman.png",
  Priya: "/assets/suspect_priya.png",
  Neha: "/assets/suspect_neha.png",
};

const SipahiGuessScreen = () => {
  const { state, setSipahiGuess, confirmSipahiGuess } = useGame();
  const { players, sipahiGuessId } = state;

  return (
    <div>
      <StepBadge step={10} label="Sipahi Guesses" />
      <ScreenShell title="WHO IS CHOR?">
        <div className="flex flex-1 flex-col gap-4">
          <p className="-mt-2 text-center text-[13px] text-white/55">Sipahi, choose the Chor</p>

          <div className="flex flex-col gap-2.5">
            {players.map((p) => {
              const selected = sipahiGuessId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSipahiGuess(p.id)}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2.5 transition ${
                    selected
                      ? "border-[var(--success)] bg-[var(--success)]/15"
                      : "border-[var(--border-subtle)] bg-[var(--bg-panel-2)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-[var(--gold-2)]">
                      <img
                        src={SUSPECT_AVATAR[p.name] ?? p.avatar}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
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
            onClick={confirmSipahiGuess}
            disabled={!sipahiGuessId}
            className={`w-full rounded-2xl py-3.5 text-[15px] font-black tracking-wide transition ${
              sipahiGuessId
                ? "bg-gradient-to-r from-[var(--purple-2)] to-[var(--purple-3)] text-white hover:scale-[1.01] active:scale-[0.98]"
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
