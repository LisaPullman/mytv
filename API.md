# foxai API 文档

> 面向二次开发 / 外部工具集成 / 自动化调用的 HTTP API 梳理。
> 所有接口由 Next.js App Router 提供，基地址为你的部署域名（如 `https://your-app.vercel.app`）。
> 路径均以 `/api` 开头；除特别说明外均为 JSON 响应、`nodejs` runtime。

---

## 目录

- [快速开始：如何获取 API 访问权限](#快速开始如何获取-api-访问权限)
- [认证机制详解](#认证机制详解)
- [核心体验 API](#核心体验-api)
  - [认证与账户](#认证与账户) · [搜索与详情](#搜索与详情) · [电视直播](#电视直播) · [豆瓣发现](#豆瓣发现) · [个人数据](#个人数据) · [弹幕](#弹幕) · [TMDB / 番剧](#tmdb--番剧) · [读书 / 漫画 / 音乐 / 短剧](#读书--漫画--音乐--短剧) · [网盘与私人影库](#网盘与私人影库) · [通知与求片](#通知与求片)
- [播放代理 API](#播放代理-api)
- [外部工具集成 API（TVBox / OrionTV / CMS / 定时任务）](#外部工具集成-apitvbox--oriontv--cms--定时任务)
- [管理端 API 概览](#管理端-api-概览)
- [外部服务预配置：哪些 API 可以配在 Vercel 环境变量里](#外部服务预配置哪些-api-可以配在-vercel-环境变量里)

---

## 快速开始：如何获取 API 访问权限

foxai 的绝大多数 API 需要**登录态**。获取方式是调用登录接口，拿到 `auth` 凭据后以 Cookie 或 Header 携带。

### 1. 登录拿凭据

```bash
# localstorage 模式（默认，单密码进站）
curl -c cookies.txt -X POST https://your-app.vercel.app/api/login \
  -H "Content-Type: application/json" \
  -d '{"password": "你的PASSWORD"}'

# 数据库多用户模式
curl -c cookies.txt -X POST https://your-app.vercel.app/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "用户名", "password": "密码"}'
```

返回 `{ "ok": true, "token": "...", "auth": { "role": "owner", "username": "..." } }`，同时 `Set-Cookie` 下发 `auth`（有效期 60 天，数据库模式附带 refresh token 自动续期）。

> foxai 分级登录：`password` 传**普通密码** = 标准账户；传**限制级密钥**（`ADULT_KEY`）= 完整账户（18+ 可见）。

### 2. 携带凭据调用 API（三选一）

```bash
# 方式 A：Cookie（最常用，浏览器/爬虫场景）
curl -b cookies.txt "https://your-app.vercel.app/api/live/sources"

# 方式 B：Authorization Header（程序集成推荐，登录响应里的 token 原样使用）
curl -H "Authorization: Bearer <登录返回的token>" \
  "https://your-app.vercel.app/api/live/sources"

# 方式 C：浏览器场景自动携带（同域请求无需处理）
```

### 3. 无需登录的公开接口

`/api/server-config`（站点公开配置）、`/api/ad-filter`（去广告规则）、`/api/theme/css`（主题样式）、登录/注册/OIDC/扫码/Telegram 登录流程接口。外部工具专用 token 接口见[下文](#外部工具集成-apitvbox--oriontv--cms--定时任务)。

### 常见错误

| 状态码 | 含义 |
| ---- | ---- |
| 401 / 307 → /warning | 未登录或 `PASSWORD` 未配置 |
| 403 | 已登录但无对应功能权限（用户组限制） |
| 429 | 登录失败次数过多（IP 限流） |

---

## 认证机制详解

- **凭据内容**：`auth` cookie / Bearer token 是一段 URL 编码的 JSON：`{ username, role, timestamp, signature, tokenId?, refreshToken? }`，其中 `signature` 为以 `PASSWORD` 为密钥的 HMAC-SHA256 签名，防篡改。
- **优先级**：`Authorization: Bearer/Token <json>` 优先于 `auth` cookie。
- **刷新**：数据库模式下 access token 过期后由前端自动调 `GET /api/auth/refresh`（用 refresh token 换新 cookie）；localstorage 模式 60 天内免刷新。
- **设备管理**：`GET /api/auth/devices` 查看登录设备，`DELETE`（body `{tokenId}`）踢单个设备，`POST` 踢全部。
- **全局拦截**：`middleware` 拦截所有 `/api/*`（matcher 排除登录流程、cron、TVBox 订阅、公开配置等）。站长（`USERNAME` 环境变量指定）与 admin 角色拥有全部功能权限；普通用户受用户组（tags）功能开关约束。

---

## 核心体验 API

以下接口均需[登录凭据](#快速开始如何获取-api-访问权限)，响应统一为 JSON。

### 认证与账户

| 方法 | 路径 | 参数 | 说明 |
| ---- | ---- | ---- | ---- |
| POST | `/api/login` | `{username?, password, turnstileToken?}` | 登录（见上文） |
| POST | `/api/logout` | - | 登出并吊销当前设备 token |
| POST | `/api/register` | `{username, password, inviteCode?}` | 注册（站点需开启；localstorage 模式不支持） |
| POST | `/api/change-password` | `{newPassword}` | 改密（站长账号不可改） |
| GET/POST/DELETE | `/api/auth/devices` | DELETE `{tokenId}` | 登录设备管理 |
| GET/POST | `/api/user/email-settings` | `{email, emailNotifications}` | 通知邮箱设置 |
| GET | `/api/adult-unlock` · POST `{key}` · DELETE | - | 限制级解锁状态 / 按设备解锁 30 天 / 重新上锁 |

### 搜索与详情

| 方法 | 路径 | 参数 | 说明 |
| ---- | ---- | ---- | ---- |
| GET | `/api/search` | `q`、`special=1`（含特殊源）、`privateOnly=1` | 全源聚合搜索，`{results: VideoInfo[]}`（带 CDN 缓存） |
| GET | `/api/search/ws` | 同上 | SSE 流式逐源返回（首屏更快） |
| GET | `/api/search/one` | `q`、`resourceId` | 单源精确搜索（OrionTV 兼容） |
| GET | `/api/search/suggestions` | `q` | 搜索联想 `{suggestions:[{text,type,score}]}` |
| GET | `/api/detail` | `id`、`source`、`special=1` | 影片详情（含剧集列表） |
| GET | `/api/source-detail` | `id`、`source`、`title` | 播放页快速详情（支持网盘/Emby/小雅/脚本源） |
| GET | `/api/source-search/sources` · `/categories` · `/videos` · `/search` | `source`、`keyword/categoryId`、`page` | 源内浏览（分类/翻页/站内搜索） |
| GET | `/api/source-script/play` | `key`、`sourceId`、`episodeIndex`、`playUrl` | 自定义脚本源解析真实播放地址 |
| GET | `/api/advanced-recommendation/sources` · `/videos` | `source`、`page` | 脚本化推荐源 |

### 电视直播

| 方法 | 路径 | 参数 | 说明 |
| ---- | ---- | ---- | ---- |
| GET | `/api/live/sources` | - | 直播源列表 `{data: [{key, name, epg, channelNumber, proxyMode...}]}` |
| GET | `/api/live/channels` | `source` | 频道列表 `{data: [{id, tvgId, name, logo, group, url}]}`；首次调用触发拉取+解析（m3u/txt），服务端缓存 |
| GET | `/api/live/epg` | `source`、`tvgId` | 频道节目单 `{data: {programs: [{start, end, title}]}}` |
| GET | `/api/live/precheck` | `url`、`moontv-source` | 探测流格式 `{type: 'm3u8'\|'flv'\|'mp4'}`（无扩展名流地址用） |
| GET | `/api/live/epg/download` | `url` | EPG 文件下载（gzip 自动解压） |

> 前端入口：`/tv/live`（TV 大屏）与 `/live`（网页端）。频道播放走 `/api/proxy/m3u8` 等代理。内置 8 个直播源定义在 `src/lib/default-sources.ts`，可在管理面板增删，或用 `INIT_CONFIG` 环境变量的 `lives` 字段预置。

### 豆瓣发现

| 方法 | 路径 | 参数 | 说明 |
| ---- | ---- | ---- | ---- |
| GET | `/api/douban` | `type=tv\|movie`、`tag`、`pageSize`、`pageStart` | 分类列表 `{list: [{id,title,poster,rate,year}]}` |
| GET | `/api/douban/categories` | `type`、`kind` | 可用分类 |
| GET | `/api/douban/recommends` | `category`、`type`、`start`、`limit` | 榜单/推荐 |
| GET | `/api/douban/detail` | `id` | 影片详情（含剧集） |
| GET | `/api/douban/search` | `q` | 豆瓣搜索 |
| GET | `/api/douban-recommendations` | `id` | "喜欢这部电影的人也喜欢" |
| GET | `/api/douban-comments` | `id`、`start`、`limit` | 豆瓣短评 |

### 个人数据

收藏 / 播放记录 / 搜索历史 / 片头片尾跳过配置，四组同构 CRUD（localstorage 模式存浏览器，数据库模式服务端同步）：

| 方法 | 路径 | 参数 | 说明 |
| ---- | ---- | ---- | ---- |
| GET | `/api/favorites` · `/api/playrecords` · `/api/searchhistory` | `key`（可选，查单条） | 全量 `Record<key, ...>` |
| POST | 同上 | `{key, favorite\|record\|...}` | 写入（`key = source+id`） |
| DELETE | 同上 | `?key=` | 删除单条 |
| GET/POST/DELETE | `/api/skipconfigs` | `{key, config:{enable,intro_time,outro_time}}` | 跳过片头片尾 |

### 弹幕

| 方法 | 路径 | 参数 | 说明 |
| ---- | ---- | ---- | ---- |
| POST | `/api/danmaku/match` | `{fileName}` | dandanplay 弹幕匹配 |
| GET | `/api/danmaku/comment` | `episodeId` 或 `url` | 弹幕列表（XML 转 JSON） |
| GET | `/api/danmaku/search` · `/episodes` | `keyword` / `animeId` | 弹幕搜索 / 剧集列表 |
| GET/POST | `/api/danmaku-filter` | - | 弹幕过滤词（仅站长） |

### TMDB / 番剧

| 方法 | 路径 | 参数 | 说明 |
| ---- | ---- | ---- | ---- |
| GET | `/api/tmdb/search` · `/detail` · `/credits` · `/seasons` · `/episodes` · `/images` · `/videos` · `/trending` · `/upcoming` | `query` / `id`+`type` 等 | TMDB 代理（需配置 `TMDB_API_KEY`） |
| GET | `/api/tmdb-details` · `/api/tmdb-recommendations` | `title`、`cachedId` | 按标题匹配详情/推荐 |
| GET | `/api/bangumi/calendar` · `/schedule` · `/subject` | `id` 等 | Bangumi（番组计划）代理，含缓存 |
| POST | `/api/acg/nyaa` · `/dmhy` · `/mikan` · `/acgrip` | `{keyword, page}` | 动漫资源磁力搜索（需 `magnet_search` 权限） |
| POST | `/api/acg/health` · `/api/acg/download` | `{url,...}` | 磁链测活 / 提交 OpenList 离线下载 |
| POST | `/api/ai/chat` | `{message, context, history}` | AI 助手 SSE 流式对话（需 AI 配置） |

### 读书 / 漫画 / 音乐 / 短剧

| 方法 | 路径 | 说明 |
| ---- | ---- | ---- |
| GET | `/api/books/sources` · `/search`（`/ws` SSE） · `/catalog` · `/detail` · `/read/*` · `/file` · `/image` · `/history` · `/shelf` · `/tts/*` | 书源阅读（书架 CRUD、TTS 朗读） |
| GET | `/api/manga/sources` · `/search`（`/ws`） · `/detail` · `/pages` · `/image` · `/recommend` · `/history` · `/shelf` | 漫画（Suwayomi 对接） |
| GET/POST | `/api/music?action=toplists\|search\|playlist...` | 音乐聚合（`platform`/`id`/`keyword`/`page`） |
| GET/POST/PATCH/DELETE | `/api/music/playlists` · `/playrecords` · `/api/music/v2/*` | 歌单 / 播放记录 / LX Music 服务对接 |
| GET | `/api/music/audio-proxy` · `/proxy` | 音频流代理 |
| GET | `/api/duanju/sources` · `/categories` · `/videos` · `/recommends` | 短剧（CMS 格式） |

### 网盘与私人影库

| 方法 | 路径 | 参数 | 说明 |
| ---- | ---- | ---- | ---- |
| POST | `/api/pansou/search` | `{keyword, cloud_types[]}` | Pansou 网盘聚合搜索（需自建服务） |
| POST | `/api/netdisk/{quark\|uc\|baidu\|tianyi\|115\|123\|mobile}/instant-play` | `{shareUrl, passcode, title}` | 网盘分享秒播（建会话） |
| GET | `/api/netdisk/{厂商}/play` | `id`、`episodeIndex`、`quality` | 取网盘播放地址（走代理） |
| POST | `/api/netdisk/check/start` · GET `/check/task?id=` · POST `/check/cancel` | `{platform, links[]}` | 网盘链接批量测活任务 |
| GET | `/api/openlist/list` · `/detail` · `/play` · `/refresh` · `/delete` | `folder` 等 | 私人影库（OpenList），含 TMDB 刮削 |
| GET | `/api/emby/sources` · `/views` · `/list` · `/detail` | `embyKey` 等 | Emby 媒体库 |
| GET | `/api/xiaoya/browse` · `/play` · `/search` | `path`、`keyword` | 小雅全能播放 |
| GET/POST/DELETE/PUT | `/api/offline-download`（+ `/local`） | `{source, videoId, episodeIndex, m3u8Url}` | 服务器离线下载（仅 owner/admin） |

### 通知与求片

| 方法 | 路径 | 参数 | 说明 |
| ---- | ---- | ---- | ---- |
| GET/POST | `/api/notifications` | POST `{action: mark_read\|delete\|clear_all}` | 站内通知 |
| GET/POST/DELETE | `/api/notifications/push` | `{subscription, enabled}` | Web Push 订阅管理 |
| GET/POST | `/api/movie-requests` | `{tmdbId, title, ...}` | 求片（有冷却，自动通知站长） |
| GET/PATCH/DELETE | `/api/movie-requests/[id]` | PATCH `{status,...}` | 处理求片（PATCH/DELETE 需站长） |

---

## 播放代理 API

播放器实际拉流走的代理（浏览器直连，需登录态；部分有 token 变体供外部播放器）：

| 路径 | 参数 | 说明 |
| ---- | ---- | ---- |
| `/api/proxy/m3u8` | `url`、`moontv-source`、`allowCORS` | 直播 m3u8 代理（按源 UA 取流、改写分片为代理地址） |
| `/api/proxy/segment` · `/api/proxy/key` | `url`、`moontv-source` | 直播分片 / 解密 key 代理 |
| `/api/proxy/logo` | `url`、`source` | 频道台标代理（缓存 1 天） |
| `/api/proxy/vod/m3u8` · `/segment` · `/key` | `url`、`source` | 点播代理（需源开启 proxyMode，内置 SSRF 校验） |
| `/api/proxy-m3u8` | `url`、`source`、`token`、`adblock` | **外部播放器专用**（无需登录；设 `NEXT_PUBLIC_PROXY_M3U8_TOKEN` 后强制校验） |
| `/api/image-proxy` · `/api/video-proxy` | `url` | 图片 / 视频流代理（后者支持 Range） |

---

## 外部工具集成 API（TVBox / OrionTV / CMS / 定时任务）

这些接口用 **token / 路径密钥** 鉴权，无需登录 cookie，专为第三方工具设计：

### TVBox / 影视 App 订阅

```bash
# 订阅配置（token = 全局 TVBOX_SUBSCRIBE_TOKEN，或用户级 token）
GET /api/tvbox/subscribe?token=<token>&adFilter=true&yellowFilter=false

# 私人影库 CMS 采集接口（苹果 CMS V10 格式）
GET /api/openlist/cms-proxy/<token>?ac=videolist&wd=关键词
GET /api/emby/cms-proxy/<token>?ac=videolist&wd=关键词

# 对应播放地址（外部播放器直连）
GET /api/openlist/play/<token>?folder=...&fileName=...
GET /api/emby/play/<token>/video.mp4?itemId=...
```

用户级 token 获取：登录后 `GET /api/user/tvbox-token`（懒生成）/ `POST /api/user/tvbox-token/reset` 重置。开启开关：环境变量 `ENABLE_TVBOX_SUBSCRIBE=true`。

### OrionTV（Android TV 客户端）

用登录 cookie（设备浏览器登录一次即可）：`GET /api/search/resources`、`GET /api/search/one?q=&resourceId=`、`GET /api/image-proxy?url=`。

### 苹果 CMS 聚合（免鉴权，middleware 排除）

```bash
GET /api/cms-proxy?api=<CMS采集地址或openlist>&wd=关键词&ids=xxx&yellowFilter=true
# 返回 CMS JSON，播放链接自动替换为 /api/proxy-m3u8 代理
```

### 定时任务（Vercel Cron 等）

```bash
GET /api/cron/<CRON_PASSWORD>?path=...   # 默认密码 mtvpls，请务必修改
# 触发：配置订阅刷新、直播源刷新、OpenList 扫描、番剧订阅检查等；默认 202 后台执行
```

### 其他

- `POST /api/telegram/webhook/<secret>` — Telegram Bot 回调（路径密钥鉴权）
- `GET /api/tv-remote/devices` · `POST /api/tv-remote/key` `{deviceId, command:{key}}` — 手机遥控 TV 端（登录态 + `ENABLE_TV_MODE`）
- `GET /api/server-config` — 公开的站点配置（站名/存储类型/功能开关，无密钥）
- `POST /api/web-live/*` 虎牙/B站/抖音网络直播（站内前端用）

---

## 管理端 API 概览

`/api/admin/*`，需登录且站长（`USERNAME`）或 admin 角色。常用子模块（均为 POST/GET）：

`site`（站点设置）· `config` / `config_file` / `config_subscription`（配置与订阅）· `source` / `source/validate`（采集源）· `live` / `live/refresh`（直播源管理与刷新）· `web-live`（网络直播源）· `user` / `users` / `user-devices` / `migrate-users`（用户管理）· `netdisk`（网盘凭据）· `openlist` / `emby` / `xiaoya`（媒体库）· `music`（音乐服务）· `opds` / `legado-subscriptions`（书源）· `suwayomi`（漫画）· `ai`（AI 配置）· `telegram`（Bot 配置）· `email`（邮件）· `theme`（主题 CSS）· `category`（分类）· `anime-subscription`（番剧订阅）· `data_migration`（备份导入导出）· `reload` / `reset`（重载/重置配置）

例：刷新全部直播源 `POST /api/admin/live/refresh`。

---

## 外部服务预配置：哪些 API 可以配在 Vercel 环境变量里

**结论：绝大多数外部服务都可以且推荐用 Vercel 环境变量预配置**（部署后即生效，无需进管理面板）；少数仅能在管理面板配置。对照表：

### ✅ 环境变量可直接配置（推荐）

| 外部服务 | 环境变量 | 说明 |
| ---- | ---- | ---- |
| 直播源 / 采集源 / 分类 | `INIT_CONFIG`（JSON，含 `lives` / `api_site`）或 `CONFIG_SUBSCRIPTION_URL` | 不配置时使用内置默认（8 直播源 + 59 采集源，开箱即用）；`INIT_CONFIG` 需 Redeploy 生效 |
| Pansou 网盘搜索 | `PANSOU_API_URL`（+ `PANSOU_USERNAME` / `PANSOU_PASSWORD`） | 配置后搜索页自动出现"网盘搜索"入口 |
| TMDB | `TMDB_API_KEY`（+ `TMDB_PROXY` / `TMDB_REVERSE_PROXY` / `TMDB_IMAGE_BASE_URL`） | 不配则 TMDB 相关功能隐藏 |
| 弹幕后端 | `DANMAKU_API_BASE` / `DANMAKU_API_TOKEN` | 默认内置公共后端，开箱即用；自建可换 |
| Bangumi / 番剧数据 | `BANGUMI_API_BASE_URL` / `BANGUMI_IMAGE_BASE_URL` / `BANGUMI_PROXY` | 默认 `api.bgm.tv` 直连 |
| 豆瓣数据 CDN | `NEXT_PUBLIC_DOUBAN_PROXY_TYPE` / `NEXT_PUBLIC_DOUBAN_IMAGE_PROXY_TYPE`（+ custom 地址） | 默认腾讯 CDN，一般无需配置 |
| OPDS 书源 | `OPDS_URL`（或 `OPDS_SOURCES_JSON` 批量）+ 账号变量 | 书城功能 |
| Suwayomi 漫画 | `SUWAYOMI_URL` + 认证变量 | 漫画功能 |
| Telegram Bot | `TELEGRAM_BOT_TOKEN` 等 | TG 登录/通知 |
| 音乐后端 | `MUSIC_V2_BASE_URL` / `MUSIC_V2_TOKEN` | ⚠️ 有 env 回退，但 `Enabled` 开关首次仍需管理面板打开 |
| Web Push | `WEB_PUSH_PROXY` / `WEB_PUSH_BASEURL` | 通知推送 |

### ⚙️ 仅管理面板配置（无环境变量入口）

- **Emby 媒体库**（`/api/admin/emby`）
- **OpenList 私人影库**（`/api/admin/openlist`，含服务器地址与凭据）
- **小雅**（`/api/admin/xiaoya`）
- **各网盘 Cookie**（夸克/UC/百度/天翼/115/123/移动，`/api/admin/netdisk`）
- **AI 服务密钥**（`/api/admin/ai`）

> 判断原则：凡"部署时就能确定地址/密钥"的服务都有环境变量入口；需要长 Cookie、交互式登录或多实例管理的（网盘、Emby、OpenList）走管理面板，面板配置存数据库、即时生效无需重新部署。

---

*文档基于 2026-09 代码库整理；接口路径以 `src/app/api/` 目录为准。*
