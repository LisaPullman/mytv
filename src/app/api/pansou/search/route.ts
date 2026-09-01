/* eslint-disable @typescript-eslint/no-explicit-any,no-console */

import { NextRequest, NextResponse } from 'next/server';

import { requireFeaturePermission } from '@/lib/permissions';
import { getConfig } from '@/lib/config';
import { PansouLink, searchPansou } from '@/lib/pansou.client';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFeaturePermission(
      request,
      'netdisk_search',
      '无权限使用网盘搜索'
    );
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { keyword } = body;
    const cloudTypes = Array.isArray(body.cloud_types)
      ? body.cloud_types.filter(
          (item: unknown): item is string =>
            typeof item === 'string' && item.trim().length > 0
        )
      : undefined;

    if (!keyword) {
      return NextResponse.json({ error: '关键词不能为空' }, { status: 400 });
    }

    // 从系统配置中获取 Pansou 配置
    const config = await getConfig();
    const apiUrl = config.SiteConfig.PansouApiUrl;
    const username = config.SiteConfig.PansouUsername;
    const password = config.SiteConfig.PansouPassword;

    console.log('Pansou 搜索请求:', {
      keyword,
      apiUrl: apiUrl ? '已配置' : '未配置',
      hasAuth: !!(username && password),
      cloudTypes: cloudTypes?.length ? cloudTypes : 'all',
    });

    if (!apiUrl) {
      return NextResponse.json(
        {
          error:
            '未配置 Pansou API 地址。Pansou 为开源自托管网盘搜索服务（github.com/fish2018/pansou，Docker 一行部署：docker run -d -p 8888:8888 ghcr.io/fish2018/pansou:latest），部署后在 管理面板 → 站点设置 填写 API 地址，或在 Vercel 设置环境变量 PANSOU_API_URL（可配合 PANSOU_USERNAME / PANSOU_PASSWORD）。',
        },
        { status: 400 }
      );
    }

    // 调用 Pansou 搜索
    const results = await searchPansou(apiUrl, keyword, {
      username,
      password,
      cloudTypes,
    });

    const rawBlocklist = config.SiteConfig.PansouKeywordBlocklist || '';
    const normalizedBlocklist = rawBlocklist.replace(/，/g, ',');
    const blockedKeywords = normalizedBlocklist
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    let filteredResults = results;

    if (blockedKeywords.length > 0 && results.merged_by_type) {
      const mergedByType: Record<string, PansouLink[]> = {};
      let total = 0;

      const shouldBlock = (link: PansouLink) => {
        const content = `${link.note || ''} ${link.url || ''} ${
          link.source || ''
        }`.toLowerCase();
        return blockedKeywords.some((item) =>
          content.includes(item.toLowerCase())
        );
      };

      Object.entries(results.merged_by_type).forEach(([type, links]) => {
        const filteredLinks = links.filter((link) => !shouldBlock(link));
        if (filteredLinks.length > 0) {
          mergedByType[type] = filteredLinks;
          total += filteredLinks.length;
        }
      });

      filteredResults = {
        ...results,
        merged_by_type: mergedByType,
        total,
      };
    }

    console.log('Pansou 搜索结果:', {
      total: filteredResults.total,
      hasData: !!filteredResults.merged_by_type,
      types: filteredResults.merged_by_type
        ? Object.keys(filteredResults.merged_by_type)
        : [],
    });

    return NextResponse.json(filteredResults);
  } catch (error: any) {
    console.error('Pansou 搜索失败:', error);
    return NextResponse.json(
      { error: error.message || '搜索失败' },
      { status: 500 }
    );
  }
}
