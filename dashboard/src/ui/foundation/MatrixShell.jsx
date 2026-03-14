import React from "react";
import { copy } from "../../lib/copy";

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
  const headerTitle = copy("shell.header.title");
  const titleParts = String(headerTitle || "")
    .trim()
    .split(/\s+/);
  const titlePrimary = titleParts[0] || headerTitle;
  const titleSecondary = titleParts.slice(1).join(" ");

  return (
    <div
      className={`min-h-screen bg-[#F1F5F9] text-[#1E293B] font-['Fira_Code',monospace] p-4 md:p-8 flex flex-col leading-normal text-body selection:bg-blue-100 selection:text-blue-900 overflow-hidden ${rootClassName}`}
    >
      <div
        className={`relative z-10 flex flex-col min-h-screen ui-shell-content ${contentClassName}`}
      >
        {!hideHeader ? (
          <header className="border-b border-[#E2E8F0] pb-4 mb-6 shrink-0">
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
                  <div className="w-full md:w-auto overflow-x-auto no-scrollbar">{headerRight}</div>
                </div>
              ) : null}
            </div>
          </header>
        ) : null}

        <main className="flex-1">{children}</main>

        <footer className="mt-6 pt-4 border-t border-[#E2E8F0] flex justify-between text-caption font-medium text-[#94A3B8] shrink-0">
          <div className="flex space-x-10 items-center">
            {footerLeft || <span>{copy("shell.footer.help")}</span>}
          </div>
          <div className="flex items-center space-x-3">
            {footerRight || <span className="font-semibold">{copy("shell.footer.neural_index")}</span>}
          </div>
        </footer>
      </div>
    </div>
  );
}
