# Change: Obsidian Canvas 交互序列图生成器

## Why
当前交互序列图需要人工提炼与维护，更新频繁且易与真实代码脱节。需要一个可重复、非交互的生成器，以低成本持续产出“核心交互场景”的 Obsidian Canvas 序列图，保证叙事稳定与可追踪性。

## What Changes
- 新增 `interaction_sequence.canvas` 生成脚本（非交互、仅输出最终摘要）。
- 提供混合场景选择策略：自动识别 Top N + `pin/exclude` 配置覆盖。
- 单一画布内按场景分组展示，包含生命线、消息序列与语义化标签。
- 增加配置文件 `interaction_sequence.config.json`（repo root）与文档说明。

## Impact
- Affected specs: `interaction-sequence-canvas-generator`
- Affected code: `scripts/ops/`（新增生成脚本与测试），文档新增。
- 风险：仅影响离线工具，不影响运行时路径。
