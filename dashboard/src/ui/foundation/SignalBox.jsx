import React from "react";
import { copy } from "../../lib/copy";
import { DecodingText } from "./DecodingText.jsx";

/**
 * Landing Page card variant (flat design)
 */
export const SignalBox = ({
  title = copy("signalbox.title_default"),
  children,
  className = "",
}) => (
  <section className={`relative flex flex-col overflow-hidden bg-white border border-[#E2E8F0] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] ${className}`}>
    <header className="relative z-10 border-b border-[#E2E8F0] px-5 py-3">
      <span className="text-[13px] font-semibold text-[#1E293B]">
        <DecodingText text={title} />
      </span>
    </header>
    <div className="relative z-10 flex-1 min-h-0 p-4">{children}</div>
  </section>
);
