/**
 * Liquid-glass compass — placeholder wordmark glyph.
 * Frosted translucent disc, specular sheen, thin needle. Idle needle drift is
 * CSS-driven and disabled under reduced motion.
 */
export function Compass({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`wander-compass inline-block ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 48 48" width={size} height={size} fill="none">
        <defs>
          <radialGradient id="wc-glass" cx="35%" cy="28%" r="75%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="wc-tint" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--sky)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--lake)" stopOpacity="0.4" />
          </linearGradient>
          <filter id="wc-blur" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.1" />
          </filter>
        </defs>

        {/* glass body */}
        <circle cx="24" cy="24" r="20" fill="url(#wc-tint)" />
        <circle cx="24" cy="24" r="20" fill="url(#wc-glass)" />
        <circle
          cx="24"
          cy="24"
          r="20"
          stroke="var(--lake)"
          strokeOpacity="0.5"
          strokeWidth="1"
        />
        {/* rim light */}
        <path
          d="M8 20a16 16 0 0 1 28-7"
          stroke="#ffffff"
          strokeOpacity="0.7"
          strokeWidth="1.4"
          strokeLinecap="round"
          filter="url(#wc-blur)"
        />

        {/* tick marks */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <line
            key={deg}
            x1="24"
            y1="7.5"
            x2="24"
            y2={deg % 90 === 0 ? 10.5 : 9.5}
            stroke="var(--foreground)"
            strokeOpacity={deg % 90 === 0 ? 0.4 : 0.2}
            strokeWidth="1"
            strokeLinecap="round"
            transform={`rotate(${deg} 24 24)`}
          />
        ))}

        {/* needle */}
        <g className="wander-compass-needle">
          <path d="M24 10 L27 24 L24 27 L21 24 Z" fill="var(--lake)" />
          <path
            d="M24 38 L21 24 L24 21 L27 24 Z"
            fill="var(--foreground)"
            fillOpacity="0.35"
          />
        </g>
        <circle cx="24" cy="24" r="2.1" fill="var(--surface)" />
        <circle
          cx="24"
          cy="24"
          r="2.1"
          stroke="var(--lake)"
          strokeOpacity="0.6"
          strokeWidth="1"
        />
      </svg>
    </span>
  );
}
