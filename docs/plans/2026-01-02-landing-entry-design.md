# Landing 默认入口（未登录/会话过期）设计

## 背景
当前入口逻辑在 `sessionExpired` 为真时仍允许进入 Dashboard，导致用户在会话过期后无法回到 Landing。需求是让未登录或会话过期的用户进入项目时默认落到 Landing。

## 目标
- 未登录或 `sessionExpired` 为真时，默认渲染 Landing。
- 保持 mock 模式用于开发/演示时直达 Dashboard。
- 保持 Poster 仅在已登录或 mock 时可见。

## 非目标
- 不新增路由后缀或 URL 规则。
- 不调整鉴权/数据请求链路。

## 架构与组件
变更集中在 `dashboard/src/App.jsx` 的页面分发逻辑，不新增模块。`useAuth` 仍为单一真源，`signedIn` 由 `accessToken` + `!sessionExpired` 决定。Landing 与 Dashboard 组件本身不改动。

## 数据流
`useAuth` 读取本地 auth/session 状态 → `App` 根据 `signedIn` 与 `mockEnabled` 决定渲染 Landing 或 Dashboard。`sessionExpired` 被视为未登录，从而落回 Landing。Poster 仅在已登录或 mock 时生效。

## 异常与边界
- 存储读写失败不引入新分支，仍使用既有容错。
- 不做自动跳转，仅调整渲染分支，避免影响浏览器历史或回调流程。

## 测试策略
- 更新现有回归测试，验证 `sessionExpired` 不再阻挡 Landing。
- 增加断言确保 mock 模式仍可绕过 Landing。
- 运行 `node --test test/dashboard-session-expired-banner.test.js` 并记录结果。
