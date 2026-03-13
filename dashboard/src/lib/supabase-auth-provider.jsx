import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Supabase Auth React 上下文，替代 旧版 InsforgeProvider / useAuth。
 *
 * 提供 isLoaded、isSignedIn、signOut 三个核心状态，与 App.jsx 中的消费方保持兼容。
 */

const SupabaseAuthContext = createContext({
  isLoaded: false,
  isSignedIn: false,
  signOut: async () => {},
});

/// 获取当前认证状态的 React Hook
export function useAuth() {
  return useContext(SupabaseAuthContext);
}

/// Supabase Auth React Provider，监听 auth 状态变化并向下传递
/// - Parameter client: 通过 createSupabaseAuthClient() 创建的 Supabase 客户端
export function SupabaseAuthProvider({ client, children }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    // 首次加载时获取当前 session
    client.auth.getSession().then(({ data }) => {
      setIsSignedIn(Boolean(data?.session));
      setIsLoaded(true);
    }).catch(() => {
      setIsLoaded(true);
    });

    // 监听 auth 状态变化（登录、登出、token 刷新）
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(Boolean(session));
      if (!isLoaded) setIsLoaded(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [client]);

  const signOut = useCallback(async () => {
    await client.auth.signOut();
  }, [client]);

  const value = useMemo(
    () => ({ isLoaded, isSignedIn, signOut }),
    [isLoaded, isSignedIn, signOut],
  );

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

/// 生成 Supabase 认证所需的路由配置
/// - Parameter afterSignInUrl: 登录成功后的回调路径
/// - Returns: 路由数组，包含 auth/callback 路由
export function getSupabaseRoutes({ afterSignInUrl }) {
  return [
    {
      path: afterSignInUrl || "/auth/callback",
      element: <AuthCallbackHandler />,
    },
  ];
}

/// Auth 回调页面组件，处理 OAuth redirect 后的 URL hash
function AuthCallbackHandler() {
  useEffect(() => {
    // Supabase 在 OAuth 回调 URL 的 hash fragment 中返回 session 数据。
    // Supabase SDK 的 onAuthStateChange 会自动解析 hash fragment 并设置 session，
    // 因此这里仅需渲染一个占位 UI。
    // 实际的 redirect 逻辑由 App.jsx 中的 useEffect 处理。
  }, []);

  return <div className="min-h-screen bg-[#050505]" />;
}
