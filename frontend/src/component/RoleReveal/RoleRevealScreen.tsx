import { useEffect, useState } from "react";
import { ChevronLeft, Lock, Sparkles } from "lucide-react";
import { useGame } from "../../state/gameStore";
import {
  ROLE_ACCENT,
  ROLE_LABEL,
  ROLE_PORTRAIT,
  ROLE_REVEAL_TEXT,
  type Role,
} from "../../types/game";
import PlayerAvatar from "../shared/PlayerAvatar";
import ScreenShell from "../shared/ScreenShell";
import StepBadge from "../shared/StepBadge";
import CornerFlourish from "../shared/CornerFlourish";

type Phase = "pass" | "shuffle" | "revealed";

const SHUFFLE_ROLES: Role[] = ["raja", "sipahi", "mantri", "chor"];

const RoleRevealScreen = () => {
  const { state, revealNext } = useGame();
  const { players, revealIndex } = state;
  const player = players[revealIndex];

  const [phase, setPhase] = useState<Phase>(revealIndex > 0 ? "pass" : "shuffle");
  const [shuffleFace, setShuffleFace] = useState(0);

  useEffect(() => {
    setPhase(revealIndex > 0 ? "pass" : "shuffle");
    setShuffleFace(0);
  }, [revealIndex]);

  // Card shuffle animation → auto-reveal (no tap)
  useEffect(() => {
    if (phase !== "shuffle") return;

    const tick = setInterval(() => {
      setShuffleFace((n) => (n + 1) % SHUFFLE_ROLES.length);
    }, 140);

    const done = setTimeout(() => {
      clearInterval(tick);
      setPhase("revealed");
    }, 1600);

    return () => {
      clearInterval(tick);
      clearTimeout(done);
    };
  }, [phase, revealIndex]);

  // After reveal, advance to next player / discussion
  useEffect(() => {
    if (phase !== "revealed") return;
    const t = setTimeout(() => {
      revealNext();
    }, 3200);
    return () => clearTimeout(t);
  }, [phase, revealIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!player) return null;

  if (phase === "pass") {
    return (
      <ScreenShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <PlayerAvatar src={player.avatar} name={player.name} size={90} />
          <p className="text-[13px] font-semibold text-white/60">Pass the device to</p>
          <p className="font-display text-[26px] font-black text-gold-gradient">{player.name}</p>
          <button
            onClick={() => setPhase("shuffle")}
            className="
              mt-2 rounded-2xl bg-gradient-to-r from-[var(--purple-2)] to-[var(--purple-3)]
              px-8 py-3 text-[14px] font-black tracking-wide text-white
              shadow-[0_10px_25px_rgba(90,20,140,0.4)] transition hover:scale-[1.02] active:scale-[0.98]
            "
          >
            I'M {player.name.toUpperCase()}, CONTINUE
          </button>
        </div>
      </ScreenShell>
    );
  }

  if (phase === "shuffle") {
    return (
      <div>
        <StepBadge step={6} label="Shuffling Cards" />
        <ScreenShell>
          <div className="flex flex-1 flex-col items-center justify-center gap-6 py-2">
            <p className="font-display text-[15px] font-bold tracking-[2px] text-gold-gradient">
              DEALING ROLES…
            </p>

            <div className="relative h-[300px] w-[220px]">
              {SHUFFLE_ROLES.map((role, i) => {
                const offset = (i - shuffleFace + SHUFFLE_ROLES.length) % SHUFFLE_ROLES.length;
                const active = offset === 0;
                return (
                  <div
                    key={role}
                    className="absolute inset-0 overflow-hidden rounded-3xl border-2 transition-all duration-150"
                    style={{
                      borderColor: ROLE_ACCENT[role],
                      boxShadow: active
                        ? `0 18px 40px ${ROLE_ACCENT[role]}55`
                        : "0 8px 20px rgba(0,0,0,0.35)",
                      transform: active
                        ? "scale(1) rotate(0deg)"
                        : `scale(${0.92 - offset * 0.02}) rotate(${(i - 1.5) * 4}deg) translateY(${offset * 6}px)`,
                      opacity: active ? 1 : 0.35,
                      zIndex: active ? 10 : 4 - offset,
                    }}
                  >
                    <img
                      src={ROLE_PORTRAIT[role]}
                      alt={ROLE_LABEL[role]}
                      className="h-full w-full object-cover object-top"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-3 pb-3.5 pt-10">
                      <span className="block text-center font-display text-[20px] font-black tracking-wide text-white">
                        {ROLE_LABEL[role]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="animate-pulse text-[13px] font-semibold text-white/55">
              Cards are being shuffled…
            </p>
          </div>
        </ScreenShell>
      </div>
    );
  }

  const role = player.role;
  const accent = role ? ROLE_ACCENT[role] : "var(--gold-2)";

  return (
    <div>
      <StepBadge step={7} label="Role Revealed" />
      <ScreenShell>
        <div className="flex flex-1 flex-col items-center gap-5 py-1">
          <div className="relative flex w-full items-center justify-center">
            <button
              onClick={() => setPhase("pass")}
              className="absolute left-0 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-white/5 text-white/80 transition hover:bg-white/10"
              aria-label="Back"
            >
              <ChevronLeft size={18} />
            </button>
            <h1 className="font-display text-[16px] font-black tracking-[2px] text-gold-gradient">
              YOU ARE
            </h1>
            <Sparkles size={16} className="absolute right-0 text-[var(--gold-2)]" />
          </div>

          <div
            className="role-card-enter relative w-full max-w-[240px] overflow-hidden rounded-3xl border-2 bg-gradient-to-b from-[var(--bg-panel-3)] to-[var(--bg-deep)]"
            style={{
              borderColor: accent,
              boxShadow: `0 20px 45px ${accent}40`,
            }}
          >
            <CornerFlourish className="left-2.5 top-2.5" />
            <CornerFlourish className="right-2.5 top-2.5 rotate-90" />
            <CornerFlourish className="bottom-2.5 right-2.5 rotate-180" />
            <CornerFlourish className="bottom-2.5 left-2.5 -rotate-90" />

            {role && (
              <img
                src={ROLE_PORTRAIT[role]}
                alt={ROLE_LABEL[role]}
                className="h-[260px] w-full object-cover object-top"
              />
            )}

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#12081f] via-[#12081f]/95 to-transparent px-3 pb-4 pt-14">
              <span
                className="block text-center font-display text-[26px] font-black tracking-[3px]"
                style={{ color: accent }}
              >
                {role ? ROLE_LABEL[role] : ""}
              </span>
              <p className="mt-2 text-center text-[12.5px] leading-snug text-white/80">
                {role ? ROLE_REVEAL_TEXT[role] : ""}
              </p>
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-black/30 px-4 py-2 text-[11px] font-semibold text-white/60">
            <Lock size={13} /> Keep it secret from other players!
          </div>
        </div>
      </ScreenShell>
    </div>
  );
};

export default RoleRevealScreen;
