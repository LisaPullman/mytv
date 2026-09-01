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
 * Every entry below was probed live (ac=videolist&pg=1 → JSON with a
 * non-empty vod list) before being added; dead endpoints get pruned on
 * each refresh. Sources marked "18+" are adult (R-rated) providers —
 * search results from them are gated by the site's 黄色过滤 switch
 * (SiteConfig.DisableYellowFilter) and can be disabled per-source in the
 * admin panel or per-user via source selection.
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
  // ---- 影视资源（普通） ----
  { key: 'dyttzy',     name: '电影天堂资源', api: 'https://caiji.dyttzyapi.com/api.php/provide/vod',   detail: 'https://caiji.dyttzyapi.com' },
  { key: 'heimuer',    name: '黑木耳资源',   api: 'https://json.heimuer.xyz/api.php/provide/vod',      detail: 'https://json.heimuer.xyz' },
  { key: 'bfzy',       name: '暴风资源',     api: 'https://bfzyapi.com/api.php/provide/vod',           detail: 'https://bfzyapi.com' },
  { key: 'ffzy',       name: '非凡资源',     api: 'https://cj.ffzyapi.com/api.php/provide/vod',        detail: 'https://cj.ffzyapi.com' },
  { key: 'tyyszy',     name: '天涯资源',     api: 'https://tyyszy.com/api.php/provide/vod',            detail: 'https://tyyszy.com' },
  { key: 'jisu',       name: '极速资源',     api: 'https://jszyapi.com/api.php/provide/vod',           detail: 'https://jszyapi.com' },
  { key: 'zy360',      name: '360 资源',     api: 'https://360zy.com/api.php/provide/vod',             detail: 'https://360zy.com' },
  { key: 'ruyi',       name: '如意资源',     api: 'https://cj.rycjapi.com/api.php/provide/vod',        detail: 'https://cj.rycjapi.com' },
  { key: 'lzi',        name: '量子点播',     api: 'https://cj.lziapi.com/api.php/provide/vod',         detail: 'https://cj.lziapi.com' },
  { key: 'lzizy',      name: '量子资源',     api: 'https://lzizy.com/api.php/provide/vod',             detail: 'https://lzizy.com' },
  { key: 'suonizy',    name: '索尼资源',     api: 'https://suonizy.net/api.php/provide/vod',           detail: 'https://suonizy.net' },
  { key: 'suoni',      name: '索尼点播',     api: 'https://suoniapi.com/api.php/provide/vod',          detail: 'https://suoniapi.com' },
  { key: 'guangsu',    name: '光速资源',     api: 'https://api.guangsuapi.com/api.php/provide/vod',    detail: 'https://api.guangsuapi.com' },
  { key: 'wujinapi',   name: '无尽资源',     api: 'https://api.wujinapi.me/api.php/provide/vod',       detail: 'https://api.wujinapi.me' },
  { key: 'hongniu',    name: '红牛资源',     api: 'https://www.hongniuzy2.com/api.php/provide/vod',    detail: 'https://www.hongniuzy2.com' },
  { key: 'okzyw',      name: 'OK 资源',      api: 'https://okzyw.cc/api.php/provide/vod',              detail: 'https://okzyw.cc' },
  { key: 'zuid',       name: '最大资源',     api: 'https://api.zuidapi.com/api.php/provide/vod',       detail: 'https://api.zuidapi.com' },
  { key: 'dbzy',       name: '豆瓣资源',     api: 'https://dbzy.tv/api.php/provide/vod',               detail: 'https://dbzy.tv' },
  { key: 'baiduyun',   name: '百度云资源',   api: 'https://api.apibdzy.com/api.php/provide/vod',       detail: 'https://api.apibdzy.com' },
  { key: 'hhzy',       name: '豪华资源',     api: 'https://hhzyapi.com/api.php/provide/vod',           detail: 'https://hhzyapi.com' },
  { key: 'jyzy',       name: '金鹰资源',     api: 'https://jyzyapi.com/api.php/provide/vod',           detail: 'https://jyzyapi.com' },
  { key: 'jinying',    name: '金鹰点播',     api: 'https://jinyingzy.com/api.php/provide/vod',         detail: 'https://jinyingzy.com' },
  { key: 'yayazy',     name: '丫丫资源',     api: 'https://cj.yayazy.net/api.php/provide/vod',         detail: 'https://cj.yayazy.net' },
  { key: 'yinghua',    name: '樱花资源',     api: 'https://m3u8.apiyhzy.com/api.php/provide/vod',      detail: 'https://m3u8.apiyhzy.com' },
  { key: 'moduzy',     name: '魔都资源',     api: 'https://www.moduzy.com/api.php/provide/vod',        detail: 'https://www.moduzy.com' },
  { key: 'mdzy',       name: '魔都点播',     api: 'https://www.mdzyapi.com/api.php/provide/vod',       detail: 'https://www.mdzyapi.com' },
  { key: 'modudm',     name: '魔都动漫',     api: 'https://caiji.moduapi.cc/api.php/provide/vod',      detail: 'https://caiji.moduapi.cc' },
  { key: 'ikunzy',     name: 'ikun 资源',    api: 'https://ikunzy.com/api.php/provide/vod',            detail: 'https://ikunzy.com' },
  { key: 'ikuncj',     name: 'ikun 点播',    api: 'https://ikunzyapi.com/api.php/provide/vod',         detail: 'https://ikunzyapi.com' },
  { key: 'uku',        name: 'U酷资源',      api: 'https://api.ukuapi88.com/api.php/provide/vod',      detail: 'https://api.ukuapi88.com' },
  { key: 'niuniuzy',   name: '牛牛资源',     api: 'https://api.niuniuzy.me/api.php/provide/vod',       detail: 'https://api.niuniuzy.me' },
  { key: 'subo',       name: '速博资源',     api: 'https://subocaiji.com/api.php/provide/vod',         detail: 'https://subocaiji.com' },
  { key: 'shandianzy', name: '闪电资源',     api: 'https://shandianzy.com/api.php/provide/vod',        detail: 'https://shandianzy.com' },
  { key: 'sdzy',       name: '闪电点播',     api: 'https://sdzyapi.com/api.php/provide/vod',           detail: 'https://sdzyapi.com' },
  { key: 'maotaizy',   name: '茅台资源',     api: 'https://maotaizy.com/api.php/provide/vod',          detail: 'https://maotaizy.com' },
  { key: 'maotaicj',   name: '茅台点播',     api: 'https://caiji.maotaizy.cc/api.php/provide/vod',     detail: 'https://caiji.maotaizy.cc' },
  { key: 'huya',       name: '虎牙资源',     api: 'https://www.huyaapi.com/api.php/provide/vod',       detail: 'https://www.huyaapi.com' },
  { key: 'zy1080',     name: '1080 资源',    api: 'https://api.1080zyku.com/inc/api_mac10.php',        detail: 'https://api.1080zyku.com' },
  { key: 'xinlangcj',  name: '新浪点播',     api: 'https://api.xinlangapi.com/xinlangapi.php/provide/vod', detail: 'https://api.xinlangapi.com' },
  { key: 'piaoling',   name: '飘零资源',     api: 'https://p2100.net/api.php/provide/vod',             detail: 'https://p2100.net' },

  // ---- 限制级（18+，默认受黄色过滤约束，可在管理面板单独禁用） ----
  { key: 'av155',      name: '18+ 155资源',     api: 'https://155api.com/api.php/provide/vod',          detail: 'https://155api.com' },
  { key: 'av91md',     name: '18+ 91麻豆',      api: 'https://91md.me/api.php/provide/vod',             detail: 'https://91md.me' },
  { key: 'avjkun',     name: '18+ JKUN资源',    api: 'https://jkunzyapi.com/api.php/provide/vod',       detail: 'https://jkunzyapi.com' },
  { key: 'avleb',      name: '18+ 乐播资源',    api: 'https://lbapi9.com/api.php/provide/vod',          detail: 'https://lbapi9.com' },
  { key: 'avaosika',   name: '18+ 奥斯卡资源',  api: 'https://aosikazy.com/api.php/provide/vod',        detail: 'https://aosikazy.com' },
  { key: 'avnaixx',    name: '18+ 奶香资源',    api: 'https://naixxzy.com/api.php/provide/vod',         detail: 'https://naixxzy.com' },
  { key: 'avsenlin',   name: '18+ 森林资源',    api: 'https://slapibf.com/api.php/provide/vod',         detail: 'https://slapibf.com' },
  { key: 'avyutu',     name: '18+ 玉兔资源',    api: 'https://apiyutu.com/api.php/provide/vod',         detail: 'https://apiyutu.com' },
  { key: 'avfanhao',   name: '18+ 番号资源',    api: 'https://fhapi9.com/api.php/provide/vod',          detail: 'https://fhapi9.com' },
  { key: 'avjingpin',  name: '18+ 精品资源',    api: 'https://www.jingpinx.com/api.php/provide/vod',    detail: 'https://www.jingpinx.com' },
  { key: 'avlsb',      name: '18+ 老色逼资源',  api: 'https://apilsbzy1.com/api.php/provide/vod',       detail: 'https://apilsbzy1.com' },
  { key: 'avshayu',    name: '18+ 鲨鱼资源',    api: 'https://shayuapi.com/api.php/provide/vod',        detail: 'https://shayuapi.com' },
  { key: 'avsouav',    name: '18+ SouAV资源',   api: 'https://api.souavzy.vip/api.php/provide/vod',     detail: 'https://api.souavzy.vip' },
  { key: 'avlajiao',   name: '18+ 辣椒资源',    api: 'https://apilj.com/api.php/provide/vod',           detail: 'https://apilj.com' },
  { key: 'avyinshuiji',name: '18+ 淫水机资源',  api: 'https://www.xrbsp.com/api/json.php',              detail: 'https://www.xrbsp.com' },
  { key: 'avbaipiao',  name: '18+ 白嫖资源',    api: 'https://www.kxgav.com/api/json.php',              detail: 'https://www.kxgav.com' },
  { key: 'avmeishaonv',name: '18+ 美少女资源',  api: 'https://www.msnii.com/api/json.php',              detail: 'https://www.msnii.com' },
  { key: 'avhuang',    name: '18+ 黄AV资源',    api: 'https://www.pgxdy.com/api/json.php',              detail: 'https://www.pgxdy.com' },
  { key: 'avxiangnai', name: '18+ 香奶儿资源',  api: 'https://www.gdlsp.com/api/json.php',              detail: 'https://www.gdlsp.com' },
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
