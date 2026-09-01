import { NextRequest, NextResponse } from 'next/server';
import { getAuthInfoFromCookie } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateTvboxToken } from '@/lib/tvbox-token';

// Route reads request data — must run on the dynamic server, not at build time.
export const dynamic = 'force-dynamic';


export const runtime = 'nodejs';
// Route reads auth cookies via request.headers — must run dynamically.
/**
 * 获取用户的TVBox订阅token
 * 如果用户没有token，自动生成一个
 */
export async function GET(request: NextRequest) {
  try {
    // 验证用户登录
    const authInfo = getAuthInfoFromCookie(request);
    if (!authInfo?.username) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }
    const username = authInfo.username;
    // 获取token，如果没有则生成
    let token = await db.getTvboxSubscribeToken(username);
    if (!token) {
      // 懒加载：首次访问时生成token
      token = generateTvboxToken();
      await db.setTvboxSubscribeToken(username, token);
      console.log(`为用户 ${username} 生成TVBox订阅token`);
    }
    return NextResponse.json({ token });
  } catch (error) {
    console.error('获取TVBox订阅token失败:', error);
    return NextResponse.json(
      {
        error: '获取订阅token失败',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
