/* eslint-disable @typescript-eslint/no-explicit-any */
import { configSelfCheck } from '../config';

// 模拟"旧库"：上游时代初始化的配置（无 18+ 源、黄色过滤关闭=false=过滤开启）
function buildLegacyConfig() {
  return {
    ConfigSubscribtion: { URL: '', AutoUpdate: false, LastCheck: '' },
    ConfigFile: '',
    SiteConfig: {
      SiteName: 'MoonTVPlus',
      Announcement: '',
      SearchDownstreamMaxPage: 5,
      SiteInterfaceCacheTime: 7200,
      DoubanProxyType: 'direct',
      DoubanProxy: '',
      DoubanImageProxyType: 'direct',
      DoubanImageProxy: '',
      DisableYellowFilter: false,
      FluidSearch: true,
      DanmakuSourceType: 'builtin',
      DanmakuApiBase: 'https://example.com',
      DanmakuApiToken: '87654321',
    },
    UserConfig: { Users: [] },
    SourceConfig: [
      {
        key: 'dyttzy',
        name: '电影天堂资源',
        api: 'https://caiji.dyttzyapi.com/api.php/provide/vod',
        from: 'config',
        disabled: false,
      },
      // 管理员曾手动禁用的源,迁移不得改变其状态
      {
        key: 'bfzy',
        name: '暴风资源',
        api: 'https://bfzyapi.com/api.php/provide/vod',
        from: 'config',
        disabled: true,
      },
    ],
    CustomCategories: [],
    LiveConfig: [],
  } as any;
}

describe('foxai 一次性默认值迁移 (configSelfCheck)', () => {
  it('旧库补齐 18+ 片源并把限制级设为默认放行,同时打上标记', () => {
    const legacy = buildLegacyConfig();
    const migrated = configSelfCheck(legacy);

    // 限制级默认放行
    expect(migrated.SiteConfig.DisableYellowFilter).toBe(true);
    // 迁移标记
    expect(migrated.SiteConfig.AdultDefaultApplied).toBe(true);
    // 旧站名归一化为 foxai
    expect(migrated.SiteConfig.SiteName).toBe('foxai');
    // 18+ 源被补齐
    const keys = migrated.SourceConfig.map((s: any) => s.key);
    expect(keys).toContain('av91md');
    expect(keys).toContain('av155');
    expect(keys.filter((k: string) => k.startsWith('av')).length).toBe(19);
    // 只增不删:原有两个源仍在
    expect(keys).toContain('dyttzy');
    // 不动现有源状态:bfzy 仍为禁用
    expect(
      migrated.SourceConfig.find((s: any) => s.key === 'bfzy')?.disabled
    ).toBe(true);
  });

  it('已迁移过的配置不会重复迁移(管理员关闭限制级后保持关闭)', () => {
    const once = configSelfCheck(buildLegacyConfig());
    // 管理员后来关闭限制级
    once.SiteConfig.DisableYellowFilter = false;
    // 管理员删掉一个 18+ 源
    once.SourceConfig = once.SourceConfig.filter((s: any) => s.key !== 'av91md');

    const twice = configSelfCheck(once);
    expect(twice.SiteConfig.DisableYellowFilter).toBe(false); // 不再重置
    expect(twice.SourceConfig.map((s: any) => s.key)).not.toContain('av91md'); // 不再补回
  });
});
