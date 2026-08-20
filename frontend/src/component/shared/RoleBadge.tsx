import type { Role } from "../../types/game";
import { ROLE_EMOJI, ROLE_LABEL } from "../../types/game";

const ROLE_COLORS: Record<Role, { bg: string; text: string; border: string }> = {
  raja: { bg: "bg-[#3a2a08]", text: "text-[var(--gold-2)]", border: "border-[var(--gold-2)]/50" },
  sipahi: { bg: "bg-[#0d2740]", text: "text-[#4AA8F5]", border: "border-[#4AA8F5]/50" },
  mantri: { bg: "bg-[#241040]", text: "text-[#B084F0]", border: "border-[#B084F0]/50" },
  chor: { bg: "bg-[#3a0f18]", text: "text-[var(--danger)]", border: "border-[var(--danger)]/50" },
};

const RoleBadge = ({ role }: { role: Role }) => {
  const c = ROLE_COLORS[role];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${c.border} ${c.bg} ${c.text} px-3 py-1 text-[11px] font-black tracking-wide`}
    >
      <span>{ROLE_EMOJI[role]}</span>
      {ROLE_LABEL[role]}
    </span>
  );
};

export default RoleBadge;
