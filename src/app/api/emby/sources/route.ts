import { NextRequest, NextResponse } from 'next/server';
import { embyManager } from '@/lib/emby-manager';
import { requireFeaturePermission } from '@/lib/permissions';

// Route reads request data — must run on the dynamic server, not at build time.
export const dynamic = 'force-dynamic';

export const runtime = 'nodejs';

/**
 * 获取所有启用的Emby源列表
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFeaturePermission(request, 'emby', '无权限访问 Emby');
    if (authResult instanceof NextResponse) return authResult;
    const sources = await embyManager.getEnabledSources();
    return NextResponse.json({
      sources: sources.map(s => ({
        key: s.key,
        name: s.name,
      })),
    });
  } catch (error) {
    console.error('[Emby Sources] 获取Emby源列表失败:', error);
    return NextResponse.json(
      { error: '获取Emby源列表失败', sources: [] },
      { status: 500 }
    );
  }
}
