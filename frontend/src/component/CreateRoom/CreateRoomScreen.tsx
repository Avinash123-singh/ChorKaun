import { useState } from "react";
import { Copy, Link2, Lock, Unlock } from "lucide-react";
import ScreenShell from "../shared/ScreenShell";
import { useGame } from "../../state/gameStore";
import { ROLE_PORTRAIT } from "../../types/game";

const ROUND_OPTIONS = [1, 3, 5, 7];

interface CreateRoomScreenProps {
  onBack: () => void;
}

const CreateRoomScreen = ({ onBack }: CreateRoomScreenProps) => {
  const { state, createRoom } = useGame();
  const hostName = state.userProfile.name || "Player";
  const [roomName, setRoomName] = useState(`${hostName}'s Room`);
  const [totalRounds, setTotalRounds] = useState(3);
  const [isPrivate, setIsPrivate] = useState(true);
  const [copied, setCopied] = useState(false);

  const previewCode = "Will generate after create";
  const previewLink = `${window.location.origin}/join/••••••`;

  const copyPreview = async () => {
    try {
      await navigator.clipboard.writeText(
        `Join my ChorKaun room!\nI'll share the code after creating.`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <ScreenShell title="CREATE ROOM" onBack={onBack}>
      <div className="relative flex flex-1 flex-col gap-4 overflow-hidden">
        {/* Decorative background inside panel */}
        <div className="pointer-events-none absolute inset-0 -z-0">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[var(--purple-3)]/25 blur-3xl" />
          <div className="absolute -left-10 bottom-20 h-44 w-44 rounded-full bg-[var(--gold-2)]/10 blur-3xl" />
          <div
            className="absolute inset-x-0 bottom-0 h-24 opacity-30"
            style={{
              backgroundImage: "url(/assets/skyline.png)",
              backgroundSize: "cover",
              backgroundPosition: "bottom",
              maskImage: "linear-gradient(to top, black, transparent)",
              WebkitMaskImage: "linear-gradient(to top, black, transparent)",
            }}
          />
        </div>

        <div className="relative z-10 flex gap-2 overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-black/25 p-2">
          {(["raja", "sipahi", "mantri", "chor"] as const).map((role) => (
            <img
              key={role}
              src={ROLE_PORTRAIT[role]}
              alt={role}
              className="h-14 flex-1 rounded-xl object-cover object-top opacity-90"
            />
          ))}
        </div>

        <div className="relative z-10">
          <label className="mb-2 block text-[13px] font-semibold text-white">Room Name</label>
          <input
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className="
              w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-panel-2)]/90
              px-4 py-3.5 text-[14px] font-medium text-white outline-none
              focus:border-[var(--gold-2)]
            "
          />
        </div>

        <div className="relative z-10">
          <label className="mb-2 block text-[13px] font-semibold text-white">
            Number of Rounds
          </label>
          <div className="grid grid-cols-4 gap-2">
            {ROUND_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setTotalRounds(n)}
                className={`rounded-xl border px-2 py-3 text-[13px] font-bold transition ${
                  totalRounds === n
                    ? "border-[var(--gold-2)] bg-[var(--bg-panel-2)] text-[var(--gold-2)] shadow-[0_0_12px_rgba(255,200,46,0.25)]"
                    : "border-[var(--border-soft)] bg-[var(--bg-panel-2)]/80 text-white/55"
                }`}
              >
                {n} {n === 1 ? "Round" : "Rounds"}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-white/45">
            4 players only — Raja, Mantri, Chor & Sipahi each round.
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-between rounded-xl border border-[var(--border-soft)] bg-[var(--bg-panel-2)]/80 px-4 py-3">
          <div className="flex items-center gap-2">
            {isPrivate ? (
              <Lock size={16} className="text-[var(--gold-2)]" />
            ) : (
              <Unlock size={16} className="text-white/60" />
            )}
            <span className="text-[13px] font-semibold text-white">Private Room</span>
          </div>
          <button
            type="button"
            onClick={() => setIsPrivate((v) => !v)}
            className={`flex h-7 w-12 items-center rounded-full px-0.5 transition ${
              isPrivate ? "justify-end bg-[var(--gold-2)]" : "justify-start bg-[var(--border-soft)]"
            }`}
          >
            <span className="h-6 w-6 rounded-full bg-white shadow" />
          </button>
        </div>

        <div className="relative z-10 rounded-xl border border-dashed border-[var(--gold-2)]/35 bg-black/25 p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--gold-2)]/80">
            Share after create
          </p>
          <div className="space-y-2 text-[12px] text-white/70">
            <div className="flex items-center justify-between gap-2">
              <span>Room Code</span>
              <span className="font-mono font-bold text-white/50">{previewCode}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1">
                <Link2 size={12} /> Invite Link
              </span>
              <span className="max-w-[55%] truncate font-mono text-white/50">{previewLink}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={copyPreview}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border-soft)] py-2 text-[12px] font-semibold text-white/70 transition hover:bg-white/5"
          >
            <Copy size={14} /> {copied ? "Copied tip!" : "Ready to share with friends"}
          </button>
        </div>

        <div className="relative z-10 flex-1" />

        <button
          type="button"
          onClick={() => createRoom(roomName, totalRounds, isPrivate)}
          className="
            relative z-10 w-full rounded-2xl bg-gradient-to-b from-[var(--gold-1)] via-[var(--gold-2)] to-[var(--gold-3)]
            py-3.5 text-[15px] font-black tracking-wide text-[#241600]
            shadow-[0_8px_20px_rgba(255,180,20,0.28),inset_0_1px_0_rgba(255,255,255,0.55)]
            transition hover:scale-[1.01] active:scale-[0.98]
          "
        >
          CREATE ROOM
        </button>
      </div>
    </ScreenShell>
  );
};

export default CreateRoomScreen;
