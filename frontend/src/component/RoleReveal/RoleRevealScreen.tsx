import { useEffect, useState } from "react";
import { Lock, Sparkles } from "lucide-react";
import { useGame } from "../../state/gameStore";
import {
  ROLE_ACCENT,
  ROLE_CARD_BG,
  ROLE_CARD_IMAGE,
  ROLE_EMOJI,
  ROLE_LABEL,
  ROLE_REVEAL_TEXT,
  SHUFFLE_ROLES,
  type Role,
} from "../../types/game";
import ScreenShell from "../shared/ScreenShell";
import StepBadge from "../shared/StepBadge";
import CornerFlourish from "../shared/CornerFlourish";
import { playReveal } from "../../lib/sound";

const RoleCardFace = ({ role, shuffling }: { role: Role; shuffling?: boolean }) => {
  const accent = ROLE_ACCENT[role];
  return (
    <div
      className={`relative h-[280px] w-[200px] overflow-hidden rounded-3xl border-2 bg-gradient-to-b ${ROLE_CARD_BG[role]} shadow-[0_20px_45px_rgba(0,0,0,0.45)] transition-all ${
        shuffling ? "scale-[0.97] opacity-90" : "scale-100"
      }`}
      style={{ borderColor: accent }}
    >
      <CornerFlourish className="left-2.5 top-2.5" />
      <CornerFlourish className="right-2.5 top-2.5 rotate-90" />
      <CornerFlourish className="bottom-2.5 right-2.5 rotate-180" />
      <CornerFlourish className="bottom-2.5 left-2.5 -rotate-90" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.12),transparent_55%)]" />
      <img
        src={ROLE_CARD_IMAGE[role]}
        alt={ROLE_LABEL[role]}
        loading="eager"
        decoding="sync"
        className="h-[180px] w-full object-cover object-top opacity-95"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent px-3 pb-5 pt-10 text-center">
        <span className="text-[28px]">{ROLE_EMOJI[role]}</span>
        <p className="font-display text-[22px] font-black tracking-[3px]" style={{ color: accent }}>
          {ROLE_LABEL[role]}
        </p>
      </div>
    </div>
  );
};

/**
 * Tap → cycle Raja/Mantri/Chor/Sipahi → land on YOUR role → host continues.
 */
const RoleRevealScreen = () => {
  const { state, revealDone } = useGame();
  const role = state.myRole;
  const me = state.players.find((p) => p.id === state.myPlayerId);
  const isHost = !!me?.isHost;
  const [phase, setPhase] = useState<"idle" | "shuffle" | "revealed">("idle");
  const [flashRole, setFlashRole] = useState<Role>("raja");
  const [imagesReady, setImagesReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      SHUFFLE_ROLES.map(
        (r) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = ROLE_CARD_IMAGE[r];
          }),
      ),
    ).then(() => {
      if (!cancelled) setImagesReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (phase !== "shuffle" || !role) return;
    let i = 0;
    const interval = window.setInterval(() => {
      setFlashRole(SHUFFLE_ROLES[i % SHUFFLE_ROLES.length]);
      i += 1;
    }, 380);
    const done = window.setTimeout(() => {
      window.clearInterval(interval);
      setFlashRole(role);
      setPhase("revealed");
      if (state.soundEnabled) playReveal();
    }, 2400);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(done);
    };
  }, [phase, role, state.soundEnabled]);

  const onTapCard = () => {
    if (phase !== "idle" || !imagesReady) return;
    setPhase("shuffle");
  };

  if (phase === "idle") {
    return (
      <div>
        <StepBadge step={6} label="Your Secret Card" />
        <ScreenShell>
          <div className="flex flex-1 flex-col items-center justify-center gap-5">
            <button
              type="button"
              onClick={onTapCard}
              className="relative h-[280px] w-[200px] rounded-3xl border-2 border-[var(--gold-2)] bg-gradient-to-b from-[var(--purple-3)] to-[var(--bg-deep)] shadow-[0_20px_45px_rgba(116,36,211,0.35)] transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <CornerFlourish className="left-2.5 top-2.5" />
              <CornerFlourish className="right-2.5 top-2.5 rotate-90" />
              <CornerFlourish className="bottom-2.5 right-2.5 rotate-180" />
              <CornerFlourish className="bottom-2.5 left-2.5 -rotate-90" />
              <div className="flex h-full flex-col items-center justify-center">
                <span className="font-display text-[72px] font-black text-[var(--gold-2)]">?</span>
                <p className="text-[12px] font-semibold text-white/50">
                  {imagesReady ? "Tap to shuffle" : "Loading cards…"}
                </p>
              </div>
            </button>
            <p className="text-[13px] text-white/55">Cards will shuffle — only you see your role</p>
          </div>
        </ScreenShell>
      </div>
    );
  }

  if (phase === "shuffle") {
    return (
      <div>
        <StepBadge step={6} label="Shuffling…" />
        <ScreenShell>
          <div className="flex flex-1 flex-col items-center justify-center gap-5">
            <RoleCardFace role={flashRole} shuffling />
            <p className="animate-pulse text-[13px] font-semibold text-[var(--gold-2)]">
              Raja · Mantri · Chor · Sipahi…
            </p>
          </div>
        </ScreenShell>
      </div>
    );
  }

  const accent = role ? ROLE_ACCENT[role] : "var(--gold-2)";

  return (
    <div>
      <StepBadge step={7} label="Your Role" />
      <ScreenShell>
        <div className="flex flex-1 flex-col items-center gap-4 py-1">
          <h1 className="font-display text-[16px] font-black tracking-[2px] text-gold-gradient">
            YOU ARE
          </h1>
          <Sparkles size={16} className="text-[var(--gold-2)]" />

          {role && (
            <div
              className="role-card-enter relative w-full max-w-[240px] overflow-hidden rounded-3xl border-2 bg-gradient-to-b shadow-[0_24px_50px_rgba(0,0,0,0.5)]"
              style={{ borderColor: accent, boxShadow: `0 20px 45px ${accent}40` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-b ${ROLE_CARD_BG[role]} opacity-80`} />
              <CornerFlourish className="left-2.5 top-2.5" />
              <CornerFlourish className="right-2.5 top-2.5 rotate-90" />
              <img
                src={ROLE_CARD_IMAGE[role]}
                alt={ROLE_LABEL[role]}
                loading="eager"
                className="relative h-[260px] w-full object-cover object-top"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#12081f] via-[#12081f]/95 to-transparent px-3 pb-4 pt-14">
                <span className="text-[32px]">{ROLE_EMOJI[role]}</span>
                <span
                  className="block text-center font-display text-[26px] font-black tracking-[3px]"
                  style={{ color: accent }}
                >
                  {ROLE_LABEL[role]}
                </span>
                <p className="mt-2 text-center text-[12.5px] leading-snug text-white/80">
                  {ROLE_REVEAL_TEXT[role]}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-black/30 px-4 py-2 text-[11px] font-semibold text-white/60">
            <Lock size={13} /> Keep it secret!
          </div>

          {isHost ? (
            <button
              type="button"
              onClick={revealDone}
              className="mt-2 w-full max-w-[280px] rounded-2xl bg-gradient-to-r from-[var(--gold-2)] to-[var(--gold-3)] py-3.5 text-[15px] font-black text-[#241600] shadow-[0_8px_20px_rgba(255,180,20,0.25)]"
            >
              CONTINUE
            </button>
          ) : (
            <p className="mt-2 w-full max-w-[280px] rounded-2xl border border-[var(--border-soft)] bg-black/30 py-3.5 text-center text-[13px] font-semibold text-white/55">
              Waiting for host to continue…
            </p>
          )}
        </div>
      </ScreenShell>
    </div>
  );
};

export default RoleRevealScreen;
