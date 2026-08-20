import { CircleHelp, Info } from "lucide-react";

interface BottomLinksProps {
  onHowToPlay?: () => void;
  onAbout?: () => void;
}

const BottomLinks = ({ onHowToPlay, onAbout }: BottomLinksProps) => {
  return (
    <div className="flex w-full items-center justify-center overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-panel-2)]">
      <button
        type="button"
        onClick={onHowToPlay}
        className="flex flex-1 items-center justify-center gap-2 px-3 py-3 text-xs font-medium text-white/80 transition hover:text-white"
      >
        <CircleHelp size={18} className="text-white/70" />
        <span>How to Play</span>
      </button>

      <div className="h-6 w-px bg-[var(--border-soft)]" />

      <button
        type="button"
        onClick={onAbout}
        className="flex flex-1 items-center justify-center gap-2 px-3 py-3 text-xs font-medium text-white/80 transition hover:text-white"
      >
        <Info size={18} className="text-white/70" />
        <span>About Game</span>
      </button>
    </div>
  );
};

export default BottomLinks;
