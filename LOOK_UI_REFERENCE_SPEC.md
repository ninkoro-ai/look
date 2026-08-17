# LOOK UI Reference Specification

**Version:** 1.0  
**Status:** Design Source of Truth  
**Purpose:** 将参考视觉图转化为可被 DeepSeek / Codex / Agent 直接执行的 UI 视觉规范。  
**Reference:** 当前提供的 LOOK 产品综合宣传/产品界面参考图。  

---

## 0. 使用规则

本文件是 LOOK UI 重构阶段的 **Single Source of Truth（SSOT）**。

开发 Agent 在进行 UI 修改时必须优先遵循本文件，而不是自行猜测视觉方向。

本文件描述的是：

- 视觉语言
- 页面结构
- 信息层级
- Design Token
- 组件规范
- 图片比例
- 移动端布局
- 动效原则
- 页面间一致性

本文件**不定义业务逻辑、数据库模型、AI Provider 或推荐算法**。已有业务逻辑必须继续保留。

如果当前代码实现与本规范冲突：

> 优先通过 UI 层重新表达业务，而不是修改底层业务逻辑。

---

# 1. 产品视觉定位

## 1.1 核心关键词

LOOK 的视觉必须同时满足以下四种气质：

**Fashion Magazine**  
时尚杂志感、编辑感、图片主导。

**Digital Wardrobe**  
数字衣橱、轻量整理、图片资产化。

**AI Styling**  
AI 穿搭助手、智能但不科技炫技。

**Dress-up Game**  
自由换装、即时反馈、轻微游戏化。

最终感受应该是：

> 一个高级、轻盈、女性化、图片驱动的时尚生活方式 App。

不是：

> 管理后台、AI 工具站、传统电商后台、儿童换装游戏。

---

# 2. 参考图视觉特征拆解

参考图呈现出以下明确特征：

1. 大面积暖白 / 米白背景。
2. 玫瑰粉作为品牌强调色，而不是大面积底色。
3. 黑色或深灰作为主要文字颜色。
4. 卡片背景接近白色，与暖白页面形成非常轻微的层次。
5. 主要内容使用人物/服装图片作为视觉主体。
6. UI 文字较少，图片比文字更重要。
7. 模块使用柔和圆角。
8. 阴影极轻，强调“纸张/杂志/卡片”感觉，而非悬浮软件面板。
9. 模块边界清晰但不厚重。
10. 页面整体留白较多，避免拥挤。
11. 粉色用于标题编号、Accent、选中态、CTA、心形等关键节点。
12. 页面具有明显的信息分区，但不是传统 Dashboard。

---

# 3. Color System

## 3.1 基础色

以下为推荐初始 Token；实际实现可在接近参考图的范围内微调，但不得改变整体气质。

```ts
export const colors = {
  background: '#FAF8F5',
  surface: '#FFFFFF',
  surfaceSoft: '#F7F2F0',
  surfacePink: '#FCECEF',

  textPrimary: '#171717',
  textSecondary: '#6F6B69',
  textMuted: '#96908C',
  textInverse: '#FFFFFF',

  accent: '#E88FA7',
  accentStrong: '#DF7896',
  accentSoft: '#F7DCE4',
  accentPale: '#FBECEF',

  border: '#EDE7E3',
  borderSoft: '#F2EDEA',

  success: '#6B9271',
  warning: '#C79855',
  error: '#C96E6E'
};
```

## 3.2 色彩使用比例

建议视觉占比：

- 60–70% 暖白背景
- 20–25% 白色 Surface / 图片区域
- 5–10% 米灰/浅灰辅助层
- 3–7% 玫瑰粉 Accent
- 黑/深灰主要用于文字

### 禁止

- 大面积高饱和粉
- 荧光粉
- 冷蓝、紫色作为主品牌色
- 纯黑大面积背景
- 过度少女糖果色

---

# 4. Typography

## 4.1 总体原则

字体应表现为：

- 干净
- 现代
- 高级
- 移动端易读
- 标题具有杂志感

优先使用系统中文无衬线字体栈，不为了视觉效果强制加载大体积字体。

推荐：

```css
font-family:
  -apple-system,
  BlinkMacSystemFont,
  "SF Pro Display",
  "PingFang SC",
  "Hiragino Sans GB",
  "Microsoft YaHei",
  sans-serif;
```

## 4.2 层级

### Display / Hero

- 28–34px
- 700
- line-height 1.15–1.25

用于：

> 今天穿什么？

> 我的衣橱

### Section Title

- 20–24px
- 650–700
- line-height 1.2–1.3

### Card Title

- 15–18px
- 600–650

### Body

- 14–16px
- 400–500
- line-height 1.5

### Caption

- 11–13px
- 400–500
- line-height 1.4

### Tag / Chip

- 11–13px
- 500–600

## 4.3 标题原则

避免每个标题都粗、都大。

视觉层级应该明显：

> 主标题 > Section > Card Title > Body > Caption

---

# 5. Spacing System

统一采用 4px 基础间距系统。

```text
4   8   12   16   20   24   28   32   40   48   64
```

推荐：

- 页面水平内边距：20px
- Section 间距：28–40px
- Card 内边距：16–20px
- 标题与副标题：6–10px
- 图片与文本：10–16px
- Bottom Nav 与页面内容底部安全区：16–24px

小屏幕 375px 时：

> 页面水平内边距默认 16–18px，不允许造成内容拥挤。

---

# 6. Radius System

```text
radius-xs = 8px
radius-sm = 12px
radius-md = 16px
radius-lg = 20px
radius-xl = 24px
radius-xxl = 28px
radius-pill = 999px
```

核心推荐：

- 小控件：12px
- 普通卡片：18–22px
- Hero Card：24–28px
- 按钮：14–18px
- Chip：999px

避免所有元素都使用完全相同的圆角。

---

# 7. Shadow System

整体使用非常轻的阴影。

```css
box-shadow:
  0 4px 20px rgba(30, 20, 15, 0.04);
```

可选 Hero：

```css
box-shadow:
  0 10px 30px rgba(30, 20, 15, 0.06);
```

禁止：

- 黑色重阴影
- 夸张 Glow
- 科技风发光
- 多层复杂阴影

---

# 8. Border System

默认：

```css
border: 1px solid #EDE7E3;
```

但图片卡片可以完全无 Border，只依靠背景层次和阴影。

参考图的核心感觉是：

> 边界存在，但用户不应该强烈感知到“盒子线”。

---

# 9. Button System

## 9.1 Primary CTA

主按钮使用玫瑰粉。

```text
背景：accent
文字：white
高度：44–48px
圆角：16–18px
```

文字尽量简短：

- 添加我的第一套穿搭
- 查看搭配
- AI 真实试穿
- 换一套

## 9.2 Secondary Button

白色或浅米白背景 + 深色文字。

## 9.3 Ghost Button

无填充，使用深灰文字。

## 9.4 AI Button

AI 试穿可使用：

- accent 粉色
- 极浅粉底
- ✨ / Sparkle 作为辅助识别

但不要做成科技感霓虹按钮。

---

# 10. Chip / Tag

用于：

- 天气
- 风格
- 穿衣法则
- 类别
- 场景

推荐：

```text
浅粉底 + 深粉文字
```

或者：

```text
米白底 + 灰色文字
```

标签尽量短。

---

# 11. Image Principles

## 11.1 图片优先

LOOK 是视觉产品。

优先级：

**人物/衣物图片 > 标题 > 辅助文字 > 装饰 UI**

## 11.2 图片比例

### 真人穿搭 Hero

优先 4:5 或 3:4。

### 衣橱 Item

推荐 1:1 容器，内部图片使用 contain。

### 穿搭卡片

优先 4:5。

### AI Before / After

统一画布比例，默认 4:5 或根据原人物图适配。

## 11.3 图片处理

优先：

- WebP
- AVIF
- PNG 仅用于透明衣物资产

衣橱图片必须支持懒加载。

---

# 12. 首页 Information Architecture

首页的核心问题不是“展示所有功能”，而是：

> **今天穿什么？**

推荐结构：

```text
顶部：问候 + 日期
↓
天气摘要
↓
Today's Look Hero
↓
三套每日推荐
↓
快速换装 / AI试穿入口
↓
轻量辅助模块
↓
Bottom Navigation
```

---

# 13. Home Header

参考形式：

```text
早上好，xxx
8月17日 · 星期一
```

右侧可以放：

- 头像
- 设置
- 简洁 icon

不要做复杂导航栏。

---

# 14. Weather Module

天气应该轻量化。

示例：

```text
☀️ 28°
晴
体感 30°
```

可加：

> 适合穿：薄衫 / 轻便 / 少层次

不要占据 Hero 视觉。

---

# 15. Today's Look Hero

这是首页最重要的组件。

推荐：

```text
TODAY'S LOOK

[ 大型真人穿搭图 ]

白色衬衫 + 黑色阔腿裤

28°C · 通勤

[ 查看搭配 ]
```

图片高度应明显大于普通 Card。

人物主体必须成为视觉中心。

---

# 16. Daily Three Looks

必须保留现有三套逻辑：

### LOOK 01
**随机灵感**

> 今天换点不一样的

### LOOK 02
**穿搭法则**

> 今天学一个搭配技巧

### LOOK 03
**我的风格**

> 根据你喜欢的穿搭推荐

## 布局原则

不要做成三个等权重 Dashboard Card。

推荐：

- 第一套 Featured
- 第二、第三套作为小卡片
- 移动端可使用横向滑动

---

# 17. Outfit Card

建议结构：

```text
[4:5 穿搭图]

LOOK 02
穿搭法则

上松下紧

白衬衫 · 黑阔腿裤 · 乐福鞋

[换一套]
```

图片应占据卡片大部分面积。

---

# 18. Wardrobe Page

页面标题：

> **我的衣橱**

副信息：

> 47 件单品

分类横向滚动：

```text
全部 / 上衣 / 外套 / 裤子 / 裙子 / 鞋 / 包 / 配饰
```

图片 Grid：

- mobile 2–3 列
- larger mobile 3–4 列
- desktop 使用更宽的自适应网格

不要使用表格。

---

# 19. Empty Wardrobe State

衣橱为空时必须有非常强的引导。

```text
把你的第一套穿搭放进来

上传一张以前的穿搭照片
AI 帮你拆成独立单品

[ 添加我的第一套穿搭 ]
```

按钮是玫瑰粉 Primary CTA。

---

# 20. Add Wardrobe Flow

入口：

```text
＋ 添加衣物
```

展开：

1. 从穿搭照片添加
2. 单件衣物添加

不要出现复杂表单作为第一步。

---

# 21. Wardrobe Item Card

衣橱单品卡片：

```text
[ 图片 ]
白色衬衫
上衣
```

图片占主位。

名称最多两行。

不要直接展示：

- ID
- source
- confidence
- 原始文件名
- technical metadata

技术信息仅在编辑/开发场景显示。

---

# 22. Dress-up / 换装页

这是 LOOK 的第二核心页面。

结构：

```text
← 换装间

[ 大型真人模特 / 用户照片 ]

❤️ 收藏

————————

上衣
[ ] [ ] [ ] [ ]

外套
[ ] [ ] [ ]

下装
[ ] [ ] [ ]

鞋
[ ] [ ]

包
[ ] [ ]
```

人物区域应占据页面主要高度。

底部选择器采用横向滚动。

---

# 23. Quick Try-on Interaction

用户点击衣服：

> 立即替换。

目标：

- 本地完成
- 视觉响应 <1s
- 不显示 loading
- 不调用 VTON

这是免费、高频、游戏化的核心体验。

---

# 24. AI Try-On CTA

在当前穿搭满意时展示：

```text
✨ AI 真实试穿
```

视觉层级明显高于普通操作，但不要喧宾夺主。

文案只强调用户价值，不显示：

- provider
- API
- model
- task_id

这些只出现在 Lab。

---

# 25. AI Try-On Result

核心视觉：

```text
原图
   ↔
AI 试穿
```

推荐用：

- 左右滑块对比
- 或双列 Before / After

必须保留：

- ❤️ 收藏
- 📂 保存穿搭
- 🔄 再试一次

可显示轻量状态：

> 生成约 10 秒

但不要强调技术参数。

---

# 26. Before / After Style

两个图片区域必须：

- 比例一致
- 容器一致
- 圆角一致
- 对齐一致

不要让 Before 和 After 视觉大小不一样。

After 是主要结果，但不要放大到压缩 Before。

---

# 27. Outfit Detail

穿搭详情页面：

```text
LOOK 02
穿搭法则

[ 大图 ]

上松下紧

白色衬衫
黑色阔腿裤
乐福鞋

为什么这样搭？
...

[换一件] [AI试穿] [收藏]
```

---

# 28. Styling Rules

参考图展示的“穿搭法则”应被设计成可读、可视化的小卡片。

示例：

```text
三色原则

● 黑
● 白
● 米

全身主色尽量不超过三种
```

可配：

- 色块
- 小型示意人物
- 极简短说明

不要做课程列表。

---

# 29. Favorites

标题：

> **我的收藏**

视觉应该像：

> 我的穿搭画廊

而不是收藏管理后台。

使用图片网格。

每张卡片只保留非常轻的：

- 心形
- 日期（可选）
- 简短名称

---

# 30. Outfit Calendar

展示用户历史穿搭。

推荐：

```text
8月

一 二 三 四 五 六 日

 1  2  3  4  5  6  7
   [图][图][图]

 8  9 10 11 12 13 14
[图][图][图]
```

缩略图必须清晰可辨。

---

# 31. Personal Style Page

标题：

> **我的风格**

内容：

```text
极简   86%
休闲   72%
通勤   68%
甜美   31%
复古   24%
```

然后：

```text
你常穿
黑 / 白 / 米 / 牛仔

你偏爱
宽松 / 简约 / 低饱和
```

如果真实数据不足：

> 显示待积累状态，不得伪造数据。

---

# 32. Bottom Navigation

推荐：

```text
首页   衣橱   换装   收藏   我的
```

图标：

- 细线 icon
- 小尺寸
- 选中使用 accent 粉色
- 未选中使用灰色

“换装”可以略微突出，但不做巨大中心按钮。

Bottom Nav：

- 半透明/暖白
- 支持 safe-area
- 避免遮挡内容
- iOS PWA 必须适配底部安全区域

---

# 33. Mobile Layout

优先级：

### 375px
必须完整可用。

### 390px
主优化尺寸。

### 430px
扩展留白，不强行放大 UI。

## 手机页面原则

- 横向不产生滚动条
- 图片不变形
- CTA 易于单手点击
- 最小点击区域 ≥44px
- 底部安全区处理正确

---

# 34. Desktop Layout

Desktop 不应该简单放大 Mobile 页面。

推荐最大内容宽度：

```text
1180–1320px
```

居中。

大屏可以：

- 左侧内容 / 右侧 Hero
- 双列卡片
- 更宽的衣橱 Grid

但视觉原则保持与 Mobile 一致。

---

# 35. Responsive Rules

## 375–767px

Mobile-first：

- 单列
- 横滑 Chips
- Horizontal Outfit Carousel
- Bottom Navigation

## 768–1023px

Tablet：

- 2列内容
- 更大图片

## 1024px+

Desktop：

- 双列 / 三列
- 更大留白
- 内容限制在 max-width

---

# 36. Animation

动效应该轻而快。

推荐：

```text
duration: 200–300ms
curve: ease-out
```

## 换装

- crossfade
- slight scale

## 收藏

- heart scale 0.9 → 1.05 → 1

## 页面切换

- fade / slide very lightly

禁止：

- 大幅弹跳
- 复杂 3D
- 粒子
- 过度炫技

---

# 37. Loading States

普通本地换装：

> 不显示 loading。

AI 试穿：

显示：

```text
正在生成你的穿搭效果…
```

可轮换：

- 正在调整服装比例…
- 正在优化穿搭效果…
- 马上就好…

避免“AI正在调用API”这类技术化文案。

---

# 38. Empty States

Empty State 必须：

- 有视觉中心
- 有一句说明
- 一个明确 CTA
- 不显示错误码

例如：

### 衣橱为空

> 从一套穿搭开始建立你的衣橱。

[添加我的第一套穿搭]

### 收藏为空

> 喜欢的搭配都会在这里。

[去看看今天穿什么]

---

# 39. Error States

错误文案面向普通用户。

不要显示：

- API error
- Provider error
- 401
- 429
- task_id

例如：

> 这张照片可能不太适合试穿。换一张正面全身照片试试。

操作：

- 重新上传
- 换一张
- 手动添加

---

# 40. Beta / Lab 与正式产品的视觉隔离

正式产品：

> 高级、简单、无技术术语。

Lab：

允许显示：

- Provider
- 耗时
- Cost
- task_id
- error code
- Benchmark

Lab 与正式 App 不得混用视觉语言。

---

# 41. 参考图中的数字模块如何转化成产品功能

参考图模块映射：

```text
01 拍照识别
→ 从穿搭照片添加

02 专属模特
→ 我的模特 / 用户照片

03 自由换装
→ 换装间

04 每日推荐
→ 首页

05 个性调整
→ 推荐详情 / 换一件

06 我的衣橱
→ 衣橱

07 穿搭感 & 学习
→ 穿搭法则

08 收藏 & 喜欢
→ 收藏

09 记录穿搭日记
→ 穿搭日历

10 越用越懂你
→ 个人风格
```

这十个模块应在整个产品中构成统一的信息架构。

---

# 42. 真人模特策略

正式产品视觉优先：

1. 用户自己的真人照片
2. 获授权的真人虚拟模特
3. AI生成且拥有明确使用权限的模特

避免正式产品主视觉长期依赖：

- 卡通人
- 线稿人
- SVG 人物

卡通/插画可作为空状态或辅助插图，但不是核心 Hero。

---

# 43. 视觉优先级

每个页面都必须遵循：

```text
1. 人物 / 穿搭图
2. 当前状态 / 主要标题
3. 主操作
4. 辅助信息
5. 装饰
```

任何时候如果 UI 文本过多导致人物图片变小：

> 优先删文字，不优先缩人物。

---

# 44. Content Tone

文案应：

- 轻
- 短
- 女性化
- 自然
- 有一点生活方式品牌气质

示例：

推荐：

> 今天穿什么？

> 今天换点不一样的。

> 要不要试试这套？

> 这样搭，很适合今天。

避免：

> AI Recommendation Result

> Generating Outfit JSON

> Provider: Alibaba

> Confidence: 0.92

---

# 45. Accessibility

必须保证：

- 文本与背景足够对比
- CTA 不只依赖颜色识别
- 图片提供 alt
- 触控区 ≥44px
- 动效支持 reduced-motion

---

# 46. Performance

LOOK 是图片密集型应用。

必须：

- 图片懒加载
- WebP/AVIF 优先
- Hero 图片优先级最高
- 避免一次渲染全部衣橱图片
- 换装仅更新发生变化的 Layer
- AI 结果延迟加载

不能为了视觉效果把首页加载变慢。

---

# 47. Component Architecture

推荐组件层级：

```text
/components/look/

  LookPageShell
  LookHeader
  WeatherSummary
  HeroOutfitCard
  OutfitCard
  OutfitCarousel
  WardrobeGrid
  WardrobeItemCard
  CategoryChip
  PrimaryButton
  SecondaryButton
  AITryOnButton
  TryOnResult
  BeforeAfter
  StyleRuleCard
  FavoriteGrid
  OutfitCalendar
  StyleProfile
  BottomNavigation
```

组件必须尽量无业务耦合。

---

# 48. Design Token Implementation

建议把视觉 Token 独立维护：

```text
styles/
  tokens.css
  theme.css
```

或使用项目现有 Tailwind Theme。

避免每个页面出现大量硬编码颜色和 spacing。

---

# 49. 与现有业务的关系

UI 重构阶段必须保留：

- IndexedDB
- WardrobeItem
- Outfit
- Favorite
- DailyRecommendation
- UserModel
- VTON Provider
- Alibaba AITryOn
- Local Layer
- Local Segmentation
- Beta Analytics

视觉层必须作为“壳”重新表达这些能力。

---

# 50. UI 重构开发顺序

必须严格遵守：

## UI-01
Design Tokens

## UI-02
基础组件

## UI-03
首页

## UI-04
衣橱

## UI-05
换装

## UI-06
穿搭详情

## UI-07
AI 试穿结果

## UI-08
收藏

## UI-09
我的 / 风格

## UI-10
响应式与 iOS PWA QA

每完成一个阶段先回归，再进入下一个。

---

# 51. Visual QA Checklist

每次 UI 修改后至少检查：

- [ ] 是否仍然具有时尚 App 感
- [ ] 是否仍以人物/衣服图片为视觉中心
- [ ] 是否仍然保持暖白 + 玫瑰粉体系
- [ ] 是否出现 Dashboard 感
- [ ] 是否出现过多 Border
- [ ] 是否过度使用 Card
- [ ] 是否出现过多文本
- [ ] 是否影响核心 CTA
- [ ] 是否影响换装速度
- [ ] 是否影响 AI 试穿流程
- [ ] 375px 是否完整
- [ ] 390px 是否完整
- [ ] 430px 是否完整
- [ ] iOS Safe Area 是否正确

---

# 52. “像参考图” 的判断标准

不要通过“颜色像不像”判断。

优先判断：

### A. 信息层级
是否由大图主导？

### B. 空间感
是否有足够留白？

### C. 模块感
是否像精致的时尚卡片，而不是后台卡片？

### D. 色彩
粉色是否只承担 Accent？

### E. 图片比例
人物是否足够大？

### F. 文字密度
是否足够少？

### G. 情绪
是否让人感觉：

> 轻松、漂亮、好玩、愿意每天打开。

---

# 53. Anti-patterns

以下视觉结果视为不合格：

### 1. “粉色后台”
只是给旧页面换粉色。

### 2. “卡片堆”
所有内容都是统一 Card。

### 3. “功能墙”
首页同时展示十几个入口。

### 4. “文字墙”
说明文本比人物图片更突出。

### 5. “AI工具感”
技术词汇、状态码、Provider 出现在正式页面。

### 6. “儿童换装游戏感”
过多高饱和颜色、星星、气泡、跳跃动画。

### 7. “电商后台感”
大量表格、筛选器、列表、边框。

---

# 54. Final Visual Direction

LOOK 最终应该让用户看到：

```text
暖白背景
    ↓
真人穿搭大图
    ↓
简短文案
    ↓
玫瑰粉 CTA
    ↓
轻盈卡片
    ↓
自由换装
    ↓
AI 真实试穿
```

一句话总结：

> **像一本可以穿起来的时尚杂志，又像一个每天都能玩的数字衣橱。**

---

# 55. Agent Implementation Rule

任何 Agent 在修改 LOOK UI 前必须：

1. 阅读本文件。
2. 不凭个人喜好另起设计方向。
3. 优先复用已有组件与业务逻辑。
4. 先做 Design Token，再做页面。
5. 先改一个页面形成样板，再扩展到全站。
6. 每完成一个页面进行移动端截图 QA。
7. 不因为视觉重构而修改 AI、VTON、推荐等业务逻辑。

如果需要在两个视觉方案之间选择：

> 选择更接近本规范、信息更轻、图片更大、文字更少的一种。

---

# 56. Reference Summary

本规范所依据的参考图最重要的四个视觉结论：

1. **人物和服装是第一视觉元素。**
2. **暖白 + 玫瑰粉 + 黑灰构成品牌基础。**
3. **卡片模块化，但不做后台 Dashboard。**
4. **产品体验应该同时具备时尚杂志、数字衣橱、AI Stylist 和换装游戏的感觉。**

---

# END OF LOOK UI REFERENCE SPEC
