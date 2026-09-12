# 成都 · 三星堆 · 九寨沟旅行地图

> 2026-09-12：高德版生产根网址已验证跳转到 `/amap.html`，13 项页面／静态资源与本地一致，真实高德初始化鉴权成功，现有逻辑检查和源码凭据扫描通过。当前无可用浏览器，手机／桌面真实底图及交互仍待实测；HTTP 和 mock 检查不代表视觉验收。

同日修复：用户反馈所有浏览器均提示地图无法加载。地图初始化清理弹窗时误用了不存在的 `closeInfoWindow()`，已改为高德实际提供的 `clearInfoWindow()`，同时修正测试替身并增加初始化不得进入失败界面的回归断言。回归检查修复前失败、修复后通过；最终手机显示仍需真实浏览器确认。

[高德地图版](https://sichuan-trip-amap.vercel.app/) · [原版地图](https://mmming12.github.io/sichuan-trip-map/)。均可手机／电脑免登录打开。

基于 [trip-map-builder](https://github.com/hiyeshu/trip-map-builder) 的 Leaflet＋行程卡片方案，使用 GitHub Pages 托管。包括按天行程、返程方案比较、高铁与接驳、餐厅、酒店位置和高德保存路线。

## 固定行程与高德数据

`amap-data.js` 保存 12 个核对过的地点和 10 条步行／公交路线。页面可筛选区域、查看路线图、展开换乘步骤，或跳转高德重新查询。原版浏览页面不消耗作者的高德 API 用量；高德版加载底图会使用 JS 地图初始化额度。两个版本查看保存路线均不重新调用路径规划。Web 服务 Key 只在作者本机刷新路线时使用；高德 JS API Key 与安全密钥存入 Vercel 生产环境 Secret，前者通过 `/api/map-config` 返回浏览器（公开标识），后者只由服务端代理注入，不返回浏览器、不提交仓库。

保存结果不是实时导航。公交请求时间不是发车时刻；三星堆接驳约 39 分钟含步行、不含等车，具体班次仍待确认。铁路与九旅悦行接驳须单独核实。酒店每间约 500 元是预算，出行日房价、房态、餐厅营业及菜单均未确认。

## 本地预览与数据导出

双击 `index.html`，或运行 `python -m http.server 8765` 后访问 `http://localhost:8765`。底图及外部导航需要联网。

作者数据维护工具 `python tools/refresh-amap.py` 默认只读取用户主目录 `.trip-map-builder/amap-research/` 私有缓存，不发送 API 请求。`--fetch --max-requests 10` 才查询缺少的路线，读取该目录上级的 `amap.env` 中 `AMAP_WEB_SERVICE_KEY`，串行请求，出错停止。已存在的缓存不会自动更新；需先归档目标缓存，再显式查询。工具依赖作者已核对的地点缓存，不是独立地点搜索器。

## 发布与验证

GitHub Pages 使用 main 分支根目录，`.nojekyll` 保证直接发布静态文件。普通访问者无需配置 API。

运行 `node --check trip.js`、`node check.cjs`、`node check-amap.cjs`、`python tools/check-amap.py`，检查视图、返程切换、区域筛选、坐标和路线绘制、缺失地图时的文字备用界面，以及路线解析的空结果和错误处理。此为逻辑验证，未代替手机浏览器实测。

行程为 2026-09-25—28，29 日返程仍为待选分支；全部未预订。详细来源、数据边界和照片署名见 `sources.html`。


## 高德版本部署

Vercel 项目 `boss-ming/sichuan-trip-amap`，当前账号 Hobby 免费套餐。根网址跳转 `amap.html`；`index.html` 保留 Leaflet 版本。Vercel 与 GitHub 仓库尚未绑定自动部署，修改后在本地运行 `npx vercel deploy --prod`；GitHub Pages 仍随 main 推送更新。

仅需两个 Vercel 生产环境变量：`AMAP_JSAPI_KEY` 和 `AMAP_SECURITY_JSCODE`。从本机私有配置读取，通过 stdin 设置为 Secret；不要把值写入命令参数、Git 或前端脚本。`AMAP_WEB_SERVICE_KEY` 不上传 Vercel。源码没有项目密钥，`.env*` 与 `.vercel/` 被忽略。

`/_AMapService/` 仅代理高德地图初始化 `/v3/log/init` 和样式 `/v4/map/styles`、`/v4/map/styles2`。固定上游地址，其他路径返回 404，覆盖来访请求的 jscode，超时和错误不输出包含凭据的 URL。浏览器与代理同域；不开放地点搜索、实时路线规划。代理不是访问认证机制，公开网站访客仍会使用本项目地图额度。

高德版使用原始 GCJ-02 坐标（经度在前），原版保留近似 WGS84 换算。切换日期只清理覆盖物，整页仅初始化一次 AMap.Map；SDK 加载失败保留文字与原版入口。

依据：[高德安全代理文档](https://lbs.amap.com/api/javascript-api-v2/guide/abc/jscode)、[地图视野设置](https://lbs.amap.com/api/javascript-api-v2/guide/map/state)、[Vercel Node Functions](https://vercel.com/docs/functions/runtimes/node-js)。
