import React from "react";

export const ASCII_CHARS = {
  TOP_LEFT: "",
  TOP_RIGHT: "",
  BOTTOM_LEFT: "",
  BOTTOM_RIGHT: "",
  HORIZONTAL: "",
  VERTICAL: "",
};

export function AsciiBox({ title, subtitle, children, className = "", bodyClassName = "" }) {
  return (
    <div className={`relative flex flex-col bg-white/60 backdrop-blur-2xl border border-white/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 transition-all duration-500 hover:shadow-[0_8px_30px_rgba(37,99,235,0.08)] ${className}`}>
      {title ? (
        <div className="flex items-center gap-2 px-4 pt-3.5 pb-0.5">
          <span className="text-[14px] font-bold text-slate-800 tracking-tight">
            {title}
          </span>
          {subtitle ? (
            <span className="text-[12px] text-[#94A3B8] font-normal">{subtitle}</span>
          ) : null}
        </div>
      ) : null}

      <div className={`flex-1 min-w-0 py-3 px-4 relative z-10 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
