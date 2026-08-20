import { useState } from "react";
import ScreenShell from "../shared/ScreenShell";
import { useGame } from "../../state/gameStore";
import { AVATAR_OPTIONS, type Screen } from "../../types/game";

interface PlayerSetupScreenProps {
  onBack: () => void;
  nextScreen?: Screen;
}

const PlayerSetupScreen = ({ onBack, nextScreen = "createRoom" }: PlayerSetupScreenProps) => {
  const { state, saveProfile, setScreen } = useGame();
  const [name, setName] = useState(state.userProfile.name || "");
  const [avatar, setAvatar] = useState(state.userProfile.avatar || AVATAR_OPTIONS[0]);

  return (
    <ScreenShell title="YOUR PROFILE" onBack={onBack}>
      <div className="flex flex-1 flex-col gap-5">
        <p className="text-center text-[13px] text-white/65">
          {state.userProfile.setupComplete
            ? "Update your display name and avatar."
            : "First time here? Set your name and avatar to continue."}
        </p>

        <div className="mx-auto h-24 w-24 overflow-hidden rounded-full border-2 border-[var(--gold-2)] shadow-[0_0_24px_rgba(255,200,46,0.35)]">
          <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-semibold text-white">Display Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 16))}
            placeholder="Enter your name"
            className="
              w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-panel-2)]
              px-4 py-3.5 text-[14px] font-medium text-white outline-none
              focus:border-[var(--gold-2)]
            "
          />
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-semibold text-white">Choose Avatar</label>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {AVATAR_OPTIONS.map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => setAvatar(src)}
                className={`overflow-hidden rounded-xl border-2 transition ${
                  avatar === src
                    ? "border-[var(--gold-2)] shadow-[0_0_12px_rgba(255,200,46,0.35)]"
                    : "border-[var(--border-soft)] opacity-70 hover:opacity-100"
                }`}
              >
                <img src={src} alt="" className="aspect-square w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1" />

        <button
          type="button"
          disabled={name.trim().length < 2}
          onClick={() => {
            saveProfile(name, avatar);
            setScreen(nextScreen);
          }}
          className="
            w-full rounded-2xl bg-gradient-to-b from-[var(--gold-1)] via-[var(--gold-2)] to-[var(--gold-3)]
            py-3.5 text-[15px] font-black tracking-wide text-[#241600]
            shadow-[0_8px_20px_rgba(255,180,20,0.28)] transition
            enabled:hover:scale-[1.01] enabled:active:scale-[0.98]
            disabled:cursor-not-allowed disabled:opacity-40
          "
        >
          {state.userProfile.setupComplete ? "SAVE PROFILE" : "CONTINUE"}
        </button>
      </div>
    </ScreenShell>
  );
};

export default PlayerSetupScreen;
