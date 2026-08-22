import { useEffect, useState } from "react";
import PageBackdrop from "../shared/PageBackdrop";
import { ROLE_PORTRAIT } from "../../types/game";
import { preloadAssets } from "../../lib/api";

interface SplashScreenProps {
  onComplete?: () => void;
}

const PRELOAD_URLS = [
  "/assets/crown.png",
  "/assets/skyline.png",
  ...Object.values(ROLE_PORTRAIT),
  "/assets/rahul-avatar.png",
  "/assets/aman-avatar.png",
  "/assets/priya-avatar.png",
  "/assets/neha-avatar.png",
  "/assets/vikram-avatar.png",
  "/assets/isha-avatar.png",
];

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    preloadAssets(PRELOAD_URLS);
  }, []);

  useEffect(() => {
    const duration = 2800;
    const interval = 30;
    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 100 / (duration / interval);
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => onComplete?.(), 250);
          return 100;
        }
        return next;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <PageBackdrop wide>
      <div
        className="
          relative flex min-h-[620px] w-full flex-col overflow-hidden rounded-[28px]
          border border-[rgba(255,200,60,0.28)] bg-[var(--bg-panel)]/92 backdrop-blur-xl
          shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]
        "
      >
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-[var(--purple-3)]/50 blur-[80px]" />
          <div className="absolute bottom-10 left-10 h-40 w-40 rounded-full bg-[var(--gold-2)]/20 blur-[60px]" />
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center px-6 pb-8 pt-10 sm:px-10">
          <img
            src="/assets/crown.png"
            alt=""
            className="mb-3 h-14 w-14 object-contain drop-shadow-[0_0_20px_rgba(255,200,46,0.5)]"
          />

          <h1 className="font-display text-[42px] font-black tracking-wide text-gold-gradient sm:text-[52px]">
            CHORKAUN
          </h1>
          <p className="mt-1 rounded-full border border-[var(--gold-2)]/40 bg-black/30 px-4 py-1 text-[12px] font-semibold tracking-wide text-white/80">
            Find the Hidden Chor
          </p>

          <div className="mt-8 grid w-full max-w-[420px] grid-cols-4 gap-3">
            {(
              [
                ["raja", "RAJA"],
                ["sipahi", "SIPAHI"],
                ["mantri", "MANTRI"],
                ["chor", "CHOR"],
              ] as const
            ).map(([role, label]) => (
              <div
                key={role}
                className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-black/30 shadow-lg"
              >
                <img
                  src={ROLE_PORTRAIT[role]}
                  alt={label}
                  loading="eager"
                  decoding="async"
                  className="aspect-[3/4] w-full object-cover object-top"
                />
                <p className="bg-black/50 py-1 text-center text-[10px] font-bold tracking-wide text-[var(--gold-2)]">
                  {label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-auto w-full max-w-[360px] pt-10">
            <div className="h-3 w-full overflow-hidden rounded-full border border-[var(--gold-2)]/70 bg-black/40 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--gold-1)] via-[var(--gold-2)] to-[var(--purple-2)] transition-all duration-75"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-3 text-center text-[13px] font-semibold text-white/60">
              Loading the royal court…
            </p>
          </div>
        </div>

        <div
          className="pointer-events-none h-16 bg-cover bg-bottom opacity-50"
          style={{
            backgroundImage: "url(/assets/skyline.png)",
            maskImage: "linear-gradient(to top, black 40%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to top, black 40%, transparent 100%)",
          }}
        />
      </div>
    </PageBackdrop>
  );
};

export default SplashScreen;
