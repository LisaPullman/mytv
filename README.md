# foxai

<div align="center">
  <img src="public/logo.png" alt="foxai Logo" width="120">
</div>

> 🎬 **foxai** 是基于 [MoonTVPlus v250](https://github.com/mtvpls/MoonTVPlus)（其前身为 [MoonTV / LunaTV](https://github.com/MoonTechLab/LunaTV)）二次开发的品牌化影视聚合播放器 fork。开箱即用：内置精选片源与直播源、foxai 品牌视觉体系、双密码分级访问（凭据经环境变量注入，仓库零明文），专注 **Vercel** 一键部署。

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-14-000?logo=nextdotjs)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38bdf8?logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-4.x-3178c6?logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)

</div>

---

## 🦊 foxai 相对上游的定制

| 定制项 | 说明 |
| ------ | ---- |
| 🎨 **foxai 品牌层** | 完整 LOGO 体系（Mark / Tile / Lockup）+ Ember 配色 + aurora 渐变背景 + 玻璃拟态 UI，品牌规范见 [LOGO.html](./LOGO.html)（AI 可读，照抄即可复刻） |
| 📺 **内置精选片源** | 开箱即用 59 个实测可用片源（40 普通 + 19 限制级），无需配置即可搜索播放 |
| 🔞 **限制级默认开启** | 18+ 片源默认放行；管理员可在 管理面板 → 站点设置 一键关闭，也可单独禁用任一 18+ 片源 |
| 🔐 **双密码分级登录** | 普通密码登录 = 标准账户（18+ 片源完全隐藏）；限制级密钥登录 = 完整账户（含 18+），亦可在搜索页随时解锁/上锁（按设备记忆 30 天），见下方「分级访问」 |
| 🔑 **凭据环境变量注入** | 管理员账号与进站密码全部通过 Vercel 环境变量配置（`USERNAME` / `PASSWORD` / `ADULT_KEY`），仓库内零明文，公开仓库无泄漏风险 |
| 📺 **电视直播源修复与扩充** | 2026-09 全量实测：移除 4 个已失效源（yuanzl77 / hacks / 4K-IPTV / dongyubin），内置 8 个存活源（600–2400+ 频道，含央视/卫视/4K/国际台与 EPG 节目单）；旧配置库自动迁移，死链源给出明确报错 |
| 🧹 **轻量化** | 移除 Docker / Cloudflare / EdgeOne / AndroidTV 客户端等冗余文件（-26MB），只保留 Vercel 部署路径 |
| 🐛 **上游 bug 修复** | localStorage 模式搜索 500（`db.getGlobalValue` 空引用）、默认源回退缺失等 |

### 请不要在 B站、小红书、微信公众号、抖音、今日头条或其他中国大陆社交平台发布视频或文章宣传本项目，不授权任何“科技周刊/月刊”类项目或站点收录本项目。

## ✨ 功能特性（继承自上游）

- 🔍 **多源聚合搜索**：一次搜索立刻返回全源结果（聚合 59 源）。
- 📺 **电视直播**：8 个实测可用直播源（2400+ 频道聚合、测速优选、4K 高清、国际台），支持 EPG 节目单、遥控器数字选台 / 上下台 / 音量控制、频道收藏与最近观看（`/tv/live`）。
- 🔞 **限制级内容**：18+ 片源 + 站点级开关（默认开）。
- ▶️ **流畅在线播放**：集成 HLS.js & ArtPlayer，弹幕、智能去广告、外部播放器跳转。
- ✨ **视频超分 (Anime4K)**：WebGPU 实时画质增强（1.5x–4x）。
- 📥 **M3U8 下载 / 服务器离线下载**、💾 **私人影库**（OpenList / Emby / 小雅）。
- 🎭 **观影室**：多人同步观影、实时聊天、语音通话（需外部 WebSocket 服务器）。
- 📚 **读书 / 漫画 / 音乐 / 短剧 / TV 端**（`/tv`，配 OrionTV 可装 Android TV）。
- 📱 **PWA**：离线缓存、安装到桌面/主屏。
- 🌗 **响应式布局**：桌面侧边栏 + 移动底部导航。

## 🚀 部署（Vercel）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/LisaPullman/mytv)

1. Fork 或使用上方按钮将仓库导入 Vercel
2. **先配凭据（必填）**：Vercel → Settings → Environment Variables 添加后 Redeploy：

| 变量 | 说明 | 必填 |
| ---- | ---- | ---- |
| `USERNAME` | 管理员用户名 | ✅ |
| `PASSWORD` | 管理员密码 / 访客进站密码（未配置时站点锁定到 /warning 引导页） | ✅ |
| `ADULT_KEY` | 限制级密钥（分级登录 + 搜索页解锁；不配置则 18+ 分级功能停用） | 可选 |
| `NEXT_PUBLIC_SITE_NAME` | 站点名称（浏览器标题），默认 `foxai` | 可选 |
| `NEXT_PUBLIC_DISABLE_YELLOW_FILTER` | 限制级站点开关：`true` = 放行 18+（默认），`false` = 全局过滤 | 可选 |
| `NEXT_PUBLIC_STORAGE_TYPE` | 存储类型（见下表），默认 `localstorage` | 可选 |

> 仓库内不含任何默认账号密码（避免公开仓库泄漏）；凭据在构建期内联，修改后需 Redeploy。

### 🔐 分级访问（18+ 控制）

三种使用方式，按需组合：

| 方式 | 操作 | 效果 |
| ---- | ---- | ---- |
| **分级登录** | 登录页输入**普通密码** | 标准账户：18+ 片源不参与搜索，内容分类过滤始终生效 |
| **分级登录** | 登录页输入**限制级密钥**（`ADULT_KEY`） | 完整账户：18+ 片源全程可见（本机 60 天免重输） |
| **临时解锁** | 任意账户登录后，搜索页选项卡旁点「🔒 限制级」→ 输入密钥 | 本设备解锁 30 天，可随时「重新上锁」 |

> 数据库多用户模式下，每个账号可用各自的解锁状态；管理员想全局禁用 18+，直接在「采集源管理」禁用对应片源即可。

### 存储（播放记录 / 收藏 / 用户）

| `NEXT_PUBLIC_STORAGE_TYPE` | 需要的额外变量 | 适用 |
| ---- | ---- | ---- |
| `localstorage`（默认） | 无（数据存浏览器本地） | 个人自用，零配置 |
| `postgres` | `POSTGRES_URL`（Vercel Postgres 免费额度即可） | 多端同步，Vercel 推荐 |
| `upstash` | `UPSTASH_URL` + `UPSTASH_TOKEN` | 多端同步（免费 Redis） |
| `kvrocks` / `redis` / `turso` / `d1` | 对应连接变量（见完整环境变量表） | 自建存储 |

### 本地开发

```bash
pnpm install
PASSWORD=你的密码 USERNAME=你的用户名 pnpm dev   # 凭据经环境变量注入(也可写入 .env.local)
pnpm build      # 生产构建
```

## 📀 网盘搜索（Pansou）配置

网盘搜索基于开源自托管服务 [fish2018/pansou](https://github.com/fish2018/pansou)（无公共实例，需自建，一行 Docker 即可）：

```bash
docker run -d --name pansou -p 8888:8888 ghcr.io/fish2018/pansou:latest
# 健康检查: curl http://localhost:8888/api/health
```

然后在 foxai 侧 **二选一** 预配置：

- **环境变量（推荐）**：Vercel 设置 `PANSOU_API_URL=https://你的pansou地址`（可选 `PANSOU_USERNAME` / `PANSOU_PASSWORD`），搜索页自动出现“网盘搜索”入口；
- **管理面板**：管理面板 → 站点设置 → Pansou，填写 API 地址与凭据。

> 未配置时“网盘搜索”入口自动隐藏，不会出现报错页面。

## 📄 配置文件（片源自定义）

foxai 已内置默认片源；如需完全自定义，可在 管理面板 → 配置文件 填写（或用 `INIT_CONFIG` / `CONFIG_SUBSCRIPTION_URL` 环境变量注入），格式如下：

```json
{
  "cache_time": 7200,
  "api_site": {
    "dyttzy": {
      "api": "https://caiji.dyttzyapi.com/api.php/provide/vod",
      "name": "电影天堂资源",
      "detail": "https://caiji.dyttzyapi.com"
    }
  },
  "custom_category": [
    { "name": "华语", "type": "movie", "query": "华语" }
  ],
  "lives": {
    "iptv_vbskycn": { "name": "VBSkyCN IPTV", "url": "https://.../iptv4.txt" }
  }
}
```

- `api_site`：苹果 CMS V10 标准 `vod` JSON API；`key` 唯一、`api` 接口地址、`name` 显示名、`detail`（可选）网页详情根 URL
- `custom_category`：豆瓣自定义分类（`type`: `movie` / `tv`，`query` 搜索词）
- `lives`：直播源（m3u/txt 地址，可选 `epg` 节目单）
- 内置源清单见 `src/lib/default-sources.ts`（含 `18+` 前缀标识的限制级源），完整示例见 `INIT_CONFIG.example.json`

## 🎨 LOGO 与品牌规范

品牌唯一事实来源：**[LOGO.html](./LOGO.html)** —— 自包含、AI 可读，包含 Mark 路径数据、Ember 配色方案（HEX/RGB/HSL/OKLCH 全格式）、三变体（Mark / Tile / Lockup）、Raw SVG / React 配方与复刻速查清单。任何 AI 或设计师读完即可 1:1 复刻。

## 🗺 目录

- [部署](#部署vercel) · [存储](#存储播放记录--收藏--用户) · [Pansou](#-网盘搜索pansou配置) · [配置文件](#-配置文件片源自定义) · [LOGO 规范](#-logo-与品牌规范) · [API 文档](./API.md)
- 其他：TVBOX 订阅（`ENABLE_TVBOX_SUBSCRIBE`）、弹幕后端、超分（需 WebGPU + HTTPS）、AndroidTV（配 [OrionTV](https://github.com/zimplexing/OrionTV)）、外部观影室服务器（[watch-room-server](https://github.com/tgs9915/watch-room-server)）——用法与上游一致，详见完整环境变量表。

## 🌐 完整环境变量表

| 变量 | 说明 | 可选值 | 默认值 |
| ---- | ---- | ---- | ---- |
| `USERNAME` | 管理员账号 | 任意字符串 | (空,必填) |
| `PASSWORD` | 管理员密码 | 任意字符串 | (空,必填;未配置时站点锁定到 /warning) |
| `NEXT_PUBLIC_SITE_NAME` | 站点名称 | 任意字符串 | `foxai` |
| `NEXT_PUBLIC_STORAGE_TYPE` | 存储方式 | redis、kvrocks、upstash、d1、turso、postgres、localstorage | `localstorage` |
| `KVROCKS_URL` / `REDIS_URL` | kvrocks / redis 连接 url | 连接 url | (空) |
| `UPSTASH_URL` / `UPSTASH_TOKEN` | upstash 连接 | url / token | (空) |
| `TURSO_URL` / `TURSO_TOKEN` | Turso (libSQL) 连接 | libsql://xxx.turso.io | (空) |
| `POSTGRES_URL` | Vercel Postgres 连接串 | postgres://... | (空) |
| `NEXT_PUBLIC_DISABLE_YELLOW_FILTER` | 限制级开关（`false` = 开启 18+ 过滤） | true/false | `true` |
| `PANSOU_API_URL` | Pansou 网盘搜索 API 地址（预配置） | URL | (空，未配置则隐藏入口) |
| `PANSOU_USERNAME` / `PANSOU_PASSWORD` | Pansou 认证 | 任意字符串 | (空) |
| `INIT_CONFIG` | 初始配置（JSON，含 api_site / custom_category / lives） | JSON 字符串 | 内置精选源 |
| `CONFIG_SUBSCRIPTION_URL` | 配置订阅 URL（Base58，优先于 INIT_CONFIG） | URL | (空) |
| `ANNOUNCEMENT` | 站点公告 | 任意字符串 | 默认免责声明 |
| `ANNOUNCEMENT_DISPLAY_MODE` | 公告显示模式 | once、every | once |
| `NEXT_PUBLIC_SEARCH_MAX_PAGE` | 搜索最大页数 | 1-50 | 5 |
| `NEXT_PUBLIC_DOUBAN_PROXY_TYPE` | 豆瓣数据源请求方式 | direct / cors-proxy-zwei / cmliussss-cdn-tencent / cmliussss-cdn-ali / custom | cmliussss-cdn-tencent |
| `NEXT_PUBLIC_DOUBAN_IMAGE_PROXY_TYPE` | 豆瓣图片代理类型 | direct / server / img3 / cmliussss-cdn-* / custom | cmliussss-cdn-tencent |
| `CRON_PASSWORD` | 定时任务 API 密码 | 任意字符串 | mtvpls |
| `CRON_WAIT_FOR_COMPLETION` | serverless 定时任务等待完成 | true/false | false（Vercel 建议 true） |
| `SITE_BASE` | 站点 url | https://example.com | (空) |
| `NEXT_PUBLIC_FLUID_SEARCH` | 搜索流式输出 | true/false | true |
| `NEXT_PUBLIC_PROXY_M3U8_TOKEN` | M3U8 代理鉴权 Token | 任意字符串 | (空) |
| `NEXT_PUBLIC_DANMAKU_CACHE_EXPIRE_MINUTES` | 弹幕缓存失效（分钟） | 0 或正整数 | 4320 |
| `ENABLE_TV_MODE` | 启用 TV 模式（/tv） | true/false | true |
| `ENABLE_TVBOX_SUBSCRIBE` | 启用 TVBOX 订阅 | true/false | false |
| `TVBOX_SUBSCRIBE_TOKEN` | TVBOX 订阅 Token | 任意字符串 | (空) |
| `TVBOX_BLOCKED_SOURCES` | TVBOX 屏蔽源（逗号分隔 key） | 源 key | (空) |
| `WATCH_ROOM_ENABLED` | 启用观影室 | true/false | false |
| `WATCH_ROOM_SERVER_TYPE` | 观影室服务器类型 | internal/external | internal |
| `WATCH_ROOM_EXTERNAL_SERVER_URL` / `WATCH_ROOM_EXTERNAL_SERVER_AUTH` | 外部观影室地址 / 令牌 | URL / 字符串 | (空) |
| `NEXT_PUBLIC_VOICE_CHAT_STRATEGY` | 语音聊天策略 | webrtc-fallback/server-only | webrtc-fallback |
| `NEXT_PUBLIC_ENABLE_OFFLINE_DOWNLOAD` | 服务器离线下载 | true/false | false |
| `OFFLINE_DOWNLOAD_DIR` / `OFFLINE_DOWNLOAD_PROXY` | 离线下载目录 / 代理 | 路径 / http://host:port | /data / (空) |
| `TMDB_API_KEY` | TMDB API 密钥 | 任意字符串 | (空) |
| `TMDB_PROXY` / `TMDB_REVERSE_PROXY` | TMDB 代理 | URL | (空) |
| `DANMAKU_API_BASE` / `DANMAKU_API_TOKEN` | 弹幕 API | URL / 字符串 | 内置公共后端 / 87654321 |
| `WEB_PUSH_PROXY` / `WEB_PUSH_BASEURL` | Web Push 代理 | URL | (空) |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_BOT_USERNAME` / `TELEGRAM_WEBHOOK_SECRET` | Telegram Bot | token / 用户名 / 密钥 | (空) |
| `TELEGRAM_API_PROXY` / `TELEGRAM_API_BASE_URL` | Telegram API 代理 | URL | (空) |
| `MAX_PLAY_RECORDS_PER_USER` | 单用户播放记录上限 | 正整数 | 100 |
| `QR_LOGIN_STORE_MODE` | 扫码登录存储模式 | auto/memory/hybrid/shared | auto |

## ⚠️ 安全与隐私提醒

1. **凭据仅存于环境变量**：仓库不含任何默认密码。若曾用旧默认值部署过，旧值已出现在历史提交中——请视为已泄漏，在 Vercel 改用新的强密码并 Redeploy
2. **仅供个人使用**：请勿将实例链接公开分享或用于商业用途
3. **遵守当地法律**：18+ 内容默认开启，请在合法合规的前提下使用，必要时在管理面板关闭
4. 本项目不存储任何视频资源，所有内容来自第三方采集源；因使用产生的法律责任由使用者自行承担

## License

[MIT](LICENSE) © 2025 MoonTV & Contributors

## 致谢

- [MoonTVPlus](https://github.com/mtvpls/MoonTVPlus) — 本 fork 的上游基座（v250）
- [MoonTV / LunaTV](https://github.com/MoonTechLab/LunaTV)、[LibreTV](https://github.com/LibreSpark/LibreTV) — 项目的源头
- [fish2018/pansou](https://github.com/fish2018/pansou) — 网盘搜索后端
- [ArtPlayer](https://github.com/zhw2590582/ArtPlayer) / [HLS.js](https://github.com/video-dev/hls.js) — 播放核心
- [OrionTV](https://github.com/zimplexing/OrionTV) — Android TV 客户端
- [tgs9915/watch-room-server](https://github.com/tgs9915/watch-room-server) — 外部观影室服务器
- 感谢所有提供免费影视接口的站点，以及豆瓣数据 CDN 的搭建者 [CMLiussss](https://github.com/cmliu)、[Zwei](https://github.com/bestzwei)
