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
    <div className={`relative flex flex-col bg-white border border-[#E2E8F0] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] ${className}`}>
      {title ? (
        <div className="flex items-center gap-2 px-5 pt-4 pb-0">
          <span className="text-[13px] font-semibold text-[#1E293B]">
            {title}
          </span>
          {subtitle ? (
            <span className="text-[12px] text-[#94A3B8] font-normal">{subtitle}</span>
          ) : null}
        </div>
      ) : null}

      <div className={`flex-1 min-w-0 py-4 px-5 relative z-10 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
