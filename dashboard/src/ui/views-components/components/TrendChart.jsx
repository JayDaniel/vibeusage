import React from "react";
import { copy } from "../../../lib/copy";

export function TrendChart({
  data,
  unitLabel = copy("trend.chart.unit_label"),
  leftLabel = copy("trend.chart.left_label"),
  rightLabel = copy("trend.chart.right_label"),
}) {
  const values = Array.isArray(data) ? data.map((n) => Number(n) || 0) : [];
  const max = Math.max(...values, 1);

  if (!values.length) {
    return <div className="text-[12px] text-[#94A3B8]">{copy("trend.chart.empty")}</div>;
  }

  const peakLabel = copy("trend.chart.peak", {
    value: max.toLocaleString(),
    unit: unitLabel,
  });

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-end h-24 space-x-1 border-b border-[#E2E8F0] pb-2 relative">
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
          <div className="border-t border-[#CBD5E1] w-full"></div>
          <div className="border-t border-[#CBD5E1] w-full"></div>
          <div className="border-t border-[#CBD5E1] w-full"></div>
        </div>
        {values.map((val, i) => (
          <div key={i} className="flex-1 bg-[#F1F5F9] rounded-t relative group">
            <div
              style={{ height: `${(val / max) * 100}%` }}
              className="w-full bg-[#2563EB] opacity-60 group-hover:opacity-100 transition-all duration-300 rounded-t"
            ></div>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-[#94A3B8] font-medium">
        <span>{leftLabel}</span>
        <span>{peakLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}
