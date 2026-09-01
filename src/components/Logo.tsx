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
 * Strokes inherit currentColor (or --brand) so the lockup can sit on any
 * surface; the dot picks up the same accent so the mark reads as one shape.
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
      <rect
        width='64'
        height='64'
        rx='14'
        className='fill-[var(--brand)]'
      />
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

/** Mark + "foxai" wordmark with the "ai" suffix in the brand accent. */
export function FoxLockup({
  size = 24,
  title,
  className,
  ...rest
}: Omit<LogoProps, 'size'> & { size?: number }) {
  const wordSize = Math.max(10, Math.round(size * 0.6));
  return (
    <span
      className={`inline-flex items-center gap-2 ${className ?? ''}`}
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
        className='text-[color:var(--ink)]'
      >
        fox<span style={{ color: 'var(--brand)' }}>ai</span>
      </span>
    </span>
  );
}