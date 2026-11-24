/**
 * The Ikhtiyari logo: a shopping cart with a leaf inside and a check badge,
 * above the wordmark "اختياري". Drawn as SVG (not an image) so that:
 *   - it stays sharp at every size, and
 *   - each part has a class the splash animation can target:
 *       .logo-cart  .logo-rail  .logo-wheel  .logo-leaf  .logo-badge  .logo-check
 *
 * The wordmark is the only weight-700 text in the app (brand exception to
 * the 600 maximum in .ux-profile.md).
 *
 * Stroked parts use pathLength="1" so "draw" animations can go from
 * stroke-dashoffset 1 → 0 regardless of the path's real length.
 */

interface LogoProps {
  /** Width of the mark in px. The wordmark scales with it. */
  size?: number;
  /** Show "اختياري" under the mark. */
  wordmark?: boolean;
  className?: string;
}

export function Logo({ size = 120, wordmark = true, className }: LogoProps) {
  return (
    <div className={`flex flex-col items-center gap-[0.12em] ${className ?? ""}`} style={{ fontSize: size }}>
      <LogoMark size={size} />
      {wordmark && (
        <span className="logo-wordmark font-bold leading-none text-fg" style={{ fontSize: size * 0.42 }}>
          اختياري
        </span>
      )}
    </div>
  );
}

export function LogoMark({ size = 40, title }: { size?: number; title?: string }) {
  return (
    <svg
      width={size}
      height={size * 0.76}
      viewBox="0 0 100 76"
      fill="none"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      // Mirrored layouts must not flip the brand mark.
      style={{ direction: "ltr" }}
    >
      {/* Handle, left side, bottom and right side of the basket: one stroke. */}
      <path
        className="logo-cart"
        pathLength={1}
        d="M3 9.5H12.5L30 50H70L81 31"
        stroke="var(--color-fg)"
        strokeWidth={4.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Top rail of the basket, stopping short of the badge. */}
      <path
        className="logo-rail"
        pathLength={1}
        d="M19.5 21H65"
        stroke="var(--color-fg)"
        strokeWidth={4.5}
        strokeLinecap="round"
      />
      {/* Leaf with its vein cut out in the background color. */}
      <g className="logo-leaf">
        <path d="M41 47C40 36 47 29 60 28C61 40 54 47 41 47Z" fill="var(--color-fg)" />
        <path d="M42.5 45.5L55 33" stroke="var(--color-ink)" strokeWidth={2.2} strokeLinecap="round" />
      </g>
      <circle className="logo-wheel" cx={39} cy={63} r={5.5} fill="var(--color-fg)" />
      <circle className="logo-wheel" cx={63} cy={63} r={5.5} fill="var(--color-fg)" />
      {/* Check badge. The ink ring separates it from the cart. */}
      <g>
        <circle className="logo-badge" cx={82} cy={13} r={12} fill="var(--color-charcoal)" stroke="var(--color-ink)" strokeWidth={3} />
        <path
          className="logo-check"
          pathLength={1}
          d="M76.5 13.5L80.5 17.5L88 9.5"
          stroke="var(--color-fg)"
          strokeWidth={3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
