import { useState } from "react";
import { ChevronRight, Send, X } from "lucide-react";
import { useGame } from "../../state/gameStore";

/** Left-side chat dock — game stays playable on the right. */
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
    <div className="pointer-events-none fixed inset-0 z-50 flex justify-start">
      <aside className="pointer-events-auto flex h-full w-[min(100%,340px)] flex-col border-r border-[var(--border-subtle)] bg-[#0b0818]/97 shadow-2xl backdrop-blur-md">
        <header className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-4 py-4">
          <h2 className="text-[14px] font-black tracking-wide text-[var(--gold-2)]">ROOM CHAT</h2>
          <p className="ml-auto text-[11px] text-white/45">
            {state.micEnabled ? "Mic on" : "Mic off"}
          </p>
          <button
            type="button"
            onClick={toggleChat}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--bg-panel-2)]"
            aria-label="Close chat"
          >
            <X size={16} />
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
          {state.chatMessages.length === 0 && (
            <p className="text-center text-[12px] text-white/40">No messages yet — keep playing</p>
          )}
          {state.chatMessages.map((m) => {
            const isMe = m.playerId === state.myPlayerId;
            return (
              <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] ${
                    isMe
                      ? "bg-gradient-to-r from-[var(--purple-3)] to-[var(--purple-4)] text-white"
                      : "border border-[var(--border-subtle)] bg-[var(--bg-panel-2)] text-white/90"
                  }`}
                >
                  {!isMe && (
                    <p className="mb-0.5 text-[11px] font-bold text-[var(--gold-2)]">{m.playerName}</p>
                  )}
                  <p>{m.text}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 border-t border-[var(--border-subtle)] px-3 py-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Message friends…"
            className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-2)] px-3 py-2.5 text-[13px] text-white outline-none"
          />
          <button
            type="button"
            onClick={submit}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--gold-2)] text-[#241600]"
          >
            <Send size={16} />
          </button>
        </div>

        <button
          type="button"
          onClick={toggleChat}
          className="flex items-center justify-center gap-1 border-t border-[var(--border-subtle)] py-2 text-[11px] font-semibold text-white/45"
        >
          Hide chat <ChevronRight size={12} />
        </button>
      </aside>
    </div>
  );
};

export default ChatPanel;
