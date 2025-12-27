# 用量缩写与安全浏览器访问设计

## 目标
- 统一用量缩写规则（四舍五入并允许进位），避免 1000K 这类异常展示。
- 当 clipboard / localStorage 不可用时，UpgradeAlertModal 不抛错，交互稳定。
- 文案仍严格来自 copy registry。

## 方案
### 1) 紧凑数字格式
- 在 `dashboard/src/lib/format.js` 提供 `formatCompactNumber`。
- 规则：
  - `< 1000` 直接返回原值字符串。
  - `>= 1000` 使用 K，`>= 1,000,000` 使用 M。
  - 1 位小数四舍五入；若 K 进位到 1000.0K，自动转换为 1.0M。
  - 输出去掉尾随 `.0`（如 1.0K → 1K）。
- K/M 后缀来自 `copy.csv`（`shared.unit.thousand_abbrev`、`shared.unit.million_abbrev`）。

### 2) 安全浏览器访问
- 新增 `dashboard/src/lib/safe-browser.js`：
  - `safeGetItem` / `safeSetItem`：localStorage 不可用时返回 `null/false`。
  - `safeWriteClipboard`：clipboard 不可用时返回 `false`。
- `UpgradeAlertModal` 使用上述函数，保持 UI 行为但避免抛错。

## 测试策略
- 新增单测：`test/compact-number.test.js` 覆盖边界值与进位。
- 新增单测：`test/safe-browser.test.js` 覆盖不可用与异常场景。

## 验证
- `node --test test/compact-number.test.js test/safe-browser.test.js`
