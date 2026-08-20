import { Bell } from "lucide-react";
import ScreenShell from "../shared/ScreenShell";
import { useGame } from "../../state/gameStore";
import { useEffect } from "react";

interface NotificationsScreenProps {
  onBack: () => void;
}

const NotificationsScreen = ({ onBack }: NotificationsScreenProps) => {
  const { state, markNotificationsRead } = useGame();

  useEffect(() => {
    markNotificationsRead();
  }, [markNotificationsRead]);

  return (
    <ScreenShell title="NOTIFICATIONS" onBack={onBack}>
      <div className="flex flex-1 flex-col gap-3">
        {state.notifications.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-white/50">
            <Bell size={36} />
            <p className="text-[13px]">No notifications yet</p>
          </div>
        ) : (
          state.notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl border px-4 py-3 ${
                n.read
                  ? "border-[var(--border-subtle)] bg-[var(--bg-panel-2)]/60"
                  : "border-[var(--gold-2)]/40 bg-[var(--bg-panel-2)]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-bold text-white">{n.title}</p>
                <span className="shrink-0 text-[10px] text-white/40">{n.time}</span>
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-white/65">{n.body}</p>
            </div>
          ))
        )}
      </div>
    </ScreenShell>
  );
};

export default NotificationsScreen;
