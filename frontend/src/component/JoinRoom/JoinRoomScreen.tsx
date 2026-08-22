import { useState } from "react";
import { KeyRound, Sparkles } from "lucide-react";
import ScreenShell from "../shared/ScreenShell";
import { useGame } from "../../state/gameStore";
import { ROLE_ACCENT, ROLE_CARD_IMAGE, ROLE_LABEL } from "../../types/game";

interface JoinRoomScreenProps {
  onBack: () => void;
}

const JoinRoomScreen = ({ onBack }: JoinRoomScreenProps) => {
  const { joinRoom } = useGame();
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const code = roomCode.trim();
    if (code.length < 4) return;
    setBusy(true);
    setError("");
    const result = await joinRoom(code);
    if (!result.ok) setError(result.error || "Could not join room");
    setBusy(false);
  };

  return (
    <ScreenShell title="JOIN ROOM" onBack={onBack}>
      <div className="relative flex flex-1 flex-col gap-5 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-0">
          <div className="absolute left-1/2 top-8 h-48 w-48 -translate-x-1/2 rounded-full bg-[var(--purple-3)]/30 blur-3xl" />
        </div>

        <div className="relative z-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--gold-2)]/40 bg-[var(--gold-2)]/10">
            <KeyRound size={22} className="text-[var(--gold-2)]" />
          </div>
          <p className="text-[13px] leading-relaxed text-white/65">
            Enter the <span className="font-bold text-[var(--gold-2)]">room code</span> your friend
            shared. You'll appear in their lobby instantly.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-4 gap-2">
          {(["raja", "mantri", "chor", "sipahi"] as const).map((role) => (
            <div
              key={role}
              className="overflow-hidden rounded-2xl border bg-black/35"
              style={{ borderColor: `${ROLE_ACCENT[role]}88` }}
            >
              <img
                src={ROLE_CARD_IMAGE[role]}
                alt={ROLE_LABEL[role]}
                loading="eager"
                decoding="async"
                className="aspect-[3/4] w-full object-cover object-[center_12%]"
              />
              <p className="bg-black/65 py-0.5 text-center text-[8px] font-black text-white/80">
                {ROLE_LABEL[role]}
              </p>
            </div>
          ))}
        </div>

        <div className="relative z-10">
          <label className="mb-2 block text-[13px] font-semibold text-white">Room Code</label>
          <input
            value={roomCode}
            onChange={(e) => {
              setError("");
              setRoomCode(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 8));
            }}
            onKeyDown={(e) => e.key === "Enter" && void submit()}
            placeholder="6-DIGIT CODE"
            maxLength={8}
            className="
              w-full rounded-2xl border-2 border-[var(--gold-2)]/35 bg-black/35
              px-4 py-4 text-center font-display text-[22px] font-black tracking-[6px] text-[var(--gold-2)]
              outline-none focus:border-[var(--gold-2)]
            "
          />
          {error && <p className="mt-2 text-center text-[12px] text-[var(--danger)]">{error}</p>}
        </div>

        <div className="relative z-10 rounded-xl border border-[var(--border-soft)] bg-black/25 px-4 py-3 text-[11px] text-white/55">
          <Sparkles size={14} className="mb-1 inline text-[var(--gold-2)]" /> New here? Set your
          profile first — it's saved so you won't type your name every time.
        </div>

        <div className="relative z-10 flex-1" />

        <button
          type="button"
          disabled={roomCode.trim().length < 4 || busy}
          onClick={() => void submit()}
          className="relative z-10 w-full rounded-2xl bg-gradient-to-r from-[var(--purple-2)] to-[var(--purple-3)] py-3.5 text-[15px] font-black text-white disabled:opacity-40"
        >
          {busy ? "JOINING…" : "JOIN THE COURT"}
        </button>
      </div>
    </ScreenShell>
  );
};

export default JoinRoomScreen;
