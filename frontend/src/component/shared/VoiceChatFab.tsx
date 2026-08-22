import { Headphones, MessageCircle, Mic, MicOff, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { useGame } from "../../state/gameStore";
import {
  connectToSpeakers,
  setListening,
  setSpeaking,
  subscribeVoiceLevel,
} from "../../lib/voiceChat";

const VOICE_CHAT_SCREENS = new Set([
  "lobby",
  "roleReveal",
  "discussion",
  "sipahiGuess",
  "revealRoles",
  "roundResult",
  "scoreboard",
]);

/** One button → Speak + Listen toggles (play quietly or talk when you want). */
const VoiceChatFab = () => {
  const { state, toggleChat, setMicEnabled, setVoiceListen } = useGame();
  const [level, setLevel] = useState(0);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!state.micEnabled) return;
    return subscribeVoiceLevel(setLevel);
  }, [state.micEnabled]);

  useEffect(() => {
    setListening(state.voiceListen);
  }, [state.voiceListen]);

  if (!VOICE_CHAT_SCREENS.has(state.screen)) return null;

  const speakerIds = state.players.filter((p) => p.micOn && p.id !== state.myPlayerId).map((p) => p.id);
  const roomPeerIds = state.players.filter((p) => p.id !== state.myPlayerId).map((p) => p.id);

  const toggleSpeak = async () => {
    setErr("");
    const pid = state.myPlayerId || state.userProfile.id;
    if (state.micEnabled) {
      await setSpeaking(false, pid);
      setMicEnabled(false);
      return;
    }
    const ok = await setSpeaking(true, pid, roomPeerIds);
    if (!ok) {
      setErr("Allow mic");
      setMicEnabled(false);
      return;
    }
    setMicEnabled(true);
    if (state.voiceListen) await connectToSpeakers(pid, speakerIds);
  };

  const toggleListen = async () => {
    const next = !state.voiceListen;
    setVoiceListen(next);
    if (next) {
      const pid = state.myPlayerId || state.userProfile.id;
      await connectToSpeakers(pid, speakerIds);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[55] flex flex-col items-end gap-2">
      {err && (
        <span className="rounded bg-black/70 px-2 py-1 text-[10px] text-[var(--danger)]">{err}</span>
      )}

      {open && (
        <div className="mb-1 w-[200px] rounded-2xl border border-[var(--border-soft)] bg-[#120a1f]/98 p-3 shadow-2xl backdrop-blur">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/45">Voice</p>
          <button
            type="button"
            onClick={() => void toggleSpeak()}
            className={`mb-2 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold ${
              state.micEnabled
                ? "bg-[var(--success)]/20 text-[var(--success)]"
                : "bg-[var(--bg-panel-2)] text-white/70"
            }`}
          >
            {state.micEnabled ? <Mic size={16} /> : <MicOff size={16} />}
            {state.micEnabled ? "Speaking ON" : "Speak (mic off)"}
          </button>
          <button
            type="button"
            onClick={() => void toggleListen()}
            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold ${
              state.voiceListen
                ? "bg-[var(--purple-3)]/30 text-[var(--gold-2)]"
                : "bg-[var(--bg-panel-2)] text-white/50"
            }`}
          >
            {state.voiceListen ? <Headphones size={16} /> : <VolumeX size={16} />}
            {state.voiceListen ? "Listening ON" : "Listen off (quiet)"}
          </button>
          <p className="mt-2 text-[9px] leading-snug text-white/35">
            Turn speak on only when talking. Turn listen off to play silently.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`relative flex h-14 w-14 items-center justify-center rounded-full border shadow-[0_10px_25px_rgba(0,0,0,0.5)] backdrop-blur transition hover:scale-105 ${
          state.micEnabled
            ? "border-[var(--success)] bg-[var(--success)]/20 text-[var(--success)]"
            : state.voiceListen
              ? "border-[var(--purple-3)] bg-[var(--purple-3)]/20 text-[var(--gold-2)]"
              : "border-[var(--border-soft)] bg-[var(--bg-panel)]/95 text-white/50"
        }`}
        aria-label="Voice options"
        title="Voice: speak & listen"
      >
        {state.micEnabled ? <Mic size={20} /> : state.voiceListen ? <Headphones size={20} /> : <VolumeX size={20} />}
        {state.micEnabled && (
          <span
            className="pointer-events-none absolute inset-0 rounded-full border-2 border-[var(--success)]/40"
            style={{ transform: `scale(${1 + level * 0.5})`, opacity: 0.4 + level }}
          />
        )}
      </button>

      <button
        type="button"
        onClick={toggleChat}
        className={`flex h-14 w-14 items-center justify-center rounded-full border shadow-[0_10px_25px_rgba(0,0,0,0.5)] backdrop-blur transition hover:scale-105 ${
          state.chatOpen
            ? "border-[var(--gold-2)] bg-[var(--gold-2)]/20 text-[var(--gold-2)]"
            : "border-[var(--border-soft)] bg-[var(--bg-panel)]/95 text-[var(--gold-2)]"
        }`}
        aria-label="Toggle chat"
      >
        <MessageCircle size={20} />
      </button>
    </div>
  );
};

export default VoiceChatFab;
