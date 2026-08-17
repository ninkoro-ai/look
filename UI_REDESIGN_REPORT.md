# LOOK 全局 UI 重构报告（Reference-driven UI Redesign）

## 1. Design System

### 色彩

按任务书建立正式 Design Token（`app/globals.css`），语义化 token 全部重映射：

| Token | 值 | 用途 |
| --- | --- | --- |
| `background` | `#FAF8F5` | 全局暖米白背景 |
| `surface` | `#FFFFFF` | 卡片表面 |
| `surface-soft` | `#F7F2F0` | 浅粉灰衬底 |
| `ink` / `foreground` | `#171717` | 深黑正文 |
| `muted` | `#707070` | 辅助灰 |
| `line` | `#ECE7E3` | 发丝线 |
| `accent` | `#E98EA6` | 柔和玫瑰粉（品牌强调） |
| `accent-deep` | `#C46E8B` | 深玫瑰（文字/选中态） |
| `accent-soft` | `#F8DCE4` | 浅粉强调底 |
| `sand` / `sand-deep` | `#F4EDEA` / `#EAE0DD` | 暖色辅助 |

粉色只作为 Accent，大面积仍是米白/白，避免高饱和粉与廉价少女风。

### 圆角 / 阴影 / 动效

- 圆角统一为 14 / 18 / 22 / 28px 四个层级；
- 阴影改为 `shadow-soft`（`0 8px 30px rgba(23,23,23,0.05)`）与 `shadow-float`（`0 14px 44px rgba(23,23,23,0.08)`），低透明、柔和扩散；
- 新增 `card-hairline`（1px 内描边）、`pressable`（统一按压反馈）、`fade-up`/`fade-in`/`heart-pop` 轻量动效。

### Typography

- 大标题使用 `font-display`（宋体/衬线）+ 大字号，建立杂志式层级；
- 正文 Geist + PingFang/苹方回退；辅助文字用 `muted` 灰。

## 2. 页面变化

按 UI-01 → UI-07 顺序重构正式页面，业务逻辑与数据层零改动：

| Phase | 页面 | 变化 |
| --- | --- | --- |
| UI-01 | 首页 `/` | 改为「今天穿什么？」大标题 + 小而精致的天气；今日 Look 成为大型 Hero（人物+穿搭是视觉主体）；三套推荐 = 1 张主卡 + 2 张横向小卡；新增「发现」功能模块（拍照识衣/我的模特/自由换装/我的衣橱） |
| UI-02 | 衣橱 `/wardrobe` | 图片优先 3 列网格、分类 Chip、空态 CTA、右下角 FAB（从穿搭照片添加 / 单件衣物添加） |
| UI-03 | 换装 `/dress` | 模特区占主视觉、衣物横向滚动图片卡、即时换装保留、收藏与 AI 真实试穿分离 |
| UI-04 | 穿搭详情 `/outfit` | 大型穿搭图 + 为什么这样搭 + 搭配清单（图片优先）+ 换一件/收藏 |
| UI-05 | 收藏 `/favorites`（新增） | 穿搭画廊 3 列网格，点击进入完整搭配 |
| UI-06 | 我的/风格 `/profile`（新增） | 基于真实衣橱数据生成风格画像（偏爱/常穿颜色/衣橱构成），无数据显示空态 |
| UI-07 | AI 试穿结果 `/tryon` | Before/After 对比 + 生成耗时 + 收藏/保存/再试，不暴露 Provider/task_id |

底部导航由 3 Tab 升级为 5 Tab：首页 / 衣橱 / 换装（中心强调）/ 收藏 / 我的。

## 3. Component 变化

- 新增基础原语 `components/ui.tsx`：`SectionTitle`、`Chip`、`Pill`、`SoftCard`；
- `AppShell` 底部导航重构为 5 栏 + 中心浮起换装按钮；
- 其余组件（`ModelCanvas`、`BottomSheet`、`ModelSheet`、`Toast`、`BetaFeedback`）保持逻辑不变，仅随 token 自动换色；
- 换装引擎、VTON Provider、IndexedDB、推荐算法均未改动。

## 4. Responsive 适配

移动端优先，目标宽度 375 / 390 / 430px；768 / 1440px 以居中 max-width 430px 的 App 视图呈现（保留 PWA/移动 App 形态）。

已生成多尺寸截图：`scripts/shots/redesign/{home,wardrobe,dress,favorites,profile,demo}-{375,390,430,768,1440}.png`（共 30 张）。

## 5. 性能处理

- 衣物图片仍为轻量 SVG/小尺寸 PNG，未引入大量高清图；
- 网格/横向列表依赖浏览器原生懒加载与 `draggable={false}`、`select-none`；
- 换装仍为本地即时渲染（`ModelCanvas` 仅替换对应 Layer 图片），未新增网络请求；
- AI 试穿流程独立按需触发，首页不阻塞。

## 6. Before / After 截图

- After（新设计）截图位于 `scripts/shots/`（qa.mjs 生成 home/wardrobe/dress/outfit）与 `scripts/shots/redesign/`（多尺寸）。
- Before 为原暖棕（terracotta `#B96A4B`）体系：后台式卡片堆叠、三套推荐等高、2 列衣橱、3 Tab 导航。
- After 为米白 + 玫瑰粉 + 黑灰体系：Hero 视觉焦点、图片优先、5 Tab、时尚杂志感。

## 7. 回归测试

全部通过（静态服务 `http://localhost:4173`）：

- qa.mjs（首页/衣橱/换装/穿搭详情/PWA/收藏）PASS
- qa-layout.mjs（分层几何 + 坏图检查）PASS
- qa-import / qa-model / qa-lab / qa-wardrobe / qa-beta / qa-alibaba / qa-tryon / qa-demo 全部 PASS

## 8. 已知问题

1. 任务书提到“参考设计图已上传”，但实际附件中未附带图片，本轮以任务书中的详细文字规范作为视觉依据；
2. 默认演示模特仍为项目自有 SVG 插画（空态/未上传照片时显示），正式产品在用户上传自己的照片后即为真人模特；把默认演示模特换成真人素材是后续可选项；
3. 每日 AI 试穿次数限额的服务端持久化仍依赖 Cloudflare KV 绑定（当前部署令牌无 workers_kv 权限），目前为客户端 + 实例内存双层；
4. 768/1440px 采用居中手机 App 视图，未做宽屏多栏布局（符合“移动端优先”定位）。
