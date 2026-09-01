/* eslint-disable no-console */

import { NextRequest, NextResponse } from 'next/server';

import { getAdultLevel, isAdultSource } from '@/lib/adult-access';
import { getAvailableApiSites } from '@/lib/config';
import { listEnabledSourceScripts } from '@/lib/source-script';

export const runtime = 'nodejs';

// OrionTV 兼容接口
export async function GET(request: NextRequest) {
  console.log('request', request.url);
  try {
    // foxai 分级访问：非 adult 级别时 18+ 片源不出现在资源列表
    const adultLevel = await getAdultLevel(request);
    const apiSites = (await getAvailableApiSites()).filter(
      (site) => adultLevel === 'adult' || !isAdultSource(site.key, site.name)
    );
    const scriptSites = (await listEnabledSourceScripts()).map((item) => ({
      key: item.key,
      name: item.name,
      script: true,
    }));

    return NextResponse.json([...apiSites, ...scriptSites]);
  } catch (error) {
    return NextResponse.json({ error: '获取资源失败' }, { status: 500 });
  }
}
