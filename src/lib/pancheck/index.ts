/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  buildNetdiskCheckCacheKey,
  clearNetdiskCheckInflight,
  getCachedNetdiskCheckResult,
  getNetdiskCheckInflight,
  setCachedNetdiskCheckResult,
  setNetdiskCheckInflight,
} from './cache';
import type { NetdiskCheckPlatform, NetdiskCheckResult } from './types';

// eslint-disable-next-line no-eval
const nodeRequire = eval('require') as NodeRequire;

const RATE_LIMIT_REASON_PATTERNS = [/频率限制/i, /请求过快/i, /rate.?limit/i, /too many/i, /风控/i];

type RawCheckerResult = {
  valid?: boolean;
  reason?: string;
  isRateLimited?: boolean;
};

type CheckerModule = {
  [key: string]: (url: string) => Promise<RawCheckerResult>;
};

const PLATFORM_PATTERNS: Record<NetdiskCheckPlatform, RegExp[]> = {
  '115': [/115(?:cdn)?\.com\/s\//i, /anxia\.com\/s\//i],
  quark: [/pan\.quark\.cn\/s\//i, /pan\.qoark\.cn\/s\//i],
  aliyun: [/aliyundrive\.com\/s\//i, /alipan\.com\/s\//i],
  baidu: [/pan\.baidu\.com\/s\//i, /pan\.baidu\.com\/share\//i],
  tianyi: [/cloud\.189\.cn\/web\/share/i, /cloud\.189\.cn\/t\//i, /h5\.cloud\.189\.cn\/share/i],
  pan123: [/123(?:pan|684|685|912|592|865)\.(?:com|cn)\/s\//i],
  uc: [/drive\.uc\.cn\/s\//i, /yun\.uc\.cn\/s\//i],
  xunlei: [/pan\.xunlei\.com\/s\//i],
  cmcc: [/yun\.139\.com\/shareweb/i, /caiyun\.139\.com\/m\/i/i],
};

const CHECKER_EXPORTS: Record<NetdiskCheckPlatform, { modulePath: string; exportName: string }> = {
  '115': { modulePath: '@/lib/pancheck/vendor/checkers/pan115.js', exportName: 'check115' },
  aliyun: { modulePath: '@/lib/pancheck/vendor/checkers/aliyun.js', exportName: 'checkAliyun' },
  baidu: { modulePath: '@/lib/pancheck/vendor/checkers/baidu.js', exportName: 'checkBaidu' },
  cmcc: { modulePath: '@/lib/pancheck/vendor/checkers/cmcc.js', exportName: 'checkCMCC' },
  pan123: { modulePath: '@/lib/pancheck/vendor/checkers/pan123.js', exportName: 'check123' },
  quark: { modulePath: '@/lib/pancheck/vendor/checkers/quark.js', exportName: 'checkQuark' },
  tianyi: { modulePath: '@/lib/pancheck/vendor/checkers/tianyi.js', exportName: 'checkTianyi' },
  uc: { modulePath: '@/lib/pancheck/vendor/checkers/uc.js', exportName: 'checkUC' },
  xunlei: { modulePath: '@/lib/pancheck/vendor/checkers/xunlei.js', exportName: 'checkXunlei' },
};

const checkerFnCache = new Map<NetdiskCheckPlatform, (url: string) => Promise<RawCheckerResult>>();

function resolveModulePath(modulePath: string) {
  return modulePath.replace(/^@\//, `${process.cwd()}/src/`);
}

function getChecker(platform: NetdiskCheckPlatform) {
  const cached = checkerFnCache.get(platform);
  if (cached) return cached;
  const config = CHECKER_EXPORTS[platform];
  const mod = nodeRequire(resolveModulePath(config.modulePath)) as CheckerModule;
  const fn = mod[config.exportName];
  if (typeof fn !== 'function') {
    throw new Error(`未找到 ${platform} 检测器`);
  }
  checkerFnCache.set(platform, fn);
  return fn;
}

export function normalizeNetdiskCheckUrl(url: string) {
  return url.trim().replace(/\s+/g, '').replace(/\/+$/, '');
}

export function detectNetdiskCheckPlatform(url: string): NetdiskCheckPlatform | null {
  const normalized = normalizeNetdiskCheckUrl(url);
  for (const [platform, patterns] of Object.entries(PLATFORM_PATTERNS) as Array<[NetdiskCheckPlatform, RegExp[]]>) {
    if (patterns.some((pattern) => pattern.test(normalized))) return platform;
  }
  return null;
}

function isRateLimitedResult(result: RawCheckerResult) {
  if (result.isRateLimited) return true;
  const reason = String(result.reason || '');
  return RATE_LIMIT_REASON_PATTERNS.some((pattern) => pattern.test(reason));
}

function toFinalResult(
  platform: NetdiskCheckPlatform,
  url: string,
  normalizedUrl: string,
  raw: RawCheckerResult,
  durationMs: number
): NetdiskCheckResult {
  const checkedAt = Date.now();
  const rateLimited = isRateLimitedResult(raw);
  if (rateLimited) {
    return {
      platform,
      url,
      normalizedUrl,
      status: 'rate_limited',
      valid: null,
      reason: raw.reason || '检测受限',
      checkedAt,
      durationMs,
      isRateLimited: true,
    };
  }
  if (raw.valid === true) {
    return {
      platform,
      url,
      normalizedUrl,
      status: 'valid',
      valid: true,
      reason: raw.reason || '',
      checkedAt,
      durationMs,
    };
  }
  if (raw.valid === false) {
    return {
      platform,
      url,
      normalizedUrl,
      status: 'invalid',
      valid: false,
      reason: raw.reason || '链接无效',
      checkedAt,
      durationMs,
    };
  }
  return {
    platform,
    url,
    normalizedUrl,
    status: 'unknown',
    valid: null,
    reason: raw.reason || '无法确认链接状态',
    checkedAt,
    durationMs,
  };
}

export async function checkNetdiskLink(platform: NetdiskCheckPlatform, url: string): Promise<NetdiskCheckResult> {
  const normalizedUrl = normalizeNetdiskCheckUrl(url);
  const cacheKey = buildNetdiskCheckCacheKey(platform, normalizedUrl);
  const cached = getCachedNetdiskCheckResult(cacheKey);
  if (cached) return cached;

  const inflight = getNetdiskCheckInflight(cacheKey);
  if (inflight) return inflight;

  const runner = (async () => {
    const startedAt = Date.now();
    try {
      const checker = getChecker(platform);
      const raw = await checker(normalizedUrl);
      const finalResult = toFinalResult(platform, url, normalizedUrl, raw, Date.now() - startedAt);
      setCachedNetdiskCheckResult(cacheKey, finalResult);
      return finalResult;
    } catch (error) {
      const message = error instanceof Error ? error.message : '检测失败';
      const result: NetdiskCheckResult = {
        platform,
        url,
        normalizedUrl,
        status: 'unknown',
        valid: null,
        reason: message,
        checkedAt: Date.now(),
        durationMs: Date.now() - startedAt,
      };
      setCachedNetdiskCheckResult(cacheKey, result);
      return result;
    } finally {
      clearNetdiskCheckInflight(cacheKey);
    }
  })();

  setNetdiskCheckInflight(cacheKey, runner);
  return runner;
}
