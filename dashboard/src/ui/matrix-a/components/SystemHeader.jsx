import React from "react";

import { copy } from "../../../lib/copy.js";

export function SystemHeader({
  title = copy("system.header.title_default"),
  signalLabel,
  time,
  className = "",
}) {
  return (
    <header
      className={`flex justify-between border-b border-[#00FF41]/30 p-4 items-center shrink-0 bg-black/40 backdrop-blur-sm ${className}`}
    >
      <div className="flex items-center space-x-4">
        <div className="bg-[#00FF41] text-black px-2 py-0.5 font-black text-xs skew-x-[-10deg] border border-[#00FF41] shadow-[0_0_10px_#00FF41]">
          {title}
        </div>
        {signalLabel ? (
          <span className="opacity-70 text-[9px] hidden sm:inline font-bold tracking-widest animate-pulse">
            {signalLabel}
          </span>
        ) : null}
      </div>
      {time ? (
        <div className="text-[#00FF41] font-bold text-xs font-mono tracking-widest">
          {time}
        </div>
      ) : null}
    </header>
  );
}
