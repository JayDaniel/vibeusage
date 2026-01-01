## Context
交互序列图需要频繁更新，人工维护成本高且容易偏离真实代码。现有 `architecture.canvas` 生成器提供了结构级视图，但缺少“端到端交互叙事”。本变更新增离线序列图生成器，基于静态启发式识别核心场景并输出单画布多场景视图。

## Goals / Non-Goals
- Goals:
  - 单次运行生成 `interaction_sequence.canvas`（非交互、仅摘要）。
  - 默认 3 场景，固定包含 `tracker sync -> vibescore-ingest`。
  - 允许 `pin/exclude` 覆盖自动选择。
- Non-Goals:
  - 不引入外部 AI/ML 服务。
  - 不采集运行时日志或真实请求。
  - 不改变生产路径与接口。

## Decisions
- Decision: 使用脚本 `scripts/ops/interaction-sequence-canvas.cjs`，不扩展 `architecture-canvas`。
  - Why: 语义与数据模型差异大，降低耦合。
- Decision: 混合场景选择（自动 Top N + pin/exclude）。
  - Why: 兼顾自动化与叙事稳定性。

## Scenario Selection
1. 预定义“核心场景候选集”（如 `tracker-sync-ingest`）。
2. 自动识别：
   - CLI 命令入口（`src/commands/*.js`）
   - 关键上传链路（`src/lib/uploader.js` → `src/lib/vibescore-api.js`）
   - Edge Function（`insforge-src/functions/*`）
3. 评分规则（示例）：跨边界调用 + 入口层权重 + 关键模块命中。
4. 合并策略：`pin` 先入选 → 排除 `exclude` → 补齐 Top N。

## Config Schema (interaction_sequence.config.json)
```json
{
  "version": 1,
  "max_scenarios": 3,
  "pin": ["tracker-sync-ingest"],
  "exclude": [],
  "labels": {
    "tracker-sync-ingest": "Tracker Sync → Ingest"
  }
}
```
- `pin/exclude` 使用场景 ID；`labels` 可覆盖展示标题。

## Canvas Layout
- 单画布纵向布局；每个场景作为一个 `group` 分区。
- 场景内：生命线顶部对齐，消息从上到下排列。
- 消息标签使用 `text` 节点；边只负责连接，不承担语义。

## Message Labeling
- 格式：`{index}. {action}({key params})` + `AI:` 摘要。
- 调用类型以标签前缀标记（如 `[sync]`/`[async]`/`[return]`）。

## Error Handling
- 配置缺失或非法：回退默认配置并记录 warning。
- 输出不可写：回退到 `~/interaction_sequence_<project>.canvas`。
