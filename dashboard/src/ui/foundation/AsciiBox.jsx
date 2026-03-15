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
    <div className={`relative flex flex-col bg-white/60 backdrop-blur-2xl border border-white/60 rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] ring-1 ring-slate-900/5 transition-all duration-500 hover:shadow-[0_4px_20px_rgba(37,99,235,0.06)] ${className}`}>
      {title ? (
        <div className="flex items-center gap-2 px-3 pt-2.5 pb-0">
          <span className="text-[13px] font-bold text-slate-800 tracking-tight">
            {title}
          </span>
          {subtitle ? (
            <span className="text-[11px] text-[#94A3B8] font-normal">{subtitle}</span>
          ) : null}
        </div>
      ) : null}

      <div className={`flex-1 min-w-0 py-2 px-3 relative z-10 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
