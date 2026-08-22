import { useEffect, useState } from "react";
import ScreenShell from "../shared/ScreenShell";
import PlayerAvatar from "../shared/PlayerAvatar";
import { useGame } from "../../state/gameStore";
import { subscribeVoiceLevel } from "../../lib/voiceChat";

const Waveform = ({ active, level = 0.3 }: { active: boolean; level?: number }) => {
  const [bars, setBars] = useState<number[]>([6, 12, 18, 10, 14, 9]);

  useEffect(() => {
    if (!active) {
      setBars([4, 4, 4, 4, 4, 4]);
      return;
    }
    const t = setInterval(() => {
      setBars((prev) =>
        prev.map((_, i) => {
          const pulse = level > 0.05 ? level : 0.15 + Math.random() * 0.35;
          return 4 + Math.sin(Date.now() / 120 + i) * 6 * pulse + Math.random() * 10 * pulse;
        }),
      );
    }, 120);
    return () => clearInterval(t);
  }, [active, level]);

  return (
    <div className="flex h-6 items-end gap-[3px]">
      {bars.map((h, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full transition-all duration-100 ${
            active ? "bg-[var(--success)]" : "bg-white/20"
          }`}
          style={{ height: `${Math.max(3, h)}px` }}
        />
      ))}
    </div>
  );
};

const DiscussionScreen = () => {
  const { state, tickDiscussion, skipDiscussion } = useGame();
  const { players, discussionSecondsLeft, discussionDuration, micEnabled, myPlayerId } = state;
  const [myLevel, setMyLevel] = useState(0);
  const me = players.find((p) => p.id === myPlayerId);
  const isHost = !!me?.isHost;

  useEffect(() => {
    const t = setInterval(() => tickDiscussion(), 1000);
    return () => clearInterval(t);
  }, [tickDiscussion]);

  useEffect(() => {
    if (!micEnabled) return;
    return subscribeVoiceLevel(setMyLevel);
  }, [micEnabled]);

  const mm = String(Math.floor(discussionSecondsLeft / 60)).padStart(2, "0");
  const ss = String(discussionSecondsLeft % 60).padStart(2, "0");
  const progress = discussionDuration > 0 ? (discussionSecondsLeft / discussionDuration) * 100 : 0;
  const urgent = discussionSecondsLeft <= 10;

  return (
    <ScreenShell>
      <div className="relative flex flex-1 flex-col gap-4 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-0">
          <div className="absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-[var(--purple-3)]/30 blur-3xl" />
        </div>

        <div className="relative z-10 text-center">
          <p className="text-[12px] font-black tracking-[3px] text-[var(--gold-2)]">
            DISCUSSION · 1 MIN
          </p>
          <h1 className="mt-1 font-display text-[22px] font-black text-white">Find the Chor</h1>
          <p className="mt-1 text-[12px] text-white/55">
            Voice button → speak when you want, listen off to play quietly
          </p>
        </div>

        <div className="relative z-10 mx-auto flex h-[120px] w-[120px] items-center justify-center">
          <svg className="absolute h-full w-full -rotate-90">
            <circle cx="60" cy="60" r="52" stroke="var(--border-subtle)" strokeWidth="8" fill="none" />
            <circle
              cx="60"
              cy="60"
              r="52"
              stroke={urgent ? "var(--danger)" : "var(--gold-2)"}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 52}
              strokeDashoffset={2 * Math.PI * 52 * (1 - progress / 100)}
              className="transition-all duration-1000"
            />
          </svg>
          <span
            className={`font-display text-[28px] font-black ${urgent ? "text-[var(--danger)]" : "text-white"}`}
          >
            {mm}:{ss}
          </span>
        </div>

        <div className="relative z-10 flex flex-col gap-2">
          {players.map((p) => {
            const isYou = p.id === myPlayerId;
            const talking = isYou ? micEnabled && myLevel > 0.06 : !!p.micOn;
            return (
              <div
                key={p.id}
                className={`flex items-center justify-between rounded-2xl border px-3 py-2.5 backdrop-blur-sm ${
                  talking
                    ? "border-[var(--success)]/40 bg-[var(--success)]/10"
                    : "border-[var(--border-subtle)] bg-[var(--bg-panel-2)]/90"
                }`}
              >
                <div className="flex items-center gap-3">
                  <PlayerAvatar src={p.avatar} name={p.name} size={40} />
                  <div>
                    <p className="text-[13px] font-bold text-white">
                      {p.name}
                      {isYou ? " (You)" : ""}
                      {p.isHost ? " · Host" : ""}
                    </p>
                    <p className="text-[10px] text-white/45">
                      {p.micOn || (isYou && micEnabled) ? (talking ? "Speaking…" : "Mic on") : "Quiet"}
                    </p>
                  </div>
                </div>
                <Waveform active={talking} level={isYou ? myLevel : 0.35} />
              </div>
            );
          })}
        </div>

        <div className="relative z-10 flex-1" />

        {isHost ? (
          <button
            type="button"
            onClick={skipDiscussion}
            className="relative z-10 text-center text-[11px] font-semibold text-white/40 underline underline-offset-2"
          >
            Skip discussion (host)
          </button>
        ) : (
          <p className="relative z-10 text-center text-[11px] text-white/35">
            Timer synced — waiting for discussion to end…
          </p>
        )}
      </div>
    </ScreenShell>
  );
};

export default DiscussionScreen;
