# Interaction Sequence Canvas 生成器

## 目的
自动生成 Obsidian Canvas 序列图（`interaction_sequence.canvas`），以单画布多场景分组的方式展示核心交互路径，并保持可重复更新。

## 使用方式
在仓库根目录运行：

```bash
node scripts/ops/interaction-sequence-canvas.cjs
```

可选参数：
- `--root <path>`：指定扫描根目录（默认当前目录）
- `--out <path>`：指定输出路径（默认 `<root>/interaction_sequence.canvas`）
- `--config <path>`：指定配置路径（默认 `<root>/interaction_sequence.config.json`）

## 输出说明
- 默认输出：`<repo>/interaction_sequence.canvas`
- 若根目录不可写：回退到 `~/interaction_sequence_<project>.canvas`
- 仅输出最终摘要（无中间日志）

## 配置文件
默认配置位于仓库根目录：`interaction_sequence.config.json`

```json
{
  "version": 1,
  "max_scenarios": 3,
  "pin": ["tracker-sync-ingest"],
  "exclude": [],
  "labels": {
    "tracker-sync-ingest": "Tracker Sync -> Ingest"
  }
}
```

字段说明：
- `max_scenarios`：默认场景数量上限（1-7）。
- `pin`：固定场景 ID 列表（优先保留）。
- `exclude`：排除场景 ID 列表（覆盖自动选择）。
- `labels`：场景标题覆盖（可选）。

## 场景与布局规则
- 单画布内按场景分组（group）展示。
- 每个场景包含生命线与消息标签。
- 消息标签包含序号、动作名与语义摘要。
