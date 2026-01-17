import { useState, useEffect } from "react";
import { getSupabase } from "../lib/supabase-client.js";
import { MatrixShell } from "../ui/matrix-a/layout/MatrixShell.jsx";
import { AsciiBox } from "../ui/matrix-a/components/AsciiBox.jsx";

export function SignInPage({ redirectUrl }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // CLI redirect parameter detection
  const [cliRedirect, setCliRedirect] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      if (p.get("mode") === "signup") setMode("signup");

      // Detect CLI redirect callback URL
      const redirect = p.get("redirect");
      if (redirect && redirect.startsWith("http://127.0.0.1")) {
        setCliRedirect(redirect);
      }
    }
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const sb = getSupabase();

      // Check if Supabase client is initialized
      if (sb._isPlaceholder) {
        throw new Error("Supabase is not configured. Please check your environment variables.");
      }

      let res;
      if (mode === 'signup') {
        res = await sb.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectUrl }
        });
      } else {
        res = await sb.auth.signInWithPassword({ email, password });
      }

      if (res.error) throw res.error;

      if (res.data?.session) {
        // If CLI redirect, pass token back to CLI
        if (cliRedirect) {
          const u = new URL(cliRedirect);
          u.searchParams.set("access_token", res.data.session.access_token);
          if (res.data.user?.id) u.searchParams.set("user_id", res.data.user.id);
          if (res.data.user?.email) u.searchParams.set("email", res.data.user.email);
          // Redirect to CLI's local callback server
          window.location.href = u.toString();
          return;
        }

        // Normal Dashboard login flow
        const u = new URL("/auth/callback", window.location.origin);
        u.searchParams.set("access_token", res.data.session.access_token);
        if (res.data.user?.id) u.searchParams.set("user_id", res.data.user.id);
        if (res.data.user?.email) u.searchParams.set("email", res.data.user.email);
        // Redirect to callback handler after login
        window.location.href = u.toString();
      } else if (mode === 'signup') {
        setSuccess("Activation required: Please check your inbox to confirm your email address.");
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <MatrixShell>
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AsciiBox
          title={mode === 'signin' ? "IDENT_VERIFICATION" : "NEW_RECRUIT_SYNC"}
          subtitle={mode === 'signin' ? "LEVEL_0_ACCESS" : "ENROLLMENT"}
          className="w-full max-w-md"
        >
          <div className="space-y-6 py-4">
            <div className="text-[10px] opacity-50 uppercase tracking-widest leading-relaxed">
              {mode === 'signin'
                ? "Neural link required for dashboard access. Enter credentials."
                : "Welcome to VibeUsage. Initialize your identity within the mainframe."}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 p-3 text-red-500 text-[10px] animate-pulse">
                [ERROR_LOG]: {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/50 p-3 text-green-500 text-[10px]">
                [SUCCESS]: {success}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] uppercase opacity-40">Neural_ID (Email)</label>
                <input
                  autoFocus
                  className="w-full bg-[#00FF41]/5 border border-[#00FF41]/20 p-3 text-[#00FF41] focus:border-[#00FF41]/60 outline-none transition-colors"
                  placeholder="name@nexus.com"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] uppercase opacity-40">Security_Pass</label>
                <input
                  className="w-full bg-[#00FF41]/5 border border-[#00FF41]/20 p-3 text-[#00FF41] focus:border-[#00FF41]/60 outline-none transition-colors"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              <button
                disabled={loading}
                className={`w-full py-3 font-black uppercase tracking-[0.2em] transition-all
                  ${loading
                    ? 'bg-[#00FF41]/20 text-[#00FF41]/50 cursor-not-allowed'
                    : 'bg-[#00FF41] text-black hover:bg-[#00FF41]/80 hover:scale-[1.01] active:scale-[0.98]'}`}
              >
                {loading ? 'UPLOADING_DATA...' : (mode === 'signin' ? 'ESTABLISH_LINK' : 'INITIALIZE_CORE')}
              </button>
            </form>

            <div className="flex flex-col space-y-2 pt-4 border-t border-[#00FF41]/10">
              <button
                type="button"
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-[9px] uppercase tracking-widest text-[#00FF41]/40 hover:text-[#00FF41] transition-colors"
              >
                {mode === 'signin' ? '>> Request Access (Create Account)' : '>> Return to Verification'}
              </button>

              <div className="text-[8px] opacity-20 text-center pt-2">
                SECURE_ENCRYPTION_ACTIVE // SUPABASE_LINK_ESTABLISHED
              </div>
            </div>
          </div>
        </AsciiBox>
      </div>
    </MatrixShell>
  );
}
