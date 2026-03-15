import React from "react";
import { copy } from "../../../lib/copy";
import { AsciiBox } from "../../foundation/AsciiBox.jsx";

export const TopModelsPanel = React.memo(function TopModelsPanel({ rows = [], className = "" }) {
  const placeholder = copy("shared.placeholder.short");
  const percentSymbol = copy("shared.unit.percent");
  const displayRows = Array.from({ length: 3 }, (_, index) => {
    const row = rows[index];
    if (row) return row;
    return {
      id: "",
      name: "",
      percent: "",
      empty: true,
    };
  });

  return (
    <AsciiBox
      title={copy("dashboard.top_models.title")}
      subtitle={copy("dashboard.top_models.subtitle")}
      className={className}
      bodyClassName="py-2"
    >
      <div className="flex flex-col gap-1">
        {displayRows.map((row, index) => {
          const rankLabel = String(index + 1);
          const isEmpty = Boolean(row?.empty);
          const name = isEmpty ? "" : row?.name ? String(row.name) : placeholder;
          const percent = isEmpty ? "" : row?.percent ? String(row.percent) : placeholder;
          const showPercentSymbol = !isEmpty && percent !== placeholder;
          const rowKey = row?.id ? String(row.id) : `${name}-${index}`;

          return (
            <div
              key={rowKey}
              className="flex items-center justify-between bg-white/40 border border-slate-200/50 py-3 px-3.5 mb-2 hover:bg-white/70 hover:shadow-md hover:shadow-blue-500/5 hover:border-blue-300/50 transition-all duration-300 rounded-xl group last:mb-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex items-center justify-center w-7 h-7 bg-white shadow-sm border border-slate-100 rounded-lg text-[11px] text-slate-500 font-extrabold group-hover:text-blue-600 group-hover:scale-105 transition-all">
                  {rankLabel}
                </span>
                <span
                  className="text-[14px] font-bold text-[#1E293B] truncate group-hover:text-blue-900 transition-colors"
                  title={name}
                >
                  {name}
                </span>
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-[16px] font-extrabold text-[#2563EB] font-display tracking-wide">{percent}</span>
                {showPercentSymbol ? (
                  <span className="text-[11px] text-[#2563EB] font-medium opacity-80">
                    {percentSymbol}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </AsciiBox>
  );
});
