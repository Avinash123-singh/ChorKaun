import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

interface ScreenShellProps {
  title?: string;
  onBack?: () => void;
  rightSlot?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  noPad?: boolean;
}

/**
 * The card "stage panel" every screen renders inside. PageBackdrop supplies
 * the full-viewport atmosphere; this supplies the glassy royal panel with a
 * gold-tinted border, soft glow and consistent header treatment.
 */
const ScreenShell = ({ title, onBack, rightSlot, children, footer, noPad }: ScreenShellProps) => {
  return (
    <div
      className="
        relative flex min-h-[560px] w-full flex-col overflow-hidden rounded-[28px]
        border border-[rgba(255,200,60,0.28)] bg-[var(--bg-panel)]/92 backdrop-blur-xl
        shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,200,60,0.1),inset_0_1px_0_rgba(255,255,255,0.06)]
      "
    >
      {/* faint top sheen */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.04] to-transparent" />

      {(title || onBack || rightSlot) && (
        <header className="relative flex items-center justify-between px-6 pt-6 sm:px-8">
          <button
            onClick={onBack}
            className={`flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-white/5 text-white/80 transition hover:bg-white/10 ${
              onBack ? "" : "invisible"
            }`}
          >
            <ChevronLeft size={20} />
          </button>

          {title && (
            <h1 className="font-display text-[17px] font-bold tracking-wide text-gold-gradient sm:text-[19px]">
              {title}
            </h1>
          )}

          <div className="flex h-10 w-10 items-center justify-center">{rightSlot}</div>
        </header>
      )}

      <main className={`relative flex flex-1 flex-col ${noPad ? "" : "px-6 py-6 sm:px-8"}`}>{children}</main>

      {footer && <div className="relative px-6 pb-6 sm:px-8">{footer}</div>}
    </div>
  );
};

export default ScreenShell;
