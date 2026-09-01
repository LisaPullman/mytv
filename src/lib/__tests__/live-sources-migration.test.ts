/* eslint-disable @typescript-eslint/no-explicit-any */
import { configSelfCheck } from '../config';

// 模拟"带死链直播源"的旧库：4 个内置源上游已 404，vbskycn 的 EPG 也已失效
function buildLegacyConfigWithDeadLives() {
  return {
    ConfigSubscribtion: { URL: '', AutoUpdate: false, LastCheck: '' },
    ConfigFile: '',
    SiteConfig: {
      SiteName: 'foxai',
      Announcement: '',
      SearchDownstreamMaxPage: 5,
      SiteInterfaceCacheTime: 7200,
      DoubanProxyType: 'direct',
      DoubanProxy: '',
      DoubanImageProxyType: 'direct',
      DoubanImageProxy: '',
      DisableYellowFilter: true,
      AdultDefaultApplied: true, // 旧迁移已完成，不影响本次直播源迁移
      FluidSearch: true,
      DanmakuSourceType: 'builtin',
      DanmakuApiBase: 'https://example.com',
      DanmakuApiToken: '87654321',
    },
    UserConfig: { Users: [] },
    SourceConfig: [],
    CustomCategories: [],
    LiveConfig: [
      {
        key: 'iptv_vbskycn',
        name: 'VBSkyCN IPTV (自动更新)',
        url: 'https://raw.githubusercontent.com/vbskycn/iptv/master/tv/iptv4.txt',
        epg: 'https://raw.githubusercontent.com/vbskycn/iptv/master/epg/epg.xml.gz',
        channelNumber: 1200,
        from: 'config',
        disabled: false,
      },
      {
        key: 'iptv_yuanzl77',
        name: 'Yuanzl77 IPTV (每日更新)',
        url: 'https://raw.githubusercontent.com/yuanzl77/IPTV/main/latest.m3u',
        epg: 'https://raw.githubusercontent.com/yuanzl77/IPTV/main/epg.gz',
        channelNumber: 0,
        from: 'config',
        disabled: false,
      },
      {
        key: 'iptv_hacks',
        name: 'Hacks IPTV (4小时更新)',
        url: 'https://iptv.hacks.tools/live.m3u',
        epg: 'https://iptv.hacks.tools/epg.xml.gz',
        channelNumber: 0,
        from: 'config',
        disabled: true, // 管理员禁用过,但源已死,仍应移除
      },
      {
        // 管理员自定义源:恰好用了死链 key 但指向自己的地址,不得误删
        key: 'iptv_4k',
        name: '自建 4K 源',
        url: 'https://my-own.example.com/playlist.m3u',
        channelNumber: 66,
        from: 'custom',
        disabled: false,
      },
    ],
  } as any;
}

describe('2026-09 直播源修复迁移 (configSelfCheck)', () => {
  it('移除指向死链的内置源,补齐新增源,修复 vbskycn 的失效 EPG', () => {
    const migrated = configSelfCheck(buildLegacyConfigWithDeadLives());

    // 迁移标记
    expect(migrated.SiteConfig.LiveSourcesUpgraded202609).toBe(true);

    const keys = migrated.LiveConfig!.map((l: any) => l.key);
    // 死链源被移除(key+URL 双匹配)
    expect(keys).not.toContain('iptv_yuanzl77');
    expect(keys).not.toContain('iptv_hacks');
    // 管理员自建源(同名 key 但 URL 不同)保留
    const custom = migrated.LiveConfig!.find(
      (l: any) => l.key === 'iptv_4k'
    );
    expect(custom?.url).toBe('https://my-own.example.com/playlist.m3u');
    expect(custom?.channelNumber).toBe(66);
    // 新增源被补齐
    expect(keys).toContain('iptv_zilong');
    expect(keys).toContain('iptv_guovin');
    expect(keys).toContain('iptv_jiandantv');
    expect(keys).toContain('iptv_suxuang');
    // vbskycn 保留且 EPG 换为可用地址
    const vbskycn = migrated.LiveConfig!.find(
      (l: any) => l.key === 'iptv_vbskycn'
    );
    expect(vbskycn?.url).toBe(
      'https://raw.githubusercontent.com/vbskycn/iptv/master/tv/iptv4.txt'
    );
    expect(vbskycn?.epg).toBe('http://epg.51zmt.top:8000/e.xml');
  });

  it('已迁移过的配置不会重复执行(管理员删除新源后不被补回)', () => {
    const once = configSelfCheck(buildLegacyConfigWithDeadLives());
    // 管理员后来删掉一个新源
    once.LiveConfig = once.LiveConfig!.filter(
      (l: any) => l.key !== 'iptv_zilong'
    );

    const twice = configSelfCheck(once);
    expect(twice.LiveConfig!.map((l: any) => l.key)).not.toContain(
      'iptv_zilong'
    );
  });
});
