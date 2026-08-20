import { useState } from "react";
import {
  Copy,
  Mic,
  MicOff,
  Music2,
  Send,
  Settings,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import PlayerAvatar from "../shared/PlayerAvatar";
import ScreenShell from "../shared/ScreenShell";
import { useGame } from "../../state/gameStore";

const LobbyScreen = () => {
  const {
    state,
    toggleReady,
    startGame,
    sendChat,
    exitRoom,
    toggleLobbySettings,
    setSoundEnabled,
    setSuspenseMusic,
    setMicEnabled,
  } = useGame();
  const { players, roomId, inviteLink, chatMessages, lobbySettingsOpen } = state;
  const host = players.find((p) => p.isHost);
  const allReady = players.every((p) => p.isReady);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const submitMessage = () => {
    if (!message.trim()) return;
    sendChat(message.trim());
    setMessage("");
  };

  const copyRoom = async () => {
    const text = `ChorKaun Room ${roomId}\n${inviteLink}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const enableMic = async (enabled: boolean) => {
    if (enabled && typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        /* permission denied — still toggle UI state */
      }
    }
    setMicEnabled(enabled);
  };

  return (
    <ScreenShell
      title="LOBBY"
      onBack={exitRoom}
      rightSlot={
        <button
          type="button"
          onClick={toggleLobbySettings}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-white/5 text-white/70 transition hover:bg-white/10"
        >
          <Settings size={18} />
        </button>
      }
    >
      <div className="relative flex flex-1 flex-col gap-4">
        {lobbySettingsOpen && (
          <div className="absolute inset-0 z-20 flex items-start justify-center bg-black/60 p-2 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-[var(--gold-2)]/35 bg-[var(--bg-panel)] p-4 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-[16px] font-black text-gold-gradient">
                  LOBBY SETTINGS
                </h3>
                <button
                  type="button"
                  onClick={toggleLobbySettings}
                  className="rounded-full border border-[var(--border-soft)] p-1.5 text-white/70"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3">
                <SettingRow
                  icon={state.soundEnabled ? Volume2 : VolumeX}
                  label="Game Sound"
                  hint="UI & reveal sound effects"
                  on={state.soundEnabled}
                  onChange={setSoundEnabled}
                />
                <SettingRow
                  icon={Music2}
                  label="Suspense Music"
                  hint="Tension track during talk & guess"
                  on={state.suspenseMusic}
                  onChange={setSuspenseMusic}
                />
                <SettingRow
                  icon={state.micEnabled ? Mic : MicOff}
                  label="Microphone"
                  hint="Voice chat for all friends this game"
                  on={state.micEnabled}
                  onChange={enableMic}
                />
              </div>

              <div className="mt-4 rounded-xl border border-[var(--border-soft)] bg-black/25 p-3 text-[11px] leading-relaxed text-white/55">
                <p>
                  <span className="font-bold text-white/80">Room:</span> {state.roomName}
                </p>
                <p>
                  <span className="font-bold text-white/80">Rounds:</span> {state.totalRounds}
                </p>
                <p>
                  <span className="font-bold text-white/80">Players:</span> 4 (Raja · Mantri · Chor ·
                  Sipahi)
                </p>
                <p>
                  <span className="font-bold text-white/80">Host:</span>{" "}
                  {host?.name ?? state.userProfile.name}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="-mt-1 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-white/60">Room ID</span>
          <div className="flex items-center gap-3">
            <span className="font-display text-[18px] font-bold text-white">{roomId || "------"}</span>
            <button
              type="button"
              onClick={copyRoom}
              className="flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/70 transition hover:bg-white/10"
            >
              <Copy size={12} /> {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="font-display text-[15px] font-bold text-white/90">
            Players {players.length}/{state.maxPlayers}
          </p>
          <div className="flex items-center gap-2">
            {state.micEnabled ? (
              <span className="flex items-center gap-1 rounded-full bg-[var(--success)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--success)]">
                <Mic size={11} /> Voice On
              </span>
            ) : null}
            <p className="text-[12px] font-semibold text-[var(--success)]">
              {allReady ? "Everyone is here!" : "Waiting for players…"}
            </p>
          </div>
        </div>

        <div className="grid auto-rows-min grid-cols-1 gap-2.5 sm:grid-cols-2">
          {players.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-2)] px-3 py-2.5 transition hover:border-[var(--border-soft)]"
            >
              <div className="flex items-center gap-3">
                <PlayerAvatar src={p.avatar} name={p.name} crown={p.isHost} />
                <div className="leading-tight">
                  <p className="text-[13px] font-bold text-white">
                    {p.name} {p.isHost ? "(Host)" : ""}
                    {p.micOn ? " 🎤" : ""}
                  </p>
                  {p.isHost && <p className="text-[10px] text-white/45">Host</p>}
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleReady(p.id)}
                className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${
                  p.isReady
                    ? "bg-[var(--success)]/20 text-[var(--success)]"
                    : "bg-white/10 text-white/50"
                }`}
              >
                {p.isReady ? "Ready" : "Not Ready"}
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto rounded-xl border border-[var(--border-subtle)] bg-black/20 px-3 py-2.5">
          {chatMessages.slice(-5).map((m) => (
            <p key={m.id} className="text-[12.5px] leading-snug">
              <span className="font-bold text-[var(--gold-2)]">{m.playerName}: </span>
              <span className="text-white/85">{m.text}</span>
            </p>
          ))}
        </div>

        <div className="relative">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitMessage()}
            placeholder="Type a message..."
            className="
              w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-2)]
              px-4 py-3 pr-11 text-[13px] text-white placeholder:text-white/40
              outline-none transition focus:border-[var(--purple-3)]
            "
          />
          <button
            type="button"
            onClick={submitMessage}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gold-2)] transition hover:scale-110"
          >
            <Send size={16} />
          </button>
        </div>

        <div>
          <button
            type="button"
            onClick={startGame}
            disabled={!host}
            className="
              w-full rounded-2xl bg-gradient-to-b from-[var(--gold-1)] via-[var(--gold-2)] to-[var(--gold-3)]
              py-3.5 font-display text-[15px] font-bold tracking-wide text-[#241600]
              shadow-[0_10px_25px_rgba(255,180,20,0.25),inset_0_1px_0_rgba(255,255,255,0.6)]
              transition hover:scale-[1.01] active:scale-[0.98]
            "
          >
            START GAME
          </button>
          <p className="mt-2 text-center text-[11px] font-semibold text-white/40">
            Host can start · {state.totalRounds} rounds
          </p>
        </div>
      </div>
    </ScreenShell>
  );
};

function SettingRow({
  icon: Icon,
  label,
  hint,
  on,
  onChange,
}: {
  icon: typeof Volume2;
  label: string;
  hint: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-panel-2)] px-3 py-3">
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-[var(--gold-2)]" />
        <div>
          <p className="text-[13px] font-bold text-white">{label}</p>
          <p className="text-[10px] text-white/45">{hint}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!on)}
        className={`flex h-7 w-12 items-center rounded-full px-0.5 transition ${
          on ? "justify-end bg-[var(--gold-2)]" : "justify-start bg-[var(--border-soft)]"
        }`}
      >
        <span className="h-6 w-6 rounded-full bg-white shadow" />
      </button>
    </div>
  );
}

export default LobbyScreen;
