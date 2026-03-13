import { SupabaseAuthProvider, getSupabaseRoutes } from "./lib/supabase-auth-provider.jsx";
import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App.jsx";
import { supabaseAuthClient } from "./lib/supabase-auth-client";
import { SignInRedirect } from "./pages/SignInRedirect.jsx";
import { SignUpRedirect } from "./pages/SignUpRedirect.jsx";
import "@fontsource/geist-mono/400.css";
import "@fontsource/geist-mono/500.css";
import "@fontsource/geist-mono/700.css";
import "@fontsource/geist-mono/900.css";
import "./styles.css";

const afterSignInUrl = "/auth/callback";
const router = createBrowserRouter([
  { path: "/sign-in", element: <SignInRedirect /> },
  { path: "/sign-up", element: <SignUpRedirect /> },
  ...getSupabaseRoutes({ afterSignInUrl }),
  { path: "*", element: <App /> },
]);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SupabaseAuthProvider client={supabaseAuthClient}>
      <RouterProvider router={router} />
    </SupabaseAuthProvider>
  </React.StrictMode>,
);
