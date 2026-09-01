/* eslint-disable @typescript-eslint/no-explicit-any */
// 仓库已无默认密钥,单测注入测试专用值
process.env.ADULT_KEY = 'unit-test-adult-key';

import {
  getAdultUnlockToken,
  hasAdultUnlockCookie,
  isAdultSource,
  verifyAdultKey,
} from '../adult-access';
import { ADULT_UNLOCK_COOKIE } from '../adult-access';

describe('foxai 限制级访问控制 (adult-access)', () => {
  it('识别 18+ 片源：av 前缀 key 或 18+ 前缀名称', () => {
    expect(isAdultSource('av91md', '18+ 91麻豆')).toBe(true);
    expect(isAdultSource('av155', '18+ 155资源')).toBe(true);
    expect(isAdultSource('custom_x', '18+ 自定义源')).toBe(true); // 名称标识
    expect(isAdultSource('dyttzy', '电影天堂资源')).toBe(false);
    expect(isAdultSource('avyutu')).toBe(true); // 仅 key 也生效
    expect(isAdultSource('dyttzy')).toBe(false);
  });

  it('密钥校验：仅正确的 ADULT_KEY 通过', () => {
    expect(verifyAdultKey('unit-test-adult-key')).toBe(true);
    expect(verifyAdultKey(undefined)).toBe(false);
    expect(verifyAdultKey('')).toBe(false);
    expect(verifyAdultKey('wrong')).toBe(false);
    expect(verifyAdultKey('20200108')).toBe(false); // 不与普通密码互通
  });

  it('解锁 cookie：签名 token 可被校验,伪造 token 拒绝', async () => {
    // 轻量 stub:hasAdultUnlockCookie 只依赖 request.headers.get('cookie')
    const mkReq = (cookie?: string) =>
      ({
        headers: {
          get: (name: string) =>
            name.toLowerCase() === 'cookie' ? cookie ?? null : null,
        },
      } as any);

    const token = await getAdultUnlockToken();
    await expect(
      hasAdultUnlockCookie(mkReq(`${ADULT_UNLOCK_COOKIE}=${token}`))
    ).resolves.toBe(true);
    // 多 cookie 场景
    await expect(
      hasAdultUnlockCookie(mkReq(`a=1; ${ADULT_UNLOCK_COOKIE}=${token}; b=2`))
    ).resolves.toBe(true);
    await expect(
      hasAdultUnlockCookie(mkReq(`${ADULT_UNLOCK_COOKIE}=deadbeef`))
    ).resolves.toBe(false);
    await expect(hasAdultUnlockCookie(mkReq(undefined))).resolves.toBe(false);
  });
});
