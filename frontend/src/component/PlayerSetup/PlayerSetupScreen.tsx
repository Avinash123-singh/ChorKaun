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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <ScreenShell title="YOUR PROFILE" onBack={onBack}>
      <div className="flex flex-1 flex-col gap-5">
        <p className="text-center text-[13px] text-white/65">
          {state.userProfile.setupComplete
            ? "Update your name and avatar — saved to your account."
            : "Create your profile once. We'll remember you next time."}
        </p>

        <div className="mx-auto h-24 w-24 overflow-hidden rounded-full border-2 border-[var(--gold-2)]">
          <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-semibold text-white">Display Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 16))}
            placeholder="Enter your name"
            className="w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-panel-2)] px-4 py-3.5 text-[14px] text-white outline-none focus:border-[var(--gold-2)]"
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
                className={`overflow-hidden rounded-xl border-2 ${
                  avatar === src ? "border-[var(--gold-2)]" : "border-[var(--border-soft)] opacity-70"
                }`}
              >
                <img src={src} alt="" className="aspect-square w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-center text-[12px] text-[var(--danger)]">{error}</p>}

        <div className="flex-1" />

        <button
          type="button"
          disabled={name.trim().length < 2 || busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              await saveProfile(name, avatar);
              setScreen(nextScreen);
            } catch (e: any) {
              setError(e?.message || "Could not save. Is the server running?");
            } finally {
              setBusy(false);
            }
          }}
          className="w-full rounded-2xl bg-gradient-to-b from-[var(--gold-1)] via-[var(--gold-2)] to-[var(--gold-3)] py-3.5 text-[15px] font-black text-[#241600] disabled:opacity-40"
        >
          {busy ? "SAVING…" : state.userProfile.setupComplete ? "SAVE PROFILE" : "CONTINUE"}
        </button>
      </div>
    </ScreenShell>
  );
};

export default PlayerSetupScreen;
