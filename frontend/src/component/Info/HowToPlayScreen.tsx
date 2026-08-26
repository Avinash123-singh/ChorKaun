import ScreenShell from "../shared/ScreenShell";
import {
  ROLE_LABEL,
  ROLE_PORTRAIT,
  ROLE_POINTS,
  type Role,
} from "../../types/game";

const ROLES: Role[] = ["raja", "sipahi", "mantri", "chor"];

const ROLE_HOW: Record<Role, string> = {
  raja: "Always safe. Score every round and watch the chaos.",
  sipahi: "Find the Chor. Guess right to earn your points.",
  mantri: "Innocent ally. Stay quiet and collect points.",
  chor: "Blend in. You score only if Sipahi guesses wrong.",
};

const STEPS = [
  {
    title: "Gather 4 players",
    detail: "Create a private room and share the code, or join a public match. All four seats must fill before the host can start.",
  },
  {
    title: "Host starts the round",
    detail: "Roles shuffle in secret — Raja, Mantri, Chor, Sipahi. Exactly one of each. Nobody else sees your card.",
  },
  {
    title: "Private role reveal",
    detail: "Read your mission carefully. Keep it secret. Talking too fast or freezing up can give you away.",
  },
  {
    title: "Discussion & bluffing",
    detail: "Use voice + chat. Accuse, defend, and listen for hesitation. Mantri and Chor both look “innocent”.",
  },
  {
    title: "Sipahi’s guess",
    detail: "When discussion ends, Sipahi must pick who they think is the Chor. A wrong guess lets the Chor escape.",
  },
  {
    title: "Reveal & score",
    detail: "Roles flip open, points are awarded, then the next round begins until the host’s round count is done.",
  },
];

const SCORING = [
  { label: "Raja", pts: "1000", note: "Every round — always safe" },
  { label: "Mantri", pts: "750", note: "Every round — always safe" },
  { label: "Sipahi", pts: "500", note: "Only if the Chor is caught" },
  { label: "Chor", pts: "500", note: "Only if Sipahi is wrong" },
];

interface HowToPlayScreenProps {
  onBack: () => void;
}

const HowToPlayScreen = ({ onBack }: HowToPlayScreenProps) => {
  return (
    <ScreenShell
      title="HOW TO PLAY"
      onBack={onBack}
      className="!min-h-0 h-[calc(100dvh-1rem)] sm:h-[calc(100dvh-1.5rem)]"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain pr-1 sm:gap-5">
        <p className="text-[14px] leading-relaxed text-white/80 sm:text-[16px]">
          <strong className="text-white">ChorKaun</strong> is the classic Indian party game{" "}
          <strong className="text-[var(--gold-2)]">Raja · Mantri · Chor · Sipahi</strong>. Four
          players. One thief. One guess. Talk, bluff, listen — and catch the Chor before they slip
          away.
        </p>

        <section>
          <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[var(--gold-2)] sm:mb-3 sm:text-[13px]">
            Roles & What They Do
          </h3>
          <div className="flex flex-nowrap gap-2.5 sm:gap-3">
            {ROLES.map((role) => (
              <div
                key={role}
                className="flex w-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-panel-2)]"
              >
                <div className="flex h-[120px] w-full items-center justify-center bg-black/30 p-2 sm:h-[168px] sm:p-3 lg:h-[190px]">
                  <img
                    src={ROLE_PORTRAIT[role]}
                    alt={ROLE_LABEL[role]}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1 px-2 py-2.5 sm:px-3 sm:py-3">
                  <p className="text-center text-[12px] font-black text-[var(--gold-2)] sm:text-[14px]">
                    {ROLE_LABEL[role]}
                  </p>
                  <p className="text-center text-[11px] font-bold text-white/75 sm:text-[12px]">
                    {ROLE_POINTS[role]} pts base
                  </p>
                  <p className="text-center text-[11px] leading-snug text-white/55 sm:text-[12px]">
                    {ROLE_HOW[role]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[var(--gold-2)] sm:text-[13px]">
            How Scoring Works
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {SCORING.map((row) => (
              <div
                key={row.label}
                className="rounded-xl border border-[var(--border-subtle)] bg-black/25 px-3 py-3"
              >
                <p className="text-[13px] font-black text-white">{row.label}</p>
                <p className="text-[18px] font-black text-[var(--gold-2)] sm:text-[20px]">
                  {row.pts}
                  <span className="ml-1 text-[11px] font-bold text-white/45">pts</span>
                </p>
                <p className="mt-1 text-[12px] leading-snug text-white/55">{row.note}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[13px] leading-snug text-white/55">
            Raja and Mantri always score. Sipahi and Chor fight over 500 points — only one of them
            gets paid each round.
          </p>
        </section>

        <section>
          <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[var(--gold-2)] sm:text-[13px]">
            Round Flow
          </h3>
          <ol className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="flex gap-3 rounded-xl border border-[var(--border-subtle)] bg-black/20 px-3 py-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--purple-3)] text-[13px] font-black">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-white">{step.title}</p>
                  <p className="mt-1 text-[13px] leading-snug text-white/60">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="rounded-xl border border-[var(--gold-2)]/35 bg-[var(--gold-2)]/10 px-4 py-3 text-[14px] leading-snug text-white/85">
          <strong className="text-[var(--gold-2)]">Pro tip:</strong> Turn on lobby voice chat.
          Hesitation, over-explaining, or sudden silence often reveals the Chor faster than any
          accusation. Play a few rounds — the bluffing gets better every time.
        </div>
      </div>
    </ScreenShell>
  );
};

export default HowToPlayScreen;
