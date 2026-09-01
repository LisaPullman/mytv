/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * foxai 限制级（18+）分级访问控制。
 *
 * 两级账户模型：
 *   standard —— 用普通站点密码（PASSWORD）登录，或未解锁：18+ 片源不参与
 *               搜索/聚合，且内容分类过滤始终生效。
 *   adult    —— 用限制级密钥（ADULT_KEY）登录（分级登录），或登录后在
 *               搜索页用密钥解锁（签名 cookie）：18+ 片源正常参与。
 *
 * 判定优先级：auth cookie 内嵌密码 === ADULT_KEY → adult；否则校验
 * adult_unlock 签名 cookie → adult；其余 standard。
 *
 * 密钥不进入客户端 bundle：仅服务端（API 路由 / middleware）引用。
 */

import { getAuthInfoFromCookie } from './auth';

export const ADULT_UNLOCK_COOKIE = 'adult_unlock';
const ADULT_TOKEN_PAYLOAD = 'foxai-adult-unlock-v1';

/** 限制级密钥（可用环境变量 ADULT_KEY 覆盖，默认值见 next.config.js） */
export function getAdultKey(): string {
  return process.env.ADULT_KEY || '19821021';
}

/** 是否为 18+ 片源：key 以 av 开头，或名称以 “18+” 前缀标识 */
export function isAdultSource(key: string, name?: string): boolean {
  return key.startsWith('av') || (name ? name.trim().startsWith('18+') : false);
}

async function hmacHex(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** 解锁 cookie 的签名 token：HMAC(固定 payload, ADULT_KEY) */
export async function getAdultUnlockToken(): Promise<string> {
  return hmacHex(ADULT_TOKEN_PAYLOAD, getAdultKey());
}

/** 校验用户输入的密钥 */
export function verifyAdultKey(key: unknown): boolean {
  return typeof key === 'string' && key.length > 0 && key === getAdultKey();
}

function readCookie(request: Request, name: string): string | null {
  const cookies = request.headers.get('cookie') || '';
  const m = cookies.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

/** 是否持有效解锁 cookie */
export async function hasAdultUnlockCookie(request: Request): Promise<boolean> {
  const token = readCookie(request, ADULT_UNLOCK_COOKIE);
  if (!token) return false;
  try {
    return token === (await getAdultUnlockToken());
  } catch {
    return false;
  }
}

/**
 * 当前请求的限制级别。auth cookie（localStorage 模式内嵌密码）优先，
 * 其次解锁 cookie（数据库多用户模式下的按设备解锁）。
 */
export async function getAdultLevel(
  request: Request
): Promise<'standard' | 'adult'> {
  try {
    const authInfo = getAuthInfoFromCookie(request as any) as any;
    const password = authInfo?.password;
    if (password && password === getAdultKey()) {
      return 'adult';
    }
  } catch {
    // auth cookie 缺失或解析失败不视为错误，继续看解锁 cookie
  }
  if (await hasAdultUnlockCookie(request)) {
    return 'adult';
  }
  return 'standard';
}
