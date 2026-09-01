/**
 * foxai — built-in default source registry.
 *
 * Used as a fallback when no INIT_CONFIG / CONFIG_SUBSCRIPTION_URL is set,
 * so that a fresh deployment has reasonable defaults out of the box rather
 * than landing on an empty admin panel.
 *
 * All endpoints follow the standard maccms V10 vod API format:
 *   GET {api}?ac=videolist&wd={keyword}&pg={page}
 *   GET {api}?ac=videolist&ids={id}
 *
 * Sources here are public maccms-compatible JSON endpoints commonly used
 * by community-aggregated players. Operators can disable any of them from
 * the admin panel, or replace the entire list via INIT_CONFIG.
 */
export interface DefaultApiSite {
  key: string;
  api: string;
  name: string;
  detail: string;
}

export interface DefaultLiveSource {
  key: string;
  name: string;
  url: string;
  epg?: string;
}

export const DEFAULT_API_SITES: DefaultApiSite[] = [
  { key: 'dyttzy',     name: '电影天堂资源', api: 'https://caiji.dyttzyapi.com/api.php/provide/vod', detail: 'https://caiji.dyttzyapi.com' },
  { key: 'suonizy',    name: '索尼资源',     api: 'https://suonizy.net/api.php/provide/vod',         detail: 'https://suonizy.net' },
  { key: 'okzyw',      name: 'OK 资源',      api: 'https://okzyw.cc/api.php/provide/vod',            detail: 'https://okzyw.cc' },
  { key: 'hongniuzy',  name: '红牛资源',     api: 'https://www.hongniuzy.com/api.php/provide/vod',   detail: 'https://www.hongniuzy.com' },
  { key: 'wujinzy',    name: '无尽资源',     api: 'https://www.wujinzy.com/api.php/provide/vod',     detail: 'https://www.wujinzy.com' },
  { key: 'wolongzy',   name: '卧龙资源',     api: 'https://wolongzy.cc/api.php/provide/vod',         detail: 'https://wolongzy.cc' },
  { key: 'bfzy',       name: '暴风资源',     api: 'https://bfzy.tv/api.php/provide/vod',             detail: 'https://bfzy.tv' },
  { key: 'taopianzy',  name: '淘片资源',     api: 'https://taopianapi.com/api.php/provide/vod',      detail: 'https://taopianapi.com' },
  { key: 'gszy',       name: '光速资源',     api: 'https://gszyapi.com/api.php/provide/vod',         detail: 'https://gszyapi.com' },
  { key: 'zuidazy',    name: '最大资源',     api: 'https://zuidazy.net/api.php/provide/vod',         detail: 'https://zuidazy.net' },
  { key: 'subozy',     name: '速播资源',     api: 'https://suboapi.com/api.php/provide/vod',         detail: 'https://suboapi.com' },
  { key: 'hhzy',       name: '豪华资源',     api: 'https://hhzyapi.com/api.php/provide/vod',         detail: 'https://hhzyapi.com' },
  { key: 'jyzy',       name: '金鹰资源',     api: 'https://jyzyapi.com/api.php/provide/vod',         detail: 'https://jyzyapi.com' },
  { key: 'yhzzy',      name: '樱花资源',     api: 'https://www.yhzzy.com/api.php/provide/vod',       detail: 'https://www.yhzzy.com' },
  { key: 'yingmizy',   name: '影迷资源',     api: 'https://www.yingmizy.com/api.php/provide/vod',    detail: 'https://www.yingmizy.com' },
  { key: 'bbgzy',      name: '步步高资源',   api: 'https://www.bbgzy.com/api.php/provide/vod',       detail: 'https://www.bbgzy.com' },
  { key: 'ikunzy',     name: 'ikun 资源',    api: 'https://ikunzy.com/api.php/provide/vod',          detail: 'https://ikunzy.com' },
  { key: 'uku',        name: 'U酷资源',      api: 'https://ukuapi.com/api.php/provide/vod',          detail: 'https://ukuapi.com' },
  { key: 'lzizy',      name: '量子资源',     api: 'https://lzizy.com/api.php/provide/vod',           detail: 'https://lzizy.com' },
  { key: 'heimazy',    name: '黑猫资源',     api: 'https://heimazy.com/api.php/provide/vod',         detail: 'https://heimazy.com' },
  { key: 'wnzy',       name: '万能资源',     api: 'https://www.wnzy.com/api.php/provide/vod',        detail: 'https://www.wnzy.com' },
  { key: 'moduzy',     name: '魔都资源',     api: 'https://www.moduzy.com/api.php/provide/vod',      detail: 'https://www.moduzy.com' },
  { key: 'niunizy',    name: '牛牛资源',     api: 'https://niunizy.com/api.php/provide/vod',         detail: 'https://niunizy.com' },
  { key: 'dbzy',       name: '豆瓣资源',     api: 'https://dbzy.com/api.php/provide/vod',            detail: 'https://dbzy.com' },
  { key: '178zy',      name: '178 资源',     api: 'https://178zy.com/api.php/provide/vod',           detail: 'https://178zy.com' },
  { key: '133zy',      name: '133 资源',     api: 'https://133zy.com/api.php/provide/vod',           detail: 'https://133zy.com' },
  { key: 'kuaiboz',    name: '快播云',       api: 'https://www.kuaibozy.com/api.php/provide/vod',    detail: 'https://www.kuaibozy.com' },
  { key: 'ffzy',       name: '非凡资源',     api: 'https://svip.ffzyapi.com/api.php/provide/vod',    detail: 'https://svip.ffzyapi.com' },
  { key: 'xiuseapi',   name: '秀色资源',     api: 'https://api.xiuseapi.com/api.php/provide/vod',    detail: 'https://api.xiuseapi.com' },
  { key: 'feinizy',    name: '飞你资源',     api: 'https://feinizy.com/api.php/provide/vod',         detail: 'https://feinizy.com' },
  { key: 'xinlangzy',  name: '新浪资源',     api: 'https://xinlangzy.com/api.php/provide/vod',       detail: 'https://xinlangzy.com' },
  { key: 'qqzy',       name: 'QQ 资源',      api: 'https://qqzy.com/api.php/provide/vod',            detail: 'https://qqzy.com' },
  { key: 'tomzy',      name: 'Tom 资源',     api: 'https://tomzy.com/api.php/provide/vod',           detail: 'https://tomzy.com' },
  { key: 'maotaizy',   name: '茅台资源',     api: 'https://maotaizy.com/api.php/provide/vod',        detail: 'https://maotaizy.com' },
  { key: 'shandianzy', name: '闪电资源',     api: 'https://shandianzy.com/api.php/provide/vod',      detail: 'https://shandianzy.com' },
  { key: 'ckzy',       name: 'CK 资源',      api: 'https://ckzy.com/api.php/provide/vod',            detail: 'https://ckzy.com' },
];

export const DEFAULT_LIVE_SOURCES: DefaultLiveSource[] = [
  {
    key: 'iptv_vbskycn',
    name: 'VBSkyCN IPTV (自动更新)',
    url: 'https://raw.githubusercontent.com/vbskycn/iptv/master/tv/iptv4.txt',
    epg: 'https://raw.githubusercontent.com/vbskycn/iptv/master/epg/epg.xml.gz',
  },
  {
    key: 'iptv_yuanzl77',
    name: 'Yuanzl77 IPTV (每日更新)',
    url: 'https://raw.githubusercontent.com/yuanzl77/IPTV/main/latest.m3u',
    epg: 'https://raw.githubusercontent.com/yuanzl77/IPTV/main/epg.gz',
  },
  {
    key: 'iptv_hacks',
    name: 'Hacks IPTV (4小时更新)',
    url: 'https://iptv.hacks.tools/live.m3u',
    epg: 'https://iptv.hacks.tools/epg.xml.gz',
  },
  {
    key: 'iptv_awesome',
    name: 'Tvlist-awesome-m3u-m3u8 国内',
    url: 'https://raw.githubusercontent.com/imDazui/Tvlist-awesome-m3u-m3u8/master/m3u/%E5%9B%BD%E5%86%85%E7%94%B5%E8%A7%86%E5%8F%B02023.m3u8',
  },
  {
    key: 'iptv_4k',
    name: '4K-IPTV-M3U (按省份)',
    url: 'https://raw.githubusercontent.com/jia070310/4K-IPTV-M3U/main/output/playlist.m3u',
  },
  {
    key: 'iptv_dongyubin',
    name: 'Dongyubin IPTV (体育/卫视)',
    url: 'https://raw.githubusercontent.com/dongyubin/IPTV/main/iptv.m3u8',
  },
];

/**
 * Build a JSON string suitable for INIT_CONFIG that contains every default
 * source. Callers can serialise this and feed it into the env var when they
 * want to seed a fresh deployment.
 */
export function buildDefaultConfigJson(): string {
  const apiSite: Record<string, { api: string; name: string; detail: string }> = {};
  for (const s of DEFAULT_API_SITES) {
    apiSite[s.key] = { api: s.api, name: s.name, detail: s.detail };
  }
  const lives: Record<string, { name: string; url: string; epg?: string }> = {};
  for (const l of DEFAULT_LIVE_SOURCES) {
    lives[l.key] = { name: l.name, url: l.url, ...(l.epg ? { epg: l.epg } : {}) };
  }
  return JSON.stringify(
    {
      cache_time: 7200,
      api_site: apiSite,
      custom_category: [
        { name: '华语',     type: 'movie', query: '华语' },
        { name: '欧美',     type: 'movie', query: '欧美' },
        { name: '韩国',     type: 'movie', query: '韩国' },
        { name: '日本',     type: 'movie', query: '日本' },
        { name: '豆瓣高分', type: 'movie', query: '豆瓣高分' },
        { name: '动作',     type: 'movie', query: '动作' },
        { name: '喜剧',     type: 'movie', query: '喜剧' },
        { name: '科幻',     type: 'movie', query: '科幻' },
        { name: '悬疑',     type: 'movie', query: '悬疑' },
        { name: '恐怖',     type: 'movie', query: '恐怖' },
        { name: '治愈',     type: 'movie', query: '治愈' },
        { name: '美剧',     type: 'tv',    query: '美剧' },
        { name: '英剧',     type: 'tv',    query: '英剧' },
        { name: '韩剧',     type: 'tv',    query: '韩剧' },
        { name: '日剧',     type: 'tv',    query: '日剧' },
        { name: '国产剧',   type: 'tv',    query: '国产剧' },
        { name: '港剧',     type: 'tv',    query: '港剧' },
        { name: '日本动画', type: 'tv',    query: '日本动画' },
        { name: '综艺',     type: 'tv',    query: '综艺' },
        { name: '纪录片',   type: 'tv',    query: '纪录片' },
      ],
      lives,
    },
    null,
    2
  );
}