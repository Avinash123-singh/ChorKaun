interface StepBadgeProps {
  step: number;
  label: string;
}

/**
 * Small numbered step pill shown above a screen's panel, matching the
 * reference design's flow-progress badges (e.g. "6 Role Reveal").
 */
const StepBadge = ({ step, label }: StepBadgeProps) => {
  return (
    <div className="mb-3 flex items-center justify-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--purple-3)] text-[12px] font-black text-white shadow-[0_0_10px_rgba(116,36,211,0.6)]">
        {step}
      </span>
      <span className="font-display text-[15px] font-bold text-white/90">{label}</span>
    </div>
  );
};

export default StepBadge;
