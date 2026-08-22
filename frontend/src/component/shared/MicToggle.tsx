import { Mic, MicOff } from "lucide-react";
import { useEffect, useState } from "react";
import { disableVoice, enableVoice, subscribeVoiceLevel } from "../../lib/voiceChat";
import { useGame } from "../../state/gameStore";

interface MicToggleProps {
  compact?: boolean;
  className?: string;
}

/** Visible mic control — turns on real microphone for voice talk with friends. */
const MicToggle = ({ compact, className = "" }: MicToggleProps) => {
  const { state, setMicEnabled } = useGame();
  const [level, setLevel] = useState(0);
  const [error, setError] = useState("");
  const on = state.micEnabled;

  useEffect(() => {
    if (!on) return;
    return subscribeVoiceLevel(setLevel);
  }, [on]);

  const toggle = async () => {
    setError("");
    if (on) {
      disableVoice();
      setMicEnabled(false);
      return;
    }
    const peers = state.players.filter((p) => p.id !== state.myPlayerId && p.micOn).map((p) => p.id);
    const ok = await enableVoice(state.myPlayerId, peers);
    if (!ok) {
      setError("Allow microphone access in your browser to talk.");
      setMicEnabled(false);
      return;
    }
    setMicEnabled(true);
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        className={`relative flex h-11 w-11 items-center justify-center rounded-full border transition ${
          on
            ? "border-[var(--success)] bg-[var(--success)]/20 text-[var(--success)]"
            : "border-[var(--border-soft)] bg-[var(--bg-panel-2)] text-white/60"
        } ${className}`}
        aria-label={on ? "Mute microphone" : "Enable microphone"}
      >
        {on ? <Mic size={18} /> : <MicOff size={18} />}
        {on && (
          <span
            className="absolute inset-0 rounded-full border-2 border-[var(--success)]/50"
            style={{ transform: `scale(${1 + level * 0.45})`, opacity: 0.35 + level }}
          />
        )}
      </button>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={toggle}
        className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition ${
          on
            ? "border-[var(--success)]/50 bg-[var(--success)]/10 shadow-[0_0_24px_rgba(46,204,113,0.15)]"
            : "border-[var(--border-soft)] bg-[var(--bg-panel-2)] hover:border-[var(--gold-2)]/40"
        }`}
      >
        <div
          className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
            on ? "bg-[var(--success)] text-[#04120a]" : "bg-white/10 text-white/70"
          }`}
        >
          {on ? <Mic size={22} /> : <MicOff size={22} />}
          {on && (
            <span
              className="pointer-events-none absolute inset-0 rounded-full bg-[var(--success)]/30"
              style={{ transform: `scale(${1 + level * 0.6})`, opacity: 0.4 }}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-black text-white">
            {on ? "Microphone On — you're live" : "Enable Microphone"}
          </p>
          <p className="text-[11px] text-white/55">
            {on
              ? "Talk with all 4 players until the game ends"
              : "Turn on voice chat to discuss with friends"}
          </p>
          {on && (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/40">
              <div
                className="h-full rounded-full bg-[var(--success)] transition-all duration-75"
                style={{ width: `${Math.min(100, 8 + level * 140)}%` }}
              />
            </div>
          )}
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
            on ? "bg-[var(--success)] text-[#04120a]" : "bg-white/10 text-white/50"
          }`}
        >
          {on ? "Live" : "Off"}
        </span>
      </button>
      {error && <p className="mt-1.5 text-center text-[11px] text-[var(--danger)]">{error}</p>}
    </div>
  );
};

export default MicToggle;
