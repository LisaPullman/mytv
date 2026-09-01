'use client';

import type { SVGProps } from 'react';

/**
 * foxai "Trace" mark — derived from the LOGO.html spec.
 *
 * Three shapes on a 64-unit grid:
 *   • spine + hook       M23 55V22c0-7.2 5.8-13 13-13h2
 *   • crossbar (request) M12.5 31h21
 *   • endpoint dot       circle(49, 9, r=5.5)
 *
 * The lockup pairs the bare mark (currentColor) with the "foxai" wordmark,
 * where the "ai" suffix picks up the brand accent. Strokes inherit
 * currentColor so the lockup can sit on any surface.
 */

const PATHS = (
  <g
    fill='none'
    stroke='currentColor'
    strokeWidth={7.5}
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M23 55V22c0-7.2 5.8-13 13-13h2' />
    <path d='M12.5 31h21' />
  </g>
);

const DOT = (
  <circle cx='49' cy='9' r='5.5' fill='currentColor' stroke='none' />
);

type LogoProps = SVGProps<SVGSVGElement> & {
  size?: number;
  title?: string;
};

/** Bare stroke mark. Inherits color from currentColor / --brand. */
export function FoxMark({ size = 24, title, className, ...rest }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 64 64'
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={className}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {PATHS}
      {DOT}
    </svg>
  );
}

/** Opaque rounded tile — for favicons, app icons, ≤ 24px surfaces. */
export function FoxTile({ size = 24, title, className, ...rest }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 64 64'
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={className}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <rect width='64' height='64' rx='14' className='fill-[var(--brand)]' />
      <g
        fill='none'
        stroke='var(--brand-foreground)'
        strokeWidth={7.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        <path d='M23 55V22c0-7.2 5.8-13 13-13h2' />
        <path d='M12.5 31h21' />
      </g>
      <circle
        cx='49'
        cy='9'
        r='5.5'
        fill='var(--brand-foreground)'
        stroke='none'
      />
    </svg>
  );
}

/**
 * foxai lockup — "Trace" mark (currentColor) + "foxai" wordmark where the
 * "ai" suffix picks up the brand accent. Per LOGO.html §2.3: no chip, no
 * outline, the mark inherits the surrounding ink so it sits calmly beside
 * the wordmark. Site name may stay "f.foxai" — the lockup itself is Mark +
 * "foxai", never "f.foxai".
 */
export function FoxLockup({
  size = 24,
  title,
  className,
  ...rest
}: Omit<LogoProps, 'size'> & {
  size?: number;
}) {
  const wordSize = Math.max(10, Math.round(size * 0.6));
  const gap = Math.max(4, Math.round(size * 0.3));
  return (
    <span
      className={`inline-flex items-center ${className ?? ''}`}
      style={{ gap, color: 'var(--ink)' }}
      {...(rest as any)}
    >
      <FoxMark size={size} title={title} />
      <span
        style={{
          fontWeight: 600,
          letterSpacing: '-0.01em',
          fontSize: wordSize,
          lineHeight: 1,
        }}
      >
        fox<span style={{ color: 'var(--brand)' }}>ai</span>
      </span>
    </span>
  );
}