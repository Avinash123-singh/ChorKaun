import { useEffect, useState } from "react";
import PageBackdrop from "../shared/PageBackdrop";
import type { Role } from "../../types/game";

interface SplashScreenProps {
  onComplete?: () => void;
}

/** Lightweight JPEGs (~15–40 KB each) so splash loads fast on mobile/tunnel. */
const SPLASH_IMAGES: Record<Role | "crown", string> = {
  crown: "/assets/splash/crown.jpg",
  raja: "/assets/splash/raja-portrait.jpg",
  sipahi: "/assets/splash/sipahi.jpg",
  mantri: "/assets/splash/mantri.jpg",
  chor: "/assets/splash/chor.jpg",
};

const SPLASH_ROLES: { role: Role; label: string }[] = [
  { role: "raja", label: "RAJA" },
  { role: "sipahi", label: "SIPAHI" },
  { role: "mantri", label: "MANTRI" },
  { role: "chor", label: "CHOR" },
];

/** Always show splash at least this long so users can see the branding. */
const MIN_SPLASH_MS = 4200;
const READY_PAUSE_MS = 600;

function preloadImages(urls: string[]): Promise<void> {
  let loaded = 0;
  const total = urls.length;
  return new Promise((resolve) => {
    if (total === 0) {
      resolve();
      return;
    }
    const done = () => {
      loaded += 1;
      if (loaded >= total) resolve();
    };
    for (const url of urls) {
      const img = new Image();
      img.onload = done;
      img.onerror = done;
      img.src = url;
    }
  });
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Loading the royal court…");

  useEffect(() => {
    let cancelled = false;
    const urls = [
      SPLASH_IMAGES.crown,
      ...SPLASH_ROLES.map((r) => SPLASH_IMAGES[r.role]),
    ];
    const started = Date.now();

    const tick = setInterval(() => {
      const elapsed = Date.now() - started;
      const pct = Math.min(95, Math.round((elapsed / MIN_SPLASH_MS) * 95));
      setProgress(pct);
    }, 50);

    void Promise.all([preloadImages(urls), wait(MIN_SPLASH_MS)]).then(() => {
      if (cancelled) return;
      clearInterval(tick);
      setProgress(100);
      setStatus("Ready!");
      setTimeout(() => {
        if (!cancelled) onComplete?.();
      }, READY_PAUSE_MS);
    });

    return () => {
      cancelled = true;
      clearInterval(tick);
    };
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
            src={SPLASH_IMAGES.crown}
            alt=""
            fetchPriority="high"
            className="mb-3 h-14 w-14 object-contain drop-shadow-[0_0_20px_rgba(255,200,46,0.5)]"
          />

          <h1 className="font-display text-[42px] font-black tracking-wide text-gold-gradient sm:text-[52px]">
            CHORKAUN
          </h1>
          <p className="mt-1 rounded-full border border-[var(--gold-2)]/40 bg-black/30 px-4 py-1 text-[12px] font-semibold tracking-wide text-white/80">
            Find the Hidden Chor
          </p>

          <div className="mt-8 grid w-full max-w-[420px] grid-cols-4 gap-3">
            {SPLASH_ROLES.map(({ role, label }) => (
              <div
                key={role}
                className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-black/30 shadow-lg"
              >
                <img
                  src={SPLASH_IMAGES[role]}
                  alt={label}
                  fetchPriority="high"
                  decoding="sync"
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
                className="h-full rounded-full bg-gradient-to-r from-[var(--gold-1)] via-[var(--gold-2)] to-[var(--purple-2)] transition-all duration-150 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-3 text-center text-[13px] font-semibold text-white/60">{status}</p>
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
