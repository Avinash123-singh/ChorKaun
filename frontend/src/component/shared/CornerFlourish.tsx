interface CornerFlourishProps {
  className?: string;
}

/** Ornate gold corner flourish for role cards. */
const CornerFlourish = ({ className = "" }: CornerFlourishProps) => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    className={`pointer-events-none absolute z-10 text-[var(--gold-2)] ${className}`}
    aria-hidden
  >
    <path
      d="M3 3 L3 14 M3 3 L14 3"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M3 8 C7 8, 8 7, 8 3"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      opacity="0.75"
    />
    <circle cx="3" cy="3" r="2.4" fill="currentColor" />
    <circle cx="10" cy="3" r="1.1" fill="currentColor" opacity="0.7" />
    <circle cx="3" cy="10" r="1.1" fill="currentColor" opacity="0.7" />
  </svg>
);

export default CornerFlourish;
