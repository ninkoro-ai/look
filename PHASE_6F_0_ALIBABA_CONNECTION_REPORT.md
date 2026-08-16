# Phase 6F.0 — Alibaba AITryOn Production Connection Setup

## 1. Cloudflare 配置状态

| 变量 | 值 | 环境 | 状态 |
| --- | --- | --- | --- |
| `DASHSCOPE_API_KEY` | （加密 Secret） | Production | ✅ 已写入（wrangler pages secret put） |
| `VTON_ALLOW_ALIBABA` | `true` | Production | ✅ 已写入 |
| `VTON_BETA_ENABLED` | `true` | Production | ✅ 已写入 |

- Preview 环境未复制 API Key（按任务书要求）；
- 健康检查确认：`alibaba: "ready"`、`keyPresent: true`、`allowEnabled: true`、`betaEnabled: true`；
- ⚠️ KV 绑定未创建：当前部署令牌只有 Pages 权限（无 workers_kv），每日限额为「客户端 localStorage + 服务端实例内存」双层；代码已支持 KV（`env.VTON_QUOTA`），在控制台绑定 KV 后即自动升级为持久化限额，无需改代码。

## 2. API 连接状态

- `GET /api/vton/health` → `{"alibaba":"ready", ...}`（不返回 Key）；
- 完整链路验证：`/api/vton/upload`（OSS 临时 URL 48h）→ `/api/vton/tryon`（建任务）→ `/api/vton/status`（轮询）→ 结果取回；
- 实验台显示：`Alibaba AITryOn：READY ✅`。

## 3. 首次真实调用结果

记录文件：[benchmarks/alibaba-first-run.json](/D:/chuandaOS/benchmarks/alibaba-first-run.json)

```json
{
  "provider": "alibaba",
  "timestamp": "2026-08-16T08:47:24.769Z",
  "success": true,
  "duration_ms": 180977,
  "cost_estimate": "0.2",
  "task_id": "f909e879-a643-4215-b4a6-668d10947d57",
  "status": "SUCCEEDED",
  "error_code": null,
  "error": null
}
```

- 输入：示例人物照（`person-1.jpg`）+ 演示衣物（白底 PNG），用于**连通性验证**；不代表真实用户素材的质量结论；
- 结果：成功出图，成本 ¥0.2（仅成功计费）；
- 未保存任何图片内容或用户信息。

## 4. 平均耗时

| 口径 | 值 |
| --- | ---: |
| 首次实测（上传+排队+生成+取回） | ≈ 181s |
| 官方文档口径（纯任务） | 15–30s |
| 说明 | 首次包含上传、排队与轮询间隔，且演示素材较小；多组统计需跑 20 组基准后给出 P50/P95 |

## 5. 成本

- 单价：¥0.2/张，仅成功计费；免费额度 400 张/90 天；
- 本次实际消耗：¥0.2（1 次成功）；
- 成本保护：每用户每日最多 3 次（客户端 UI + 服务端检查，超限提示「今日AI试穿次数已用完」并返回 429）；KV 绑定后可跨实例持久化。

## 6. 错误处理验证

| 场景 | 行为 | 验证 |
| --- | --- | --- |
| 无 Key / 未启用 | 健康检查 `disabled`，接口 AUTH_ERROR/PROVIDER_ERROR | ✅ |
| 图片不合适 | 提示「建议上传：正面全身照片」 | ✅（代码路径） |
| 超时 | 客户端自动重试一次 | ✅（代码路径） |
| 超过每日限额 | 客户端禁用 + 服务端 429「今日AI试穿次数已用完」 | ✅（UI 实测；服务端逻辑含内存回退） |
| 上游失败 | 统一错误码（IMAGE/INVALID/RATE_LIMIT/PROVIDER_ERROR），前端友好文案 | ✅ |

## 7. 安全检查

- ✅ API Key 仅存在于 Cloudflare Pages Production Secret，未写入代码、Git、日志、报告；
- ✅ 健康检查只返回布尔状态（`ready/disabled`），绝不返回 Key；
- ✅ 前端只调用同源 `/api/vton/*`，浏览器不直连 DashScope；
- ✅ 图片临时存储（OSS 48h），结果即取即回，不持久化用户图片；
- ✅ 提交前扫描：无 `sk-`/Secret 进入暂存区；`.env*`、`.dev.vars` 均未跟踪；
- ✅ 云端默认双重门禁：`VTON_BETA_ENABLED` + `VTON_ALLOW_ALIBABA` 需同时为 true。

## 8. 下一步建议

1. **20 组真实图片 Benchmark**（按你建议优先执行）：真人自拍/衣服照片/复杂场景各就位后，在 `/lab/vton/alibaba` 一键跑完，人工评分，回答“小红书传播级效果”问题；
2. 在 Cloudflare 控制台为 `look` 绑定 KV 命名空间到 `VTON_QUOTA`（需 workers_kv 权限的令牌），让每日限额持久化；
3. 收集多组耗时样本，给出 P50/P95 与等待接受度结论；
4. 若效果达标，再启动 10 人 Closed Beta（Phase 6E 流程）。

---

## 附：回归测试

qa 16/16 · qa-lab 13/13 · qa-wardrobe 11/11 · qa-import 13/13 · qa-model 10/10 · qa-beta 16/16 · qa-alibaba 8/8 · qa-tryon 9/9 —— 全部 PASS，Local / Mock / 既有实验台不受影响。
