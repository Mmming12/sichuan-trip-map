# 成都 · 三星堆 · 九寨沟旅行地图

[手机／电脑打开旅行地图](https://mmming12.github.io/sichuan-trip-map/)。无需 ChatGPT 登录。

基于 [trip-map-builder](https://github.com/hiyeshu/trip-map-builder) 的 Leaflet＋行程卡片方案，使用 GitHub Pages 托管。包括按天行程、返程方案比较、高铁与接驳、餐厅、酒店位置和高德保存路线。

## 固定行程与高德数据

`amap-data.js` 保存 12 个核对过的地点和 10 条步行／公交路线。页面可筛选区域、查看路线图、展开换乘步骤，或跳转高德重新查询。浏览页面不消耗作者的高德 API 用量；只在本机查询并重新发布数据时使用 Web 服务 Key。JS API Key 和安全密钥本版未使用，所有密钥均留在本机，不提交仓库。

保存结果不是实时导航。公交请求时间不是发车时刻；三星堆接驳约 39 分钟含步行、不含等车，具体班次仍待确认。铁路与九旅悦行接驳须单独核实。酒店每间约 500 元是预算，出行日房价、房态、餐厅营业及菜单均未确认。

## 本地预览与数据导出

双击 `index.html`，或运行 `python -m http.server 8765` 后访问 `http://localhost:8765`。底图及外部导航需要联网。

作者数据维护工具 `python tools/refresh-amap.py` 默认只读取用户主目录 `.trip-map-builder/amap-research/` 私有缓存，不发送 API 请求。`--fetch --max-requests 10` 才查询缺少的路线，读取该目录上级的 `amap.env` 中 `AMAP_WEB_SERVICE_KEY`，串行请求，出错停止。已存在的缓存不会自动更新；需先归档目标缓存，再显式查询。工具依赖作者已核对的地点缓存，不是独立地点搜索器。

## 发布与验证

GitHub Pages 使用 main 分支根目录，`.nojekyll` 保证直接发布静态文件。普通访问者无需配置 API。

运行 `node --check trip.js`、`node check.cjs`、`python tools/check-amap.py`，检查视图、返程切换、区域筛选、坐标和路线绘制、缺失地图时的文字备用界面，以及路线解析的空结果和错误处理。此为逻辑验证，未代替手机浏览器实测。

行程为 2026-09-25—28，29 日返程仍为待选分支；全部未预订。详细来源、数据边界和照片署名见 `sources.html`。
