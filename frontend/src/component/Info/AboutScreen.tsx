import ScreenShell from "../shared/ScreenShell";

interface AboutScreenProps {
  onBack: () => void;
}

const AboutScreen = ({ onBack }: AboutScreenProps) => {
  return (
    <ScreenShell title="ABOUT" onBack={onBack}>
      <div className="flex flex-1 flex-col gap-4">
        <div className="text-center">
          <h2 className="font-display text-[28px] font-black text-gold-gradient">CHORKAUN</h2>
          <p className="mt-1 text-[13px] text-white/60">Find the Hidden Chor</p>
        </div>

        <p className="text-[13px] leading-relaxed text-white/75">
          ChorKaun brings the beloved street & family game{" "}
          <span className="font-semibold text-white">Raja–Mantri–Chor–Sipahi</span> to a royal
          digital stage. Four friends. Secret roles. One thief. Endless bluffing.
        </p>

        <div className="space-y-2 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-panel-2)] p-4 text-[12px] text-white/65">
          <p>
            <span className="font-bold text-white/85">Version</span> — 1.0.0
          </p>
          <p>
            <span className="font-bold text-white/85">Players</span> — Exactly 4 per room
          </p>
          <p>
            <span className="font-bold text-white/85">Platform</span> — Web (desktop & mobile)
          </p>
          <p>
            <span className="font-bold text-white/85">Made for</span> — Friends, family nights, and
            party chaos
          </p>
        </div>

        <p className="text-[12px] leading-relaxed text-white/50">
          Artwork and UI follow a dark royal theme — gold crowns, purple courts, and character
          portraits for each role. No gambling. Pure social deduction fun.
        </p>
      </div>
    </ScreenShell>
  );
};

export default AboutScreen;
