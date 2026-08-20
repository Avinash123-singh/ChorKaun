import { Trophy, User, ShoppingCart, Settings } from "lucide-react";
import type { Screen } from "../../types/game";

const actions: { label: string; icon: typeof Trophy; screen: Screen }[] = [
  { label: "LEADERBOARD", icon: Trophy, screen: "leaderboard" },
  { label: "PROFILE", icon: User, screen: "profile" },
  { label: "STORE", icon: ShoppingCart, screen: "store" },
  { label: "SETTINGS", icon: Settings, screen: "settings" },
];

interface QuickActionsProps {
  onNavigate: (screen: Screen) => void;
}

const QuickActions = ({ onNavigate }: QuickActionsProps) => {
  return (
    <div className="grid w-full grid-cols-4 gap-2">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            type="button"
            onClick={() => onNavigate(action.screen)}
            className="
              flex min-w-0 flex-col items-center justify-center gap-2 rounded-xl
              border border-[var(--border-soft)] bg-[var(--bg-panel-2)] px-1 py-3
              transition hover:border-[#5D3E94] hover:bg-[#171432] active:scale-[0.97]
            "
          >
            <Icon size={25} strokeWidth={2.5} className="text-[var(--gold-2)]" />
            <span className="truncate text-[9px] font-semibold tracking-tight text-white/80">
              {action.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default QuickActions;
