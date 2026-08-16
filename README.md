# 衣搭 · 我的穿搭日记

移动端优先的「数字衣橱 + 换装 + 每日穿搭推荐」PWA。

将你的真实衣物建立为数字衣橱，用你自己的全身照作为换装模特，自由组合衣服；每天根据天气生成 3 套穿搭推荐（LOOK 01 随机灵感 / LOOK 02 穿衣法则 / LOOK 03 我的收藏）。

## 当前阶段：Phase 0–4（本地 MVP）

已按开发纪律完成：

- Phase 0 项目初始化、Domain Model、IndexedDB、页面骨架
- Phase 1 换装引擎（分层渲染、点击即换、不刷新页面）
- Phase 2 衣橱（查看 / 添加 / 编辑 / 删除 / 收藏）
- Phase 3 规则推荐算法（随机、穿衣法则、收藏回退）
- Phase 4 首页 + 天气 Mock + 穿搭详情
- Phase 1（真人模特标准化）：上传全身照 → 浏览器本地人体检测 → 自动裁剪为 600×1200 标准画布 → 按身材比例重算全部衣物锚点
- Phase 5（AI 衣物资产化）：上传穿搭照 → AI 识别单品 → 人工确认 → 生成透明衣物素材 → 加入衣橱并在换装间使用（Mock Provider，详见 PHASE_5_REPORT.md）
- Phase 6A（VTON 技术验证）：新增 `/lab/vton` 实验台（默认隐藏），3 个 Provider（2 本地方案 + 1 OpenAI 图像编辑），10 组基准可复跑，详见 PHASE_6A_REPORT.md
- Phase 6B（国内 VTON Provider Benchmark）：统一 VTON Provider 契约 + 阿里云百炼 aitryon 服务端代理（Key 仅服务端、默认关闭），固定 20 组数据集（T恤/衬衫/外套/连衣裙），实验台支持统计/人工评分/JSON/MD 导出，详见 PHASE_6B_REPORT.md
- Phase 6B.1（Alibaba AITryOn 集成）：`AlibabaAITryOnProvider` + 显式上传适配层（本地图 → 临时公网 URL）+ 专属实验台 `/lab/vton/alibaba` + 20 组真实图片基准框架（真人自拍/衣服照片/复杂场景），真实调用待 Key 与图片，详见 PHASE_6B_ALIBABA_REPORT.md
- Phase 6E（AI Try-On 价值验证）：Beta 用户专属「✨ AI真实试穿」入口与 `/tryon` 全流程（选衣→生成→评分→收藏→付费意愿问卷），`VTON_BETA_ENABLED` 开关 + `/lab/vton/beta` 指标看板与成本报告；真实价值数据待 Key + 10 名测试用户，详见 PHASE_6E_REPORT.md
- Phase 6F.0（Alibaba 生产连通）：Cloudflare Production 已配置 `DASHSCOPE_API_KEY` / `VTON_ALLOW_ALIBABA` / `VTON_BETA_ENABLED`，首次真实生成成功（task SUCCEEDED）；每用户每日 3 次限额（客户端 + 服务端，KV 可选）；详见 PHASE_6F_0_ALIBABA_CONNECTION_REPORT.md
- Phase 6C（真实衣橱资产验证）：新增 `/lab/wardrobe` 实验台，验证“添加我的第一件衣服”两种上传方式（穿搭照片拆解 / 单品照片），记录无隐私的 onboarding 行为指标，20 组演示数据集（自拍/镜子/衣架/平铺各 5），详见 PHASE_6C_REPORT.md
- Phase 6D（Closed Beta 验证）：Beta 测试模式（独立数据库、可一键删除）、空衣橱 CTA 与 3 步首启引导、AI 失败兜底（重新上传/手动添加）、行为埋点与 `/lab/beta` 指标看板、轻量反馈入口；真人测试数据待招募采集，详见 PHASE_6D_REPORT.md

未接入真实 AI API、无登录、无云端数据库；所有数据保存在浏览器本地（IndexedDB），可离线运行。

## 技术栈

- Next.js 16（App Router）+ TypeScript
- Tailwind CSS v4
- IndexedDB（idb）
- PWA（manifest + Service Worker，生产环境启用）
- 本地 SVG 素材（模特插画 + 35 件演示单品，透明背景）

## 运行

```bash
npm install
npm run dev        # 开发模式 http://localhost:3000
npm run build      # 生产构建
npm run start      # 生产运行
npm run lint       # 代码规范检查
```

首次打开会自动写入演示数据：1 个模特 + 35 件演示单品 + 当日 3 套推荐。

### 检测资源（仅首次准备）

人体检测使用 MediaPipe，完全在浏览器本地运行。构建前需生成运行时资源（约 18MB，已加入 .gitignore）：

```bash
npm install
powershell -ExecutionPolicy Bypass -File scripts/fetch-mediapipe.ps1
npm run build
```

资源就绪后，换装间右上角点「更换模特」即可上传自己的全身照，衣物位置会自动按你的身材重新定位。

## 部署（纯静态，零服务器成本）

项目已配置 `output: "export"`，`npm run build` 会生成纯静态产物 `out/`（约 1MB），可直接上传到 Cloudflare Pages / GitHub Pages / 任意静态托管。

- 穿搭详情使用查询参数链接 `/outfit?id=xxx`，在纯静态托管上无需服务端重写
- Service Worker 在首次访问后缓存应用外壳，断网仍可换装和查看收藏
- 本地预览静态产物：`node scripts/serve-static.mjs`（默认 http://localhost:4173）

## 验收清单（全部通过）

1. 打开 PWA
2. 进入衣橱
3. 查看 35 件演示衣服
4. 进入换装间
5. 看到人物模特
6. 点击上衣 → 立即替换
7. 点击下装 → 立即替换
8. 点击鞋 → 立即替换
9. 点击包 → 立即替换
10. 收藏当前搭配
11. 返回首页看到三套推荐
12. 点击推荐进入详情
13. 刷新页面数据仍在

自动化验证脚本见 `scripts/`（qa.mjs 主流程、qa-layout.mjs 图层几何、qa-assets.mjs 素材有效性、gen-icons.ps1 图标生成）。

## 目录结构

```text
app/
  page.tsx              首页（天气 Mock + 3 套 LOOK）
  wardrobe/page.tsx     衣橱
  dress/page.tsx        换装间（核心）
  outfit/[id]/page.tsx  穿搭详情
components/             换装渲染器、底部导航、弹层、图标等
hooks/useAppData.tsx    全局数据层（IndexedDB 读写 + 每日推荐）
lib/
  types.ts              Domain Model
  assets.ts             SVG 素材生成器（模特 + 单品）
  seed.ts               演示数据（35 件单品）
  db.ts                 IndexedDB 封装
  recommendations.ts    规则推荐算法
  outfitEngine.ts       换装逻辑（层级、互斥规则）
  weather.ts            天气 Mock
public/                 manifest、sw.js、图标
```

## 换装引擎要点

- 统一 Standard Person Canvas：600 × 1200
- 每件单品带 `anchor`（x/y/width/height，画布坐标），渲染时按比例换算，不依赖固定像素
- 图层顺序：人物 → 下装 → 上衣 → 裙子 → 外套 → 鞋 → 包 → 配饰
- 互斥规则：穿裙子清空上衣/下装；穿上衣或下装清空裙子
- 替换单品只更新对应图层，不重载整个人物

## 后续阶段（未开发）

- Phase 5：AI 衣物识别 + 自动抠图（上传穿搭照 → 拆出透明单品）
- Phase 6：真人 AI Virtual Try-On（任意照片自动换装）
- 真实天气 API 接入点：`lib/weather.ts` 的 `getMockWeather()`
- 真实模特照片：上传后生成 Standard Person Canvas 的流程
