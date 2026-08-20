import { useState } from "react";
import { Check, Copy, Link2, Share2 } from "lucide-react";
import ScreenShell from "../shared/ScreenShell";
import { useGame } from "../../state/gameStore";

const RoomCreatedScreen = () => {
  const { state, goToLobby, setScreen } = useGame();
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  const copy = async (kind: "code" | "link") => {
    const text = kind === "code" ? state.roomId : state.inviteLink;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* ignore */
    }
  };

  const shareAll = async () => {
    const message = `Join my ChorKaun room!\nCode: ${state.roomId}\nLink: ${state.inviteLink}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "ChorKaun Room", text: message });
      } else {
        await navigator.clipboard.writeText(message);
        setCopied("link");
        setTimeout(() => setCopied(null), 1800);
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <ScreenShell title="SUCCESS" onBack={() => setScreen("createRoom")}>
      <div className="relative flex flex-1 flex-col items-center gap-5">
        <div className="pointer-events-none absolute inset-0 -z-0">
          <div className="absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-[var(--gold-2)]/20 blur-3xl" />
        </div>

        <h1 className="mt-2 text-center font-display text-[34px] font-black leading-none tracking-wide text-gold-gradient sm:text-[40px]">
          Room Created
        </h1>
        <p className="max-w-[280px] text-center text-[13px] leading-relaxed text-white/70">
          Share the room code or invite link with your friends so they can join directly.
        </p>

        <div className="w-full space-y-3 rounded-2xl border border-[var(--gold-2)]/35 bg-black/30 p-4 shadow-[0_0_30px_rgba(255,200,46,0.12)]">
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/50">
              Room Code
            </p>
            <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-panel-2)] px-4 py-3">
              <span className="font-display text-[22px] font-black tracking-[4px] text-[var(--gold-2)]">
                {state.roomId}
              </span>
              <button
                type="button"
                onClick={() => copy("code")}
                className="rounded-lg border border-[var(--border-soft)] p-2 text-white/70 transition hover:bg-white/5"
              >
                {copied === "code" ? <Check size={16} className="text-[var(--success)]" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/50">
              Invite Link
            </p>
            <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-panel-2)] px-4 py-3">
              <span className="flex min-w-0 items-center gap-2 text-[12px] text-white/75">
                <Link2 size={14} className="shrink-0 text-[var(--gold-2)]" />
                <span className="truncate">{state.inviteLink}</span>
              </span>
              <button
                type="button"
                onClick={() => copy("link")}
                className="shrink-0 rounded-lg border border-[var(--border-soft)] p-2 text-white/70 transition hover:bg-white/5"
              >
                {copied === "link" ? <Check size={16} className="text-[var(--success)]" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={shareAll}
          className="
            flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border-soft)]
            bg-[var(--bg-panel-2)] py-3.5 text-[14px] font-bold text-white transition hover:bg-white/5
          "
        >
          <Share2 size={16} className="text-[var(--gold-2)]" /> Copy Link
        </button>

        <div className="flex-1" />

        <button
          type="button"
          onClick={goToLobby}
          className="
            w-full rounded-2xl bg-gradient-to-b from-[var(--gold-1)] via-[var(--gold-2)] to-[var(--gold-3)]
            py-3.5 text-[15px] font-black tracking-wide text-[#241600]
            shadow-[0_8px_20px_rgba(255,180,20,0.28)] transition hover:scale-[1.01] active:scale-[0.98]
          "
        >
          GO TO LOBBY
        </button>
      </div>
    </ScreenShell>
  );
};

export default RoomCreatedScreen;
