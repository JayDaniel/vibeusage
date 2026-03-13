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

/// 邮箱密码注册页面，替代原 GitHub OAuth 跳转
/// 使用 Supabase signUp API 创建新账号
/// 注册成功后自动登录并导航到首页
export function SignUpRedirect() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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

  /// 处理邮箱密码注册表单提交
  /// - 校验两次密码输入一致性
  /// - 清除旧的认证状态
  /// - 调用 Supabase signUp 创建账号
  /// - 根据是否需要邮箱验证显示不同结果
  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!email.trim() || !password) return;

      if (password !== confirmPassword) {
        setError("PASSWORD_MISMATCH");
        return;
      }

      if (password.length < 6) {
        setError("PASSWORD_TOO_SHORT (MIN: 6)");
        return;
      }

      setError(null);
      setLoading(true);

      try {
        // 清除旧的认证状态
        await supabaseAuthClient.auth.signOut().catch(() => {});
        clearSupabasePersistentStorage();
        clearAuthStorage();
        clearSessionExpired();
        clearSessionSoftExpired();

        const { data, error: signUpError } = await supabaseAuthClient.auth.signUp({
          email: email.trim(),
          password,
        });

        if (signUpError) {
          setError(signUpError.message || "REGISTRATION_FAILED");
          setLoading(false);
          return;
        }

        // 如果 Supabase 配置了邮箱确认，session 可能为 null
        if (data?.session) {
          // 注册成功且自动登录
          navigate("/", { replace: true });
        } else {
          // 需要邮箱验证
          setSuccess(true);
          setLoading(false);
        }
      } catch (err) {
        setError(err?.message || "UNEXPECTED_ERROR");
        setLoading(false);
      }
    },
    [email, password, confirmPassword, navigate],
  );

  // 邮箱验证提示
  if (success) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="matrix-panel p-6 text-center space-y-4">
            <h2
              className="text-xl font-bold tracking-widest uppercase"
              style={{ color: "var(--matrix-ink)" }}
            >
              VERIFICATION_SENT
            </h2>
            <p
              className="text-sm tracking-wider"
              style={{ color: "var(--matrix-ink-muted)" }}
            >
              A confirmation link has been sent to{" "}
              <span style={{ color: "var(--matrix-ink-bright)" }}>{email}</span>.
              Please check your inbox and click the link to activate your account.
            </p>
            <div className="pt-4">
              <a
                href="/sign-in"
                className="text-sm tracking-wider uppercase hover:underline"
                style={{ color: "var(--matrix-ink)" }}
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/sign-in");
                }}
              >
                $ PROCEED_TO_SIGN_IN
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* 标题区域 */}
        <div className="text-center mb-8">
          <h1
            className="text-2xl font-bold tracking-widest uppercase"
            style={{ color: "var(--matrix-ink)" }}
          >
            SIGN_UP
          </h1>
          <p
            className="mt-2 text-sm tracking-wider uppercase"
            style={{ color: "var(--matrix-ink-muted)" }}
          >
            REGISTER_NEW_IDENTITY
          </p>
        </div>

        {/* 注册表单 */}
        <form
          onSubmit={handleSubmit}
          className="matrix-panel p-6 space-y-5"
          id="sign-up-form"
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
              htmlFor="sign-up-email"
              className="block text-xs tracking-widest uppercase mb-2"
              style={{ color: "var(--matrix-ink-muted)" }}
            >
              EMAIL_ADDRESS
            </label>
            <input
              id="sign-up-email"
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
              htmlFor="sign-up-password"
              className="block text-xs tracking-widest uppercase mb-2"
              style={{ color: "var(--matrix-ink-muted)" }}
            >
              PASSWORD
            </label>
            <input
              id="sign-up-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={6}
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

          {/* 确认密码 */}
          <div>
            <label
              htmlFor="sign-up-confirm-password"
              className="block text-xs tracking-widest uppercase mb-2"
              style={{ color: "var(--matrix-ink-muted)" }}
            >
              CONFIRM_PASSWORD
            </label>
            <input
              id="sign-up-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={6}
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

          {/* 注册按钮 */}
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
            {loading ? "REGISTERING..." : "$ SIGN_UP"}
          </button>

          {/* 登录链接 */}
          <div className="text-center pt-2">
            <span
              className="text-xs tracking-wider uppercase"
              style={{ color: "var(--matrix-ink-dim)" }}
            >
              HAVE_ACCOUNT?{" "}
            </span>
            <a
              href="/sign-in"
              className="text-xs tracking-wider uppercase hover:underline"
              style={{ color: "var(--matrix-ink)" }}
              onClick={(e) => {
                e.preventDefault();
                navigate("/sign-in");
              }}
            >
              SIGN_IN
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
