'use client';

import Link from 'next/link';

import { BackButton } from './BackButton';
import { useSite } from './SiteProvider';
import { ThemeToggle } from './ThemeToggle';
import { UpdateNotification } from './UpdateNotification';
import { UserMenu } from './UserMenu';

interface MobileHeaderProps {
  showBackButton?: boolean;
}

const MobileHeader = ({ showBackButton = false }: MobileHeaderProps) => {
  const { siteName } = useSite();
  return (
    <header className='glass md:hidden fixed top-0 left-0 right-0 z-[999] w-full edge-highlight'>
      <div className='h-12 flex items-center justify-between px-4'>
        {/* 左侧：搜索按钮、返回按钮和设置按钮 */}
        <div className='flex items-center gap-2'>
          <Link
            href='/search'
            prefetch={false}
            className='w-10 h-10 p-2 rounded-full flex items-center justify-center text-[color:var(--ink-soft)] hover:bg-[color:var(--brand-muted)] transition-colors'
          >
            <svg
              className='w-full h-full'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
              />
            </svg>
          </Link>
          {showBackButton && <BackButton />}
        </div>

        {/* 右侧按钮 */}
        <div className='flex items-center gap-2'>
          <ThemeToggle />
          <UserMenu />
          <UpdateNotification />
        </div>
      </div>

      {/* 中间：f.foxai Logo（绝对居中） */}
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'>
        <Link
          href='/'
          prefetch={false}
          className='group inline-flex items-center gap-1.5'
          aria-label={siteName || 'f.foxai'}
        >
          <span
            className='inline-flex items-center justify-center rounded-lg p-1 transition-transform duration-300 group-hover:scale-105'
            style={{
              background:
                'linear-gradient(135deg, color-mix(in oklch, var(--brand) 20%, transparent), color-mix(in oklch, var(--brand) 4%, transparent))',
              border: '1px solid color-mix(in oklch, var(--brand) 30%, transparent)',
              boxShadow: '0 0 14px -4px var(--brand-glow)',
            }}
          >
            <svg
              width='18'
              height='18'
              viewBox='0 0 64 64'
              aria-hidden='true'
              className='text-[color:var(--brand)]'
            >
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
              <circle cx='49' cy='9' r='5.5' fill='currentColor' />
            </svg>
          </span>
          <span
            className='inline-flex items-baseline gap-0.5 text-[17px] font-semibold tracking-tight'
            style={{ letterSpacing: '-0.01em', color: 'var(--ink)' }}
          >
            <span>f</span>
            <span
              aria-hidden='true'
              className='text-[color:var(--ink-soft)] font-light'
            >
              .
            </span>
            <span>
              fox<span style={{ color: 'var(--brand)' }}>ai</span>
            </span>
          </span>
        </Link>
      </div>
    </header>
  );
};

export default MobileHeader;
