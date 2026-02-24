import React from "react";
import { copy } from "../../lib/copy";
import { DecodingText } from "./DecodingText.jsx";

/**
 * Landing Page 专用的 AsciiBox 变体
 * (原 Landing.jsx 中的 AsciiBox，为了不与 dashboard 的 AsciiBox 冲突，命名为 SignalBox)
 */
export const SignalBox = ({
  title = copy("signalbox.title_default"),
  children,
  className = "",
}) => (
  <section className={`relative flex flex-col overflow-hidden border border-[#00FF41]/45 bg-[#04130b]/72 ${className}`}>
    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,255,65,0)_50%,rgba(0,255,65,0.16)_50%)] bg-[length:100%_4px] opacity-25" />
    <header className="relative z-10 border-b border-[#00FF41]/25 px-5 py-3">
      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#00FF41]/78">
        <DecodingText text={title} />
      </span>
    </header>
    <div className="relative z-10 flex-1 min-h-0 p-4">{children}</div>
  </section>
);
