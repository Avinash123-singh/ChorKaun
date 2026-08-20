import ScreenShell from "../shared/ScreenShell";
import { useGame } from "../../state/gameStore";

interface SettingsScreenProps {
  onBack: () => void;
}

const Toggle = ({
  label,
  hint,
  on,
  onChange,
}: {
  label: string;
  hint: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-panel-2)] px-4 py-3">
    <div>
      <p className="text-[13px] font-bold text-white">{label}</p>
      <p className="text-[11px] text-white/45">{hint}</p>
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

const SettingsScreen = ({ onBack }: SettingsScreenProps) => {
  const { state, setSoundEnabled, setSuspenseMusic, setMicEnabled } = useGame();

  return (
    <ScreenShell title="SETTINGS" onBack={onBack}>
      <div className="flex flex-1 flex-col gap-3">
        <Toggle
          label="Game Sound"
          hint="Button clicks and reveal cues"
          on={state.soundEnabled}
          onChange={setSoundEnabled}
        />
        <Toggle
          label="Suspense Music"
          hint="Dramatic underscore during discussion & guesses"
          on={state.suspenseMusic}
          onChange={setSuspenseMusic}
        />
        <Toggle
          label="Microphone"
          hint="Allow voice chat when you join a lobby"
          on={state.micEnabled}
          onChange={setMicEnabled}
        />

        <div className="mt-4 rounded-xl border border-[var(--border-soft)] bg-black/25 p-4 text-[12px] leading-relaxed text-white/60">
          <p className="mb-1 font-bold text-white/80">Account</p>
          Profile is saved on this device. Clearing browser data resets your name and coins.
        </div>
      </div>
    </ScreenShell>
  );
};

export default SettingsScreen;
