import { useState } from "react";
import ScreenShell from "../shared/ScreenShell";
import { useGame } from "../../state/gameStore";

interface JoinRoomScreenProps {
  onBack: () => void;
}

const JoinRoomScreen = ({ onBack }: JoinRoomScreenProps) => {
  const { joinRoom } = useGame();
  const [roomCode, setRoomCode] = useState("");

  return (
    <ScreenShell title="JOIN ROOM" onBack={onBack}>
      <div className="flex flex-1 flex-col gap-5">
        <div>
          <label className="mb-2 block text-[13px] font-semibold text-white">Room Code</label>
          <input
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 8))}
            placeholder="Enter Room Code"
            maxLength={8}
            className="
              w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-panel-2)]
              px-4 py-3.5 text-[14px] font-semibold tracking-[2px] text-white placeholder:text-white/40
              outline-none transition focus:border-[var(--gold-2)]
            "
          />
        </div>

        <div className="relative mx-auto w-full max-w-[340px] flex-1">
          <div
            className="absolute inset-0 rounded-[28px]"
            style={{
              background:
                "radial-gradient(ellipse 70% 55% at 50% 45%, rgba(116,36,211,0.35) 0%, transparent 70%)",
            }}
          />
          <img
            src="/assets/roles/party-lineup.png"
            alt="Raja, Sipahi, Mantri and Chor"
            className="relative z-[1] mx-auto h-full max-h-[280px] w-full object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.45)]"
          />
        </div>

        <button
          type="button"
          disabled={roomCode.trim().length < 4}
          onClick={() => joinRoom(roomCode)}
          className="
            w-full rounded-2xl bg-gradient-to-r from-[var(--purple-2)] to-[var(--purple-3)]
            py-3.5 text-[15px] font-black tracking-wide text-white
            shadow-[0_10px_25px_rgba(90,20,140,0.35)]
            transition enabled:hover:scale-[1.01] enabled:active:scale-[0.98]
            disabled:cursor-not-allowed disabled:opacity-40
          "
        >
          JOIN ROOM
        </button>
      </div>
    </ScreenShell>
  );
};

export default JoinRoomScreen;
