import React from "react";

export function DataRow({ label, value, subValue, valueClassName = "" }) {
  return (
    <div className="flex justify-between items-center border-b border-[#F1F5F9] py-2 group hover:bg-[#F8FAFC] transition-colors px-2 rounded">
      <span className="text-[12px] text-[#64748B] font-medium leading-none">
        {label}
      </span>
      <div className="flex items-center space-x-3">
        {subValue ? <span className="text-[11px] text-[#94A3B8] italic">{subValue}</span> : null}
        <span className={`font-bold text-[18px] font-display tracking-wide ${valueClassName}`}>{value}</span>
      </div>
    </div>
  );
}
