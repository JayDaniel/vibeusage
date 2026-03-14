import React from "react";
import { copy } from "../../../lib/copy";

export function SystemHeader({
  title = copy("system.header.title_default"),
  signalLabel,
  time,
  className = "",
}) {
  return (
    <header
      className={`flex justify-between border-b border-[#E2E8F0] p-4 items-center shrink-0 bg-white ${className}`}
    >
      <div className="flex items-center space-x-4">
        <div className="bg-[#2563EB] text-white px-3 py-1.5 font-bold text-[13px] rounded-md">
          {title}
        </div>
        {signalLabel ? (
          <span className="text-[12px] text-[#94A3B8] hidden sm:inline font-medium">
            {signalLabel}
          </span>
        ) : null}
      </div>
      {time ? (
        <div className="text-[#1E293B] font-semibold text-[15px]">{time}</div>
      ) : null}
    </header>
  );
}
