import React from "react";
import { copy } from "../../lib/copy";
import { useLocale } from "../../lib/locale.jsx";

export function MatrixShell({
  headerRight,
  headerStatus,
  children,
  footerLeft,
  footerRight,
  contentClassName = "",
  rootClassName = "",
  hideHeader = false,
}) {
  const { locale, toggleLocale } = useLocale();
  const headerTitle = copy("shell.header.title");
  const titleParts = String(headerTitle || "")
    .trim()
    .split(/\s+/);
  const titlePrimary = titleParts[0] || headerTitle;
  const titleSecondary = titleParts.slice(1).join(" ");

  return (
    <div
      className={`min-h-screen dynamic-bg text-[#0f172a] font-sans p-2 md:p-4 flex flex-col leading-normal text-body selection:bg-blue-200 selection:text-blue-900 overflow-hidden relative ${rootClassName}`}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -left-4 h-72 w-72 rounded-full bg-purple-300 opacity-30 mix-blend-multiply blur-2xl filter animate-blob"></div>
        <div className="absolute top-0 -right-4 h-72 w-72 rounded-full bg-blue-300 opacity-30 mix-blend-multiply blur-2xl filter animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 h-72 w-72 rounded-full bg-pink-300 opacity-30 mix-blend-multiply blur-2xl filter animate-blob animation-delay-4000"></div>
      </div>
      <div
        className={`relative z-10 flex min-h-screen flex-col ui-shell-content ${contentClassName}`}
      >
        {!hideHeader ? (
          <header className="border-b border-[#E2E8F0] pb-2 mb-3 shrink-0">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 items-center gap-3 md:gap-4">
                <img
                  src="/icon.svg"
                  alt=""
                  aria-hidden="true"
                  className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg shrink-0"
                />
                <div className="flex min-w-0 items-baseline gap-2 md:gap-3 select-none">
                  <span
                    className="text-[#1E293B] font-extrabold text-xl sm:text-2xl md:text-3xl leading-none truncate"
                    style={{ letterSpacing: "-0.5px" }}
                  >
                    {titlePrimary}
                  </span>
                  {titleSecondary ? (
                    <span
                      className="hidden sm:inline text-[#64748B] font-normal text-sm md:text-base truncate"
                    >
                      {titleSecondary}
                    </span>
                  ) : null}
                </div>
                <div className="hidden sm:flex items-center space-x-4 text-caption text-[#64748B] font-medium shrink-0">
                  {headerStatus || (
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                      {copy("shell.header.link_active")}
                    </span>
                  )}
                </div>
              </div>

              {headerRight ? (
                <div className="w-full md:w-auto md:ml-4">
                  <div className="min-w-0 flex items-center gap-2">
                    <button
                      onClick={toggleLocale}
                      className="shrink-0 px-2 py-1 rounded-md text-xs font-semibold text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9] transition-colors border border-[#E2E8F0] cursor-pointer select-none"
                      title={locale === "en" ? "切换到中文" : "Switch to English"}
                      aria-label={locale === "en" ? "Switch to Chinese" : "Switch to English"}
                    >
                      {locale === "en" ? "中" : "EN"}
                    </button>
                    {headerRight}
                  </div>
                </div>
              ) : null}
            </div>
          </header>
        ) : null}

        <main className="flex-1">{children}</main>

        <footer className="mt-3 flex shrink-0 flex-col gap-1.5 border-t border-[#E2E8F0] pt-2 text-caption font-medium text-[#94A3B8] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {footerLeft || <span>{copy("shell.footer.help")}</span>}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:justify-end">
            {footerRight || <span className="font-semibold">{copy("shell.footer.neural_index")}</span>}
          </div>
        </footer>
      </div>
    </div>
  );
}
