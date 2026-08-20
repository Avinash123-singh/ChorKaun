import { useMemo, type ReactNode } from "react";

interface PageBackdropProps {
  children: ReactNode;
  wide?: boolean;
}

/**
 * Full-viewport atmospheric background shared by every screen: deep royal
 * gradient, soft glows, a twinkling starfield and a faint palace skyline
 * silhouette pinned to the bottom — then a centered "stage" panel that holds
 * the actual screen content. This is what makes the game read as a real
 * desktop web app rather than a stretched mobile column.
 */
const PageBackdrop = ({ children, wide }: PageBackdropProps) => {
  const stars = useMemo(
    () =>
      Array.from({ length: 44 }, (_, i) => ({
        left: Math.round((((i * 53) % 100) + (i % 7)) % 100),
        top: Math.round((((i * 31) % 100) + (i % 5)) % 100),
        size: 1 + (i % 3),
        delay: (i % 10) * 0.35,
      })),
    [],
  );

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[var(--bg-void)]">
      {/* Base gradient wash */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, #2a1560 0%, #0a0620 55%), radial-gradient(ellipse 60% 50% at 85% 90%, #3a1230 0%, transparent 60%), #060412",
        }}
      />

      {/* Soft glow blobs */}
      <div className="pointer-events-none absolute left-[10%] top-[8%] h-[38vh] w-[38vh] rounded-full bg-[#7424D3]/25 blur-[110px]" />
      <div className="pointer-events-none absolute right-[8%] top-[18%] h-[30vh] w-[30vh] rounded-full bg-[#FFC82E]/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[6%] left-[35%] h-[34vh] w-[34vh] rounded-full bg-[#9B4AE8]/20 blur-[130px]" />

      {/* Starfield */}
      <div className="pointer-events-none absolute inset-0">
        {stars.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              animation: `twinkle ${2.4 + s.delay}s ease-in-out infinite`,
              animationDelay: `${s.delay}s`,
              boxShadow: "0 0 6px 1px rgba(255,255,255,0.6)",
            }}
          />
        ))}
      </div>

      {/* Skyline silhouette footer */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[16vh] min-h-[90px] opacity-70"
        style={{
          backgroundImage: "url(/assets/skyline.png)",
          backgroundRepeat: "repeat-x",
          backgroundSize: "auto 100%",
          backgroundPosition: "bottom",
          maskImage: "linear-gradient(to top, black 40%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to top, black 40%, transparent 100%)",
        }}
      />

      {/* Decorative side glows for large desktop viewports */}
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[18vw] xl:block">
        <div className="absolute left-[-6vw] top-1/3 h-[50vh] w-[50vh] rounded-full bg-[#5A1A8A]/25 blur-[140px]" />
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[18vw] xl:block">
        <div className="absolute right-[-6vw] top-1/2 h-[45vh] w-[45vh] rounded-full bg-[#B8860B]/15 blur-[140px]" />
      </div>

      {/* Stage */}
      <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-4 py-8 sm:px-6 lg:py-10">
        <div className={`w-full ${wide ? "max-w-[720px]" : "max-w-[480px]"}`}>{children}</div>
      </div>
    </div>
  );
};

export default PageBackdrop;
