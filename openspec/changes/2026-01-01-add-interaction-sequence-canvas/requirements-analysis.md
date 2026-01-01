# Requirement Analysis

## Goal
- 生成单一 Obsidian Canvas 文件 `interaction_sequence.canvas`，在同一画布内以分组方式展示 3 个核心交互场景，且至少固定包含 `tracker sync -> vibescore-ingest` 场景。

## Scope
- In scope:
  - 非交互式生成脚本（`scripts/ops/interaction-sequence-canvas.cjs`）。
  - 混合场景选择（自动 Top N + `pin/exclude` 配置）。
  - 语义化消息标签、生命线与场景分组布局。
  - 配置文件 `interaction_sequence.config.json` 与文档。
  - 基本测试与回归声明。
- Out of scope:
  - 运行时埋点或真实流量追踪。
  - 机器学习模型或外部 AI 服务。
  - 交互式 UI 编辑器或实时协同。

## Users / Actors
- 维护者（需要持续更新序列图）。
- 贡献者（需要快速理解核心交互路径）。

## Inputs
- 代码仓库内的入口文件与命名约定（如 `src/commands/*`、`insforge-src/functions/*`）。
- 可选配置：`interaction_sequence.config.json`（`pin`/`exclude`/`max_scenarios`）。

## Outputs
- `interaction_sequence.canvas`（Obsidian Canvas JSON）。
- 终端摘要输出（场景数量、消息数量、最大深度）。

## Business Rules
- 生成过程 MUST 非交互，且仅输出最终摘要。
- 默认场景数量 MUST 为 3，且 MUST 包含固定场景 `tracker sync -> vibescore-ingest`。
- `pin/exclude` 配置 MUST 覆盖自动选择结果。
- 单画布内 MUST 以分组形式呈现场景，场景内包含生命线与消息序列。

## Assumptions
- 以路径/命名/调用关系的静态启发式足以识别核心场景。
- 现有代码入口（`sync`、`vibescore-ingest`）保持稳定。

## Dependencies
- `src/commands/sync.js`、`src/lib/rollout.js`、`src/lib/uploader.js`、`src/lib/vibescore-api.js`。
- `insforge-src/functions/vibescore-ingest.js`、`insforge-src/functions/vibescore-sync-ping.js`。
- Node.js 运行环境（仓库脚本风格）。

## Risks
- 场景识别偏差导致输出不可读或场景漂移。
  - Mitigation: 提供 `pin/exclude` 配置，且默认固定关键场景。
- 画布过密导致认知负荷上升。
  - Mitigation: 默认 N=3，场景分组布局。
