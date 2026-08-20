import ScreenShell from "../shared/ScreenShell";
import { ROLE_LABEL, ROLE_PORTRAIT, ROLE_POINTS, type Role } from "../../types/game";

const STEPS = [
  "Create a room (or join with a code). Exactly 4 players take seats.",
  "Host starts the game. Roles are shuffled secretly: Raja, Mantri, Chor, Sipahi.",
  "Each player privately sees their role — keep it secret!",
  "Discussion begins. Talk, bluff, and watch who looks nervous.",
  "Sipahi must guess who the Chor is.",
  "Roles are revealed, points awarded, then next round until the host’s round count ends.",
];

const ROLES: Role[] = ["raja", "sipahi", "mantri", "chor"];

interface HowToPlayScreenProps {
  onBack: () => void;
}

const HowToPlayScreen = ({ onBack }: HowToPlayScreenProps) => {
  return (
    <ScreenShell title="HOW TO PLAY" onBack={onBack}>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
        <p className="text-[13px] leading-relaxed text-white/70">
          ChorKaun is the classic Indian party game <strong className="text-white">Raja Mantri Chor
          Sipahi</strong> — a 4-player social deduction showdown.
        </p>

        <div>
          <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[var(--gold-2)]">
            Roles & Points
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((role) => (
              <div
                key={role}
                className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-panel-2)]"
              >
                <img
                  src={ROLE_PORTRAIT[role]}
                  alt={ROLE_LABEL[role]}
                  className="h-24 w-full object-cover object-top"
                />
                <div className="px-2 py-2">
                  <p className="text-[12px] font-black text-[var(--gold-2)]">{ROLE_LABEL[role]}</p>
                  <p className="text-[10px] text-white/55">{ROLE_POINTS[role]} pts base</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[var(--gold-2)]">
            Round Flow
          </h3>
          <ol className="space-y-2">
            {STEPS.map((step, i) => (
              <li
                key={step}
                className="flex gap-3 rounded-xl border border-[var(--border-subtle)] bg-black/20 px-3 py-2.5"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--purple-3)] text-[11px] font-black">
                  {i + 1}
                </span>
                <p className="text-[12px] leading-snug text-white/75">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-xl border border-[var(--gold-2)]/30 bg-[var(--gold-2)]/10 p-3 text-[12px] text-white/75">
          <strong className="text-[var(--gold-2)]">Tip:</strong> Use lobby voice chat during
          discussion — hearing hesitation is half the game.
        </div>
      </div>
    </ScreenShell>
  );
};

export default HowToPlayScreen;
