interface PlayerAvatarProps {
  src: string;
  name: string;
  size?: number;
  ring?: string;
  crown?: boolean;
}

const PlayerAvatar = ({ src, name, size = 43, ring, crown }: PlayerAvatarProps) => {
  // The generated avatar art already bakes in its own gold ring border, so we
  // only add a CSS ring here when an explicit override color is requested
  // (e.g. highlighting the active Raja) — otherwise we'd get a double ring.
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {crown && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 text-[14px] drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]">
          👑
        </span>
      )}
      <div
        className="h-full w-full overflow-hidden rounded-full bg-[var(--bg-panel-2)]"
        style={
          ring
            ? { boxShadow: `0 0 0 2px var(--bg-panel), 0 0 0 4px ${ring}` }
            : undefined
        }
      >
        <img src={src} alt={name} className="h-full w-full object-cover" />
      </div>
    </div>
  );
};

export default PlayerAvatar;
