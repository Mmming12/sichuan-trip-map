# 成都 · 三星堆 · 九寨沟旅行地图

手机、电脑浏览器均可使用的静态旅行地图。无需 ChatGPT 登录，无需地图 API Key。

基于 [trip-map-builder](https://github.com/hiyeshu/trip-map-builder) 的 Leaflet＋行程卡片方案制作。采用 GitHub Pages 托管；同一份源码也可以导入 Vercel。

## 本地打开

双击 `index.html`，或运行 `python -m http.server 8765` 后访问 `http://localhost:8765`。地图底图和外部导航需要联网。

## 部署

- GitHub Pages：Settings → Pages，选择 main 分支、根目录。`.nojekyll` 保证直接发布静态文件。
- Vercel：导入此 GitHub 仓库，Framework 选择 Other，根目录为仓库根目录，无需构建命令。发布后使用可公开访问的正式域名。

## 验证

`node --check trip.js`，然后 `node check.cjs`。检查日期视图、返程切换、底图组件缺失时的备用视图和本地文件引用。

## 数据说明

行程日期为 2026-09-25—28，29 日返程仍为待选分支。交通时刻、酒店和餐厅为带来源的参考资料，均未预订。具体核验边界及照片署名见 `sources.html`。图钉不连成假设交通路线；高德链接用于查询实际公共交通。
