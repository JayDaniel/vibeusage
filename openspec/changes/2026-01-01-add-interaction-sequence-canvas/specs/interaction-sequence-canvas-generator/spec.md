# Interaction sequence canvas generator

## ADDED Requirements

### Requirement: Non-interactive generation
系统 SHALL 在单次执行中完成扫描与生成，不得要求用户输入或确认，且不输出中间进度日志。

#### Scenario: Run generator once
- **WHEN** 运行 `node scripts/ops/interaction-sequence-canvas.cjs`
- **THEN** 仅输出最终摘要并生成 `interaction_sequence.canvas`

### Requirement: Default output path and fallback
系统 SHALL 默认输出到 `{repo}/interaction_sequence.canvas`；当根目录不可写时 MUST 回退到 `~/interaction_sequence_<project>.canvas`。

#### Scenario: Fallback path
- **WHEN** 仓库根目录不可写
- **THEN** 输出到用户主目录的备用路径

### Requirement: Mixed scenario selection with stable default
系统 SHALL 默认生成 3 个场景，并 MUST 固定包含 `tracker sync -> vibescore-ingest` 核心场景。

#### Scenario: Default includes core scenario
- **WHEN** 未提供配置文件运行生成器
- **THEN** 输出场景数为 3（或不足 3 时输出可识别的全部）
- **AND** 包含 `tracker sync -> vibescore-ingest` 场景

### Requirement: Config overrides auto selection
系统 SHALL 支持 `interaction_sequence.config.json` 的 `pin`/`exclude` 覆盖自动选择结果。

#### Scenario: Pin is enforced
- **GIVEN** 配置 `pin` 包含 `tracker-sync-ingest`
- **WHEN** 运行生成器
- **THEN** 该场景 MUST 出现在画布中

#### Scenario: Exclude is enforced
- **GIVEN** 配置 `exclude` 包含 `foo-bar`
- **WHEN** 运行生成器
- **THEN** 该场景 MUST 不出现在画布中

### Requirement: Single canvas grouped by scenario
系统 SHALL 在单一画布内按场景分组展示，每个场景组包含生命线与消息节点。

#### Scenario: Scenario group exists
- **WHEN** 生成 `interaction_sequence.canvas`
- **THEN** 每个场景具有独立 `group` 节点

### Requirement: Semantic message labels
系统 SHALL 为每条消息生成语义化标签，包含序号、动作/方法名与摘要。

#### Scenario: Label contains summary
- **WHEN** 生成消息标签
- **THEN** 文本包含序号与简短语义摘要
