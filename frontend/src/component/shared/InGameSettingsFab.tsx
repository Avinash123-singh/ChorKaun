import { useState } from "react";
import { Settings, Volume2, VolumeX, Music2, BookOpen, X } from "lucide-react";
import { useGame } from "../../state/gameStore";
import { ROLE_LABEL, ROLE_POINTS, type Role } from "../../types/game";

const IN_GAME = new Set([
  "lobby",
  "roleReveal",
  "discussion",
  "sipahiGuess",
  "revealRoles",
  "roundResult",
  "scoreboard",
]);

const ROLES: Role[] = ["raja", "sipahi", "mantri", "chor"];

const InGameSettingsFab = () => {
  const { state, setSoundEnabled, setSuspenseMusic } = useGame();
  const [open, setOpen] = useState(false);
  const [howTo, setHowTo] = useState(false);

  if (!IN_GAME.has(state.screen)) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setHowTo(false);
          setOpen(true);
        }}
        className="fixed bottom-6 left-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--bg-panel)]/95 text-white/80 shadow-[0_10px_25px_rgba(0,0,0,0.45)] backdrop-blur"
        aria-label="Game settings"
        title="Settings"
      >
        <Settings size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-[var(--border-soft)] bg-[#120a1f] p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[14px] font-black tracking-wide text-[var(--gold-2)]">
                {howTo ? "HOW TO PLAY" : "SETTINGS"}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-white/50"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {howTo ? (
              <div className="space-y-3 text-[12px] leading-relaxed text-white/70">
                <p>
                  4 players. Secret roles: Raja, Mantri, Chor, Sipahi. Discuss, then Sipahi guesses
                  the Chor.
                </p>
                <ul className="space-y-1">
                  {ROLES.map((r) => (
                    <li key={r}>
                      <span className="font-bold text-white">{ROLE_LABEL[r]}</span> — {ROLE_POINTS[r]}{" "}
                      pts
                    </li>
                  ))}
                </ul>
                <p>If Sipahi is wrong, Chor gets the points instead.</p>
                <button
                  type="button"
                  onClick={() => setHowTo(false)}
                  className="w-full rounded-xl border border-[var(--border-soft)] py-2 text-[12px] font-bold text-white/80"
                >
                  Back to settings
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!state.soundEnabled)}
                  className="mb-2 flex w-full items-center gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-panel-2)] px-3 py-3 text-left"
                >
                  {state.soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                  <div>
                    <p className="text-[13px] font-bold text-white">Game Sound</p>
                    <p className="text-[11px] text-white/45">{state.soundEnabled ? "On" : "Off"}</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSuspenseMusic(!state.suspenseMusic)}
                  className="mb-2 flex w-full items-center gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-panel-2)] px-3 py-3 text-left"
                >
                  <Music2 size={18} />
                  <div>
                    <p className="text-[13px] font-bold text-white">Suspense Music</p>
                    <p className="text-[11px] text-white/45">
                      {state.suspenseMusic ? "On" : "Off"}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setHowTo(true)}
                  className="flex w-full items-center gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-panel-2)] px-3 py-3 text-left"
                >
                  <BookOpen size={18} />
                  <div>
                    <p className="text-[13px] font-bold text-white">How to Play</p>
                    <p className="text-[11px] text-white/45">Quick rules refresher</p>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default InGameSettingsFab;
