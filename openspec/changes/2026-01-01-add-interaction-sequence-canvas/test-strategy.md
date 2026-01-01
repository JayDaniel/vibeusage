# Test Strategy

## Objectives
- 验证生成器默认输出与场景选择策略。
- 确认 `pin/exclude` 配置覆盖逻辑。
- 保证输出 Canvas 结构完整且可读。

## Test Levels
- Unit:
  - 配置解析（默认值、pin/exclude、max_scenarios）。
  - 场景选择（自动识别 + 混合合并）。
- Integration:
  - 运行脚本生成 `interaction_sequence.canvas`，验证包含固定场景与分组节点。
- Regression:
  - `npm test` 全量通过。

## Test Matrix
- 默认配置 -> Integration -> 输出 3 场景并包含 `tracker sync -> vibescore-ingest`。
- Pin 覆盖 -> Unit/Integration -> 指定场景必出现。
- Exclude 覆盖 -> Unit -> 指定场景不出现。

## Environments
- 本地 Node.js（仓库测试环境）。

## Automation Plan
- 新增 `test/interaction-sequence-canvas.test.js`：
  - 验证文件存在、节点/边数量 > 0。
  - 验证固定场景标签出现。
- 可选：引入 `--out` 到临时目录以避免污染。

## Entry / Exit Criteria
- Entry: OpenSpec change 已审批。
- Exit: 单元/集成测试通过，回归声明记录。

## Coverage Risks
- 启发式场景识别可能漂移；依赖 `pin` 作为稳定锚点。
