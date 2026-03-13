import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  storePostAuthPathFromSearch,
  storeRedirectFromSearch,
  stripNextParam,
  stripRedirectParam,
} from "../lib/auth-redirect";
import {
  clearAuthStorage,
  clearSessionExpired,
  clearSessionSoftExpired,
} from "../lib/auth-storage";
import { supabaseAuthClient } from "../lib/supabase-auth-client";
import { clearSupabasePersistentStorage } from "../lib/supabase-client";

/// 邮箱密码登录页面，替代原 GitHub OAuth 跳转
/// 使用 Supabase signInWithPassword API 完成认证
/// 登录成功后 session 自动持久化到 localStorage
export function SignInRedirect() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const { saved } = storeRedirectFromSearch(window.location.search);
    const { saved: nextSaved } = storePostAuthPathFromSearch(window.location.search);
    if (!saved && !nextSaved) return;

    let nextUrl = window.location.href;
    const strippedRedirect = stripRedirectParam(nextUrl);
    if (strippedRedirect) nextUrl = strippedRedirect;
    const strippedNext = stripNextParam(nextUrl);
    if (strippedNext) nextUrl = strippedNext;
    if (!nextUrl || nextUrl === window.location.href) return;
    window.history.replaceState(null, "", nextUrl);
  }, []);

  /// 处理邮箱密码登录表单提交
  /// - 清除旧的认证状态
  /// - 调用 Supabase signInWithPassword
  /// - 成功后导航到首页，失败则显示错误信息
  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!email.trim() || !password) return;

      setError(null);
      setLoading(true);

      try {
        // 清除旧的认证状态
        await supabaseAuthClient.auth.signOut().catch(() => {});
        clearSupabasePersistentStorage();
        clearAuthStorage();
        clearSessionExpired();
        clearSessionSoftExpired();

        const { error: signInError } = await supabaseAuthClient.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          setError(signInError.message || "LOGIN_FAILED");
          setLoading(false);
          return;
        }

        // 登录成功，导航到首页
        navigate("/", { replace: true });
      } catch (err) {
        setError(err?.message || "UNEXPECTED_ERROR");
        setLoading(false);
      }
    },
    [email, password, navigate],
  );

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* 标题区域 */}
        <div className="text-center mb-8">
          <h1
            className="text-2xl font-bold tracking-widest uppercase"
            style={{ color: "var(--matrix-ink)" }}
          >
            SIGN_IN
          </h1>
          <p
            className="mt-2 text-sm tracking-wider uppercase"
            style={{ color: "var(--matrix-ink-muted)" }}
          >
            AUTHENTICATE_TO_ACCESS_DASHBOARD
          </p>
        </div>

        {/* 登录表单 */}
        <form
          onSubmit={handleSubmit}
          className="matrix-panel p-6 space-y-5"
          id="sign-in-form"
        >
          {/* 错误提示 */}
          {error ? (
            <div
              className="p-3 text-sm tracking-wider uppercase border"
              style={{
                color: "#ff4444",
                borderColor: "rgba(255, 68, 68, 0.3)",
                background: "rgba(255, 68, 68, 0.08)",
              }}
            >
              ERROR: {error}
            </div>
          ) : null}

          {/* 邮箱输入 */}
          <div>
            <label
              htmlFor="sign-in-email"
              className="block text-xs tracking-widest uppercase mb-2"
              style={{ color: "var(--matrix-ink-muted)" }}
            >
              EMAIL_ADDRESS
            </label>
            <input
              id="sign-in-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
              className="w-full px-4 py-3 text-sm tracking-wider outline-none"
              placeholder="user@example.com"
              style={{
                background: "rgba(0, 10, 0, 0.6)",
                border: "1px solid var(--matrix-panel-border)",
                color: "var(--matrix-ink-bright)",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* 密码输入 */}
          <div>
            <label
              htmlFor="sign-in-password"
              className="block text-xs tracking-widest uppercase mb-2"
              style={{ color: "var(--matrix-ink-muted)" }}
            >
              PASSWORD
            </label>
            <input
              id="sign-in-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 text-sm tracking-wider outline-none"
              placeholder="••••••••"
              style={{
                background: "rgba(0, 10, 0, 0.6)",
                border: "1px solid var(--matrix-panel-border)",
                color: "var(--matrix-ink-bright)",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* 登录按钮 */}
          <button
            type="submit"
            disabled={loading}
            className="matrix-header-chip matrix-header-chip--solid matrix-header-action w-full justify-center"
            style={{
              height: 48,
              fontSize: "14px",
              letterSpacing: "0.2em",
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "AUTHENTICATING..." : "$ SIGN_IN"}
          </button>

          {/* 注册链接 */}
          <div className="text-center pt-2">
            <span
              className="text-xs tracking-wider uppercase"
              style={{ color: "var(--matrix-ink-dim)" }}
            >
              NO_ACCOUNT?{" "}
            </span>
            <a
              href="/sign-up"
              className="text-xs tracking-wider uppercase hover:underline"
              style={{ color: "var(--matrix-ink)" }}
              onClick={(e) => {
                e.preventDefault();
                navigate("/sign-up");
              }}
            >
              REGISTER_NEW
            </a>
          </div>

          {/* 返回首页 */}
          <div className="text-center">
            <a
              href="/"
              className="text-xs tracking-wider uppercase hover:underline"
              style={{ color: "var(--matrix-ink-dim)" }}
              onClick={(e) => {
                e.preventDefault();
                navigate("/");
              }}
            >
              &lt; BACK_TO_HOME
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
