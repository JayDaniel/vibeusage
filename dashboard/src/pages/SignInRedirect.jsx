import React, { useCallback, useEffect, useState } from "react";
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
          setError(signInError.message || "Sign in failed");
          setLoading(false);
          return;
        }

        // 登录成功，导航到首页
        navigate("/", { replace: true });
      } catch (err) {
        setError(err?.message || "An unexpected error occurred");
        setLoading(false);
      }
    },
    [email, password, navigate],
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--flat-bg)" }}>
      <div className="w-full max-w-md">
        {/* 标题区域 */}
        <div className="text-center mb-8">
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--flat-text-primary)" }}
          >
            Sign in
          </h1>
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--flat-text-secondary)" }}
          >
            Sign in to access your dashboard
          </p>
        </div>

        {/* 登录表单 */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5 rounded-xl"
          id="sign-in-form"
          style={{
            background: "var(--flat-surface)",
            border: "1px solid var(--flat-border)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          {/* 错误提示 */}
          {error ? (
            <div
              className="p-3 text-sm rounded-lg"
              style={{
                color: "var(--flat-error)",
                borderColor: "rgba(239, 68, 68, 0.3)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                background: "rgba(239, 68, 68, 0.06)",
              }}
            >
              {error}
            </div>
          ) : null}

          {/* 邮箱输入 */}
          <div>
            <label
              htmlFor="sign-in-email"
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--flat-text-primary)" }}
            >
              Email
            </label>
            <input
              id="sign-in-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
              className="w-full px-4 py-3 text-sm rounded-lg outline-none transition-colors"
              placeholder="user@example.com"
              style={{
                background: "var(--flat-surface-hover)",
                border: "1px solid var(--flat-border)",
                color: "var(--flat-text-primary)",
              }}
            />
          </div>

          {/* 密码输入 */}
          <div>
            <label
              htmlFor="sign-in-password"
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--flat-text-primary)" }}
            >
              Password
            </label>
            <input
              id="sign-in-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 text-sm rounded-lg outline-none transition-colors"
              placeholder="••••••••"
              style={{
                background: "var(--flat-surface-hover)",
                border: "1px solid var(--flat-border)",
                color: "var(--flat-text-primary)",
              }}
            />
          </div>

          {/* 登录按钮 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-sm font-semibold rounded-lg transition-all"
            style={{
              background: "var(--flat-accent)",
              color: "#fff",
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          {/* 注册链接 */}
          <div className="text-center pt-2">
            <span
              className="text-sm"
              style={{ color: "var(--flat-text-secondary)" }}
            >
              {"Don't have an account? "}
            </span>
            <a
              href="/sign-up"
              className="text-sm font-medium hover:underline"
              style={{ color: "var(--flat-accent)" }}
              onClick={(e) => {
                e.preventDefault();
                navigate("/sign-up");
              }}
            >
              Sign up
            </a>
          </div>

          {/* 返回首页 */}
          <div className="text-center">
            <a
              href="/"
              className="text-sm hover:underline"
              style={{ color: "var(--flat-text-secondary)" }}
              onClick={(e) => {
                e.preventDefault();
                navigate("/");
              }}
            >
              &larr; Back to home
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
