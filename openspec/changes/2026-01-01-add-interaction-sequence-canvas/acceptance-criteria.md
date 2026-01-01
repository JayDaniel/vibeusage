# Acceptance Criteria

## Feature: 交互序列图生成器（多场景单画布）

### Requirement: 非交互式生成与摘要输出
- Rationale: 保证脚本可用于 CI/自动化，无需人工干预。

#### Scenario: 单次运行生成输出
- **WHEN** 运行 `node scripts/ops/interaction-sequence-canvas.cjs`
- **THEN** 仅输出最终摘要并生成 `interaction_sequence.canvas`

### Requirement: 默认三场景 + 固定核心场景
- Rationale: 频繁更新需要稳定锚点与可读性平衡。

#### Scenario: 默认包含核心场景
- **WHEN** 未提供配置文件运行生成器
- **THEN** 输出场景数为 3（或不足 3 时输出可识别的全部）
- **AND** 场景中包含 `tracker sync -> vibescore-ingest`

### Requirement: 配置覆盖自动选择
- Rationale: 允许维护者稳定叙事、排除噪声场景。

#### Scenario: Pin 场景被保留
- **GIVEN** `interaction_sequence.config.json` 含 `pin: ["tracker-sync-ingest"]`
- **WHEN** 运行生成器
- **THEN** 该场景 MUST 出现在画布中

#### Scenario: Exclude 场景被移除
- **GIVEN** `interaction_sequence.config.json` 含 `exclude: ["foo-bar"]`
- **WHEN** 运行生成器
- **THEN** 该场景 MUST 不出现在画布中

### Requirement: 单画布分组展示
- Rationale: 在统一视野内对比多个核心交互流程。

#### Scenario: 场景分组可识别
- **WHEN** 生成 `interaction_sequence.canvas`
- **THEN** 每个场景应有独立 group 节点
- **AND** 组内包含对应生命线与消息标签

### Requirement: 语义化消息标签
- Rationale: 降低认知成本，快速理解调用语义。

#### Scenario: 标签包含序号与摘要
- **WHEN** 生成消息标签
- **THEN** 文本包含序号、方法或动作名、以及简短语义摘要
