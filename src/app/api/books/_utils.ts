import { NextRequest, NextResponse } from 'next/server';

import { getAuthInfoFromCookie } from '@/lib/auth';
import { db } from '@/lib/db';
import { hasFeaturePermission } from '@/lib/permissions';

// Route reads request data — must run on the dynamic server, not at build time.
export const dynamic = 'force-dynamic';


export async function getAuthorizedBooksUsername(request: NextRequest): Promise<string | NextResponse> {
  const authInfo = getAuthInfoFromCookie(request);
  if (!authInfo?.username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (authInfo.username !== process.env.USERNAME) {
    const user = await db.getUserInfoV2(authInfo.username);
    if (!user || user.banned) {
      return NextResponse.json({ error: '用户不存在或已被封禁' }, { status: 401 });
    }
  }

  const allowed = await hasFeaturePermission(authInfo.username, 'books');
  if (!allowed) {
    return NextResponse.json({ error: '无权限访问电子书功能' }, { status: 403 });
  }

  return authInfo.username;
}
