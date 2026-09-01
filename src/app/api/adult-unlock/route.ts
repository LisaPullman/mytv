/* eslint-disable @typescript-eslint/no-explicit-any, no-console */

import { NextRequest, NextResponse } from 'next/server';

import {
  ADULT_UNLOCK_COOKIE,
  getAdultLevel,
  getAdultUnlockToken,
  verifyAdultKey,
} from '@/lib/adult-access';
import { getAuthInfoFromCookie } from '@/lib/auth';

export const runtime = 'nodejs';

const UNLOCK_MAX_AGE = 60 * 60 * 24 * 30; // 30 天

// 查询当前限制级别
export async function GET(request: NextRequest) {
  const authInfo = getAuthInfoFromCookie(request);
  if (!authInfo || !authInfo.username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const level = await getAdultLevel(request);
  return NextResponse.json({ level, unlocked: level === 'adult' });
}

// 输入密钥解锁
export async function POST(request: NextRequest) {
  const authInfo = getAuthInfoFromCookie(request);
  if (!authInfo || !authInfo.username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let key: unknown = null;
  try {
    const body = await request.json();
    key = body?.key;
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 });
  }

  if (!verifyAdultKey(key)) {
    return NextResponse.json({ ok: false, error: '密钥错误' }, { status: 401 });
  }

  const token = await getAdultUnlockToken();
  const response = NextResponse.json({ ok: true, unlocked: true });
  response.cookies.set(ADULT_UNLOCK_COOKIE, token, {
    path: '/',
    maxAge: UNLOCK_MAX_AGE,
    sameSite: 'lax',
    httpOnly: true,
  });
  console.log('[AdultUnlock] 限制级已解锁');
  return response;
}

// 重新上锁（清除解锁 cookie；分级登录的等级由登录密码决定，不受影响）
export async function DELETE(request: NextRequest) {
  const authInfo = getAuthInfoFromCookie(request);
  if (!authInfo || !authInfo.username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true, unlocked: false });
  response.cookies.set(ADULT_UNLOCK_COOKIE, '', {
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
    httpOnly: true,
  });
  return response;
}
