export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="16" fill="#167f71" />
      <rect x="14" y="16" width="30" height="34" rx="4" fill="#fff" />
      <path d="M20 26h18M20 32h18M20 38h11" stroke="#72d0bd" strokeWidth="3" strokeLinecap="round" />
      <circle cx="43" cy="40" r="9" fill="#167f71" stroke="#fff" strokeWidth="4" />
      <path d="M50 47l6 6" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
