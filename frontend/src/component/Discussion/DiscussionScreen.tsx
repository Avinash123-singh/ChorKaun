import { useEffect, useState } from "react";
import ScreenShell from "../shared/ScreenShell";
import PlayerAvatar from "../shared/PlayerAvatar";
import { useGame } from "../../state/gameStore";

const Waveform = () => {
  const [bars, setBars] = useState<number[]>([6, 12, 18, 10, 14]);

  useEffect(() => {
    const t = setInterval(() => {
      setBars(bars.map(() => 4 + Math.random() * 18));
    }, 250);
    return () => clearInterval(t);
  }, [bars]);

  return (
    <div className="flex h-5 items-end gap-[3px]">
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-[var(--success)] transition-all duration-200"
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
};

const DiscussionScreen = () => {
  const { state, tickDiscussion, skipDiscussion } = useGame();
  const { players, discussionSecondsLeft, discussionDuration } = state;

  useEffect(() => {
    const t = setInterval(() => tickDiscussion(), 1000);
    return () => clearInterval(t);
  }, [tickDiscussion]);

  const mm = String(Math.floor(discussionSecondsLeft / 60)).padStart(2, "0");
  const ss = String(discussionSecondsLeft % 60).padStart(2, "0");
  const progress = (discussionSecondsLeft / discussionDuration) * 100;

  return (
    <ScreenShell>
      <div className="flex flex-1 flex-col items-center gap-6 pt-[2vh]">
        <h1 className="text-[14px] font-black tracking-[3px] text-[var(--gold-2)]">
          DISCUSSION TIME
        </h1>

        <div className="relative flex h-[130px] w-[130px] items-center justify-center">
          <svg className="absolute h-full w-full -rotate-90">
            <circle cx="65" cy="65" r="58" stroke="var(--border-subtle)" strokeWidth="8" fill="none" />
            <circle
              cx="65"
              cy="65"
              r="58"
              stroke="var(--gold-2)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 58}
              strokeDashoffset={2 * Math.PI * 58 * (1 - progress / 100)}
              className="transition-all duration-1000"
            />
          </svg>
          <span className="text-[28px] font-black text-white">
            {mm}:{ss}
          </span>
        </div>

        <p className="text-[12px] font-medium text-white/55">Discuss and find clues</p>

        <div className="mt-2 flex w-full flex-col gap-2.5">
          {players.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-2)] px-3 py-2.5"
            >
              <div className="flex items-center gap-3">
                <PlayerAvatar src={p.avatar} name={p.name} size={36} />
                <span className="text-[13px] font-bold text-white">{p.name}</span>
              </div>
              <Waveform />
            </div>
          ))}
        </div>

        <div className="flex-1" />

        <p className="text-center text-[11px] text-white/40">
          You can talk to other players
          <br />
          Use audio to discuss!
        </p>

        <button
          onClick={skipDiscussion}
          className="text-[11px] font-semibold text-white/40 underline underline-offset-2"
        >
          Skip discussion
        </button>
      </div>
    </ScreenShell>
  );
};

export default DiscussionScreen;
