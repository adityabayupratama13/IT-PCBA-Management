export function GikenLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 50" xmlns="http://www.w3.org/2000/svg" className={className}>
      <g transform="skewX(-15)">
        {/* G */}
        <text x="25" y="42" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="48" fill="currentColor">G</text>
        
        {/* i - manual dot and stem */}
        <rect x="65" y="6" width="10" height="10" fill="#ef4444" />
        <rect x="65" y="18" width="10" height="24" fill="currentColor" />
        
        {/* KEN */}
        <text x="80" y="42" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="48" fill="currentColor" letterSpacing="-2">KEN</text>
      </g>
    </svg>
  );
}
