import { Crown, ScrollText, Shield, VenetianMask } from "lucide-react";
import type { Role } from "../../types/game";
import { ROLE_GRADIENT } from "../../types/game";

const ROLE_ICON: Record<Role, typeof Crown> = {
  raja: Crown,
  sipahi: Shield,
  mantri: ScrollText,
  chor: VenetianMask,
};

interface RoleEmblemProps {
  role: Role;
  size?: number;
  square?: boolean;
}

/**
 * Crisp, resolution-independent role badge: a rich gradient medallion with a
 * large vector icon, gold ring and soft glow. Used everywhere a role needs a
 * "portrait" — scales perfectly at any size, unlike a raster image crop.
 */
const RoleEmblem = ({ role, size = 96, square = false }: RoleEmblemProps) => {
  const [from, to] = ROLE_GRADIENT[role];
  const Icon = ROLE_ICON[role];
  const shape = square ? "rounded-[28%]" : "rounded-full";

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center ${shape}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 35% 25%, ${from}, ${to} 75%)`,
        boxShadow: `0 ${size * 0.12}px ${size * 0.3}px -${size * 0.05}px ${to}99, inset 0 2px 0 rgba(255,255,255,0.35), inset 0 -${size * 0.08}px ${size * 0.18}px rgba(0,0,0,0.35)`,
      }}
    >
      <div
        className={`absolute inset-[6%] ${shape} border border-white/25`}
        style={{ boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.15)" }}
      />
      <Icon
        size={size * 0.52}
        strokeWidth={1.8}
        className="relative drop-shadow-[0_3px_4px_rgba(0,0,0,0.45)]"
        color="#FFFCF2"
        fill={role === "raja" ? "#FFE9A8" : "none"}
      />
      <div
        className={`pointer-events-none absolute inset-0 ${shape}`}
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 35%)",
        }}
      />
    </div>
  );
};

export default RoleEmblem;
