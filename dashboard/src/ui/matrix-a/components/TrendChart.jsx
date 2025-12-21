import React from "react";

import { copy } from "../../../lib/copy.js";

export function TrendChart({
  data,
  unitLabel = copy("trend.chart.unit_label"),
  leftLabel = copy("trend.chart.left_label"),
  rightLabel = copy("trend.chart.right_label"),
}) {
  const values = Array.isArray(data) ? data.map((n) => Number(n) || 0) : [];
  const max = Math.max(...values, 1);

  if (!values.length) {
    return <div className="text-[10px] opacity-40">{copy("trend.chart.empty")}</div>;
  }

  const peakLabel = copy("trend.chart.peak", {
    value: max.toLocaleString(),
    unit: unitLabel,
  });

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-end h-24 space-x-1 border-b border-[#00FF41]/20 pb-1 relative">
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
          <div className="border-t border-[#00FF41] w-full"></div>
          <div className="border-t border-[#00FF41] w-full"></div>
          <div className="border-t border-[#00FF41] w-full"></div>
        </div>
        {values.map((val, i) => (
          <div key={i} className="flex-1 bg-[#00FF41]/5 relative group">
            <div
              style={{ height: `${(val / max) * 100}%` }}
              className="w-full bg-[#00FF41] opacity-50 group-hover:opacity-100 group-hover:bg-white transition-all duration-300 shadow-[0_0_10px_rgba(0,255,65,0.2)]"
            ></div>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[7px] opacity-30 font-black uppercase tracking-[0.2em]">
        <span>{leftLabel}</span>
        <span>{peakLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}
