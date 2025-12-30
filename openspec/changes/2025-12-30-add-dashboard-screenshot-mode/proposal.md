# Change: Dashboard screenshot mode

## Why
需要为 Dashboard 生成窄屏截图，用于对外展示，同时避免影响正常使用路径。

## What Changes
- 新增截图模式开关（查询参数 `screenshot=1|true`）。
- 截图模式下收窄 Dashboard 内容宽度，形成单列纵向布局。
- 截图模式下隐藏安装区与明细表。
- 截图模式下隐藏 Core Index 的四项输入明细模块。

## Impact
- Affected specs: `dashboard-screenshot-mode`
- Affected code: `dashboard/src/pages/DashboardPage.jsx`, `dashboard/src/ui/matrix-a/layout/MatrixShell.jsx`
