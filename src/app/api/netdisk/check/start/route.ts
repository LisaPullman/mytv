import { NextRequest, NextResponse } from 'next/server';

import { requireFeaturePermission } from '@/lib/permissions';
import {
  assertNetdiskCheckPlatform,
  getNetdiskCheckCooldownRemainingMs,
  startNetdiskCheckTask,
} from '@/lib/netdisk-check-task';

// Route reads request data — must run on the dynamic server, not at build time.
export const dynamic = 'force-dynamic';


export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFeaturePermission(
      request,
      'netdisk_search',
      '无权限使用网盘有效性检测'
    );
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const platform = assertNetdiskCheckPlatform(String(body?.platform || ''));
    const links = Array.isArray(body?.links)
      ? body.links.map((item: unknown) => String(item || ''))
      : [];
    const task = startNetdiskCheckTask({ platform, links });
    return NextResponse.json({
      taskId: task.id,
      task,
      cooldownRemainingMs: getNetdiskCheckCooldownRemainingMs(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '启动检测任务失败' },
      { status: 400 }
    );
  }
}
