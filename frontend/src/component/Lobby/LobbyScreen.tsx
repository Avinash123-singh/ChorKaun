import { useState } from "react";
import { Mic, MicOff, Music2, Send, Settings, UserPlus, Volume2, VolumeX, X } from "lucide-react";
import PlayerAvatar from "../shared/PlayerAvatar";
import ScreenShell from "../shared/ScreenShell";
import { useGame } from "../../state/gameStore";
import { disableVoice, enableVoice } from "../../lib/voiceChat";

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
  const { players, roomId, chatMessages, lobbySettingsOpen, myPlayerId, lastError } = state;
  const me = players.find((p) => p.id === myPlayerId);
  const isHost = me?.isHost;
  const allReady =
    players.filter((p) => p.connected !== false).length === 4 &&
    players.every((p) => p.connected === false || p.isReady);
  const [message, setMessage] = useState("");

  const slots = Array.from({ length: 4 }, (_, i) => players[i] || null);

  const submitMessage = () => {
    if (!message.trim()) return;
    sendChat(message.trim());
    setMessage("");
  };

  return (
    <ScreenShell
      title="LOBBY"
      onBack={exitRoom}
      rightSlot={
        <button
          type="button"
          onClick={toggleLobbySettings}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-white/5 text-white/70"
        >
          <Settings size={18} />
        </button>
      }
    >
      <div className="relative flex flex-1 flex-col gap-3">
        {lobbySettingsOpen && (
          <div className="absolute inset-0 z-20 flex items-start justify-center bg-black/60 p-2 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-[var(--gold-2)]/35 bg-[var(--bg-panel)] p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-[16px] font-black text-gold-gradient">SETTINGS</h3>
                <button type="button" onClick={toggleLobbySettings} className="rounded-full border border-[var(--border-soft)] p-1.5">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-3">
                <SettingRow
                  icon={state.soundEnabled ? Volume2 : VolumeX}
                  label="Game Sound"
                  hint="Clicks & role reveal chimes"
                  on={state.soundEnabled}
                  onChange={setSoundEnabled}
                />
                <SettingRow
                  icon={Music2}
                  label="Suspense Music"
                  hint="Plays during discussion & guess"
                  on={state.suspenseMusic}
                  onChange={setSuspenseMusic}
                />
                <SettingRow
                  icon={state.micEnabled ? Mic : MicOff}
                  label="Microphone"
                  hint="Use the mic button next to chat"
                  on={state.micEnabled}
                  onChange={async (v) => {
                    if (!v) {
                      disableVoice();
                      setMicEnabled(false);
                      return;
                    }
                    const peers = state.players
                      .filter((p) => p.id !== state.myPlayerId && p.micOn)
                      .map((p) => p.id);
                    const ok = await enableVoice(state.myPlayerId, peers);
                    setMicEnabled(ok);
                  }}
                />
              </div>
              <p className="mt-3 text-[11px] text-white/50">
                {state.isPrivate ? "Private · invite only" : "Public room"} · {state.totalRounds} rounds
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between rounded-xl border border-[var(--border-soft)] bg-black/25 px-4 py-2.5">
          <span className="text-[12px] font-semibold text-white/55">Room ID</span>
          <span className="font-display text-[20px] font-black tracking-[3px] text-[var(--gold-2)]">
            {roomId || "------"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <p className="font-display text-[15px] font-bold text-white/90">
            Players {players.length}/4
          </p>
          <p className="text-[12px] font-semibold text-white/55">
            {players.length < 4
              ? `Waiting for ${4 - players.length} more…`
              : allReady
                ? "Everyone ready!"
                : "Waiting for ready…"}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {slots.map((p, i) =>
            p ? (
              <div
                key={p.id}
                className={`flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-2)] px-3 py-2.5 ${
                  p.connected === false ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <PlayerAvatar src={p.avatar} name={p.name} crown={p.isHost} />
                  <div className="leading-tight">
                    <p className="text-[13px] font-bold text-white">
                      {p.name}
                      {p.id === myPlayerId ? " (You)" : ""}
                      {p.isHost ? " · Host" : ""}
                    </p>
                    <p className="text-[10px] text-white/45">
                      {p.connected === false
                        ? "Reconnecting…"
                        : p.micOn
                          ? "🎤 Mic on"
                          : "Mic off"}
                    </p>
                  </div>
                </div>
                {p.id === myPlayerId ? (
                  <button
                    type="button"
                    onClick={toggleReady}
                    className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                      p.isReady ? "bg-[var(--success)]/20 text-[var(--success)]" : "bg-white/10 text-white/50"
                    }`}
                  >
                    {p.isReady ? "Ready" : "Ready up"}
                  </button>
                ) : (
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                      p.isReady ? "bg-[var(--success)]/20 text-[var(--success)]" : "bg-white/10 text-white/40"
                    }`}
                  >
                    {p.isReady ? "Ready" : "…"}
                  </span>
                )}
              </div>
            ) : (
              <div
                key={`empty-${i}`}
                className="flex items-center gap-3 rounded-xl border border-dashed border-[var(--border-soft)] bg-black/20 px-3 py-3 text-white/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-white/20">
                  <UserPlus size={16} />
                </div>
                <p className="text-[12px] font-semibold">Waiting for player…</p>
              </div>
            ),
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto rounded-xl border border-[var(--border-subtle)] bg-black/20 px-3 py-2.5">
          {chatMessages.length === 0 && (
            <p className="text-[12px] text-white/40">Chat with friends while you wait…</p>
          )}
          {chatMessages.slice(-8).map((m) => (
            <p
              key={m.id}
              className={`text-[12.5px] leading-snug ${m.system ? "italic text-white/55" : ""}`}
            >
              {m.system ? (
                <span className="text-white/70">{m.text}</span>
              ) : (
                <>
                  <span className="font-bold text-[var(--gold-2)]">{m.playerName}: </span>
                  <span className="text-white/85">{m.text}</span>
                </>
              )}
            </p>
          ))}
        </div>

        <div className="relative">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitMessage()}
            placeholder="Type a message..."
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-2)] px-4 py-3 pr-11 text-[13px] text-white outline-none"
          />
          <button type="button" onClick={submitMessage} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gold-2)]">
            <Send size={16} />
          </button>
        </div>

        {lastError && <p className="text-center text-[12px] text-[var(--danger)]">{lastError}</p>}

        <button
          type="button"
          onClick={() => void startGame()}
          disabled={!isHost || !allReady || players.filter((p) => p.connected !== false).length < 4}
          className="w-full rounded-2xl bg-gradient-to-b from-[var(--gold-1)] via-[var(--gold-2)] to-[var(--gold-3)] py-3.5 font-display text-[15px] font-bold text-[#241600] disabled:cursor-not-allowed disabled:opacity-40"
        >
          START GAME
        </button>
        <p className="text-center text-[11px] font-semibold text-white/40">
          {isHost ? "Need 4 players, all ready" : "Waiting for host to start"} · {state.totalRounds} rounds
        </p>
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
  onChange: (v: boolean) => void | Promise<void>;
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
        onClick={() => void onChange(!on)}
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
