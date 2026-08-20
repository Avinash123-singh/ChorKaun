import { useState } from "react";
import { ChevronLeft, Headphones, Mic, PhoneOff, Send, Volume2 } from "lucide-react";
import { useGame } from "../../state/gameStore";

const ChatPanel = () => {
  const { state, toggleChat, sendChat } = useGame();
  const [text, setText] = useState("");

  if (!state.chatOpen) return null;

  const submit = () => {
    if (!text.trim()) return;
    sendChat(text.trim());
    setText("");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
      <div className="flex h-full w-full max-w-[380px] flex-col bg-[#0b0818] shadow-2xl">
        {/* Header */}
        <header className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-4 py-4">
          <button
            onClick={toggleChat}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--bg-panel-2)]"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-[14px] font-black tracking-wide text-[var(--gold-2)]">
            ROOM CHAT
          </h2>
        </header>

        {/* Messages */}
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
          {state.chatMessages.map((m) => {
            const isMe = m.playerId === "p1";
            return (
              <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-[13px] ${
                    isMe
                      ? "bg-gradient-to-r from-[var(--purple-3)] to-[var(--purple-4)] text-white"
                      : "border border-[var(--border-subtle)] bg-[var(--bg-panel-2)] text-white/90"
                  }`}
                >
                  {!isMe && (
                    <p className="mb-0.5 text-[11px] font-bold text-[var(--gold-2)]">
                      {m.playerName}
                    </p>
                  )}
                  <p>{m.text}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 border-t border-[var(--border-subtle)] px-3 py-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Type a message..."
            className="flex-1 rounded-full border border-[var(--border-soft)] bg-[var(--bg-panel-2)] px-4 py-2.5 text-[13px] text-white outline-none focus:border-[var(--purple-3)]"
          />
          <button
            onClick={submit}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--purple-3)] text-white"
          >
            <Send size={16} />
          </button>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-around border-t border-[var(--border-subtle)] px-4 py-3">
          <button className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--danger)]/20 text-[var(--danger)]">
            <PhoneOff size={18} />
          </button>
          <button className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--bg-panel-2)] text-white/80">
            <Mic size={18} />
          </button>
          <button className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--bg-panel-2)] text-white/80">
            <Volume2 size={18} />
          </button>
          <button className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--purple-3)] text-white">
            <Headphones size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
