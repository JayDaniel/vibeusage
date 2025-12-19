import React, { useMemo } from "react";

const OPACITY_BY_LEVEL = [0.15, 0.45, 0.62, 0.8, 1];

function formatTokenValue(value) {
  if (typeof value === "bigint") return value.toLocaleString();
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.round(value).toLocaleString() : "0";
  }
  if (typeof value === "string") {
    const s = value.trim();
    if (/^[0-9]+$/.test(s)) {
      try {
        return BigInt(s).toLocaleString();
      } catch (_e) {}
    }
    const n = Number(s);
    return Number.isFinite(n) ? Math.round(n).toLocaleString() : s;
  }
  return "0";
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function parseMonth(day) {
  if (typeof day !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day.trim());
  if (!m) return null;
  const month = Number(m[2]);
  if (!Number.isFinite(month)) return null;
  return month - 1;
}

function buildMonthLabels(weeks) {
  const labels = [];
  let lastMonth = null;
  for (const week of weeks) {
    const cells = Array.isArray(week) ? week : [];
    const first = cells.find((cell) => cell && cell.day);
    if (!first?.day) {
      labels.push("");
      continue;
    }
    const monthIdx = parseMonth(first.day);
    if (monthIdx == null) {
      labels.push("");
      continue;
    }
    if (monthIdx !== lastMonth) {
      labels.push(MONTH_LABELS[monthIdx] || "");
      lastMonth = monthIdx;
    } else {
      labels.push("");
    }
  }
  return labels;
}

export function ActivityHeatmap({ heatmap }) {
  const weeks = heatmap?.weeks || [];
  const weekStartsOn = heatmap?.week_starts_on === "mon" ? "mon" : "sun";
  const dayLabels = weekStartsOn === "mon"
    ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthLabels = useMemo(() => buildMonthLabels(weeks), [weeks]);

  if (!weeks.length) {
    return (
      <div className="text-[10px] opacity-40 font-mono">
        No activity data yet.
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="flex flex-col justify-between py-5 text-[8px] opacity-40 uppercase tracking-widest">
        {dayLabels.map((label) => (
          <span key={label} className="h-3 leading-none">
            {label === "Mon" || label === "Wed" || label === "Fri" ? label : ""}
          </span>
        ))}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex space-x-1.5 min-w-fit text-[8px] uppercase opacity-40 tracking-widest mb-2">
          {monthLabels.map((label, idx) => (
            <span key={`${label}-${idx}`} className="w-3 text-left">
              {label}
            </span>
          ))}
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <div className="flex space-x-1.5 min-w-fit">
            {weeks.map((week, wIdx) => (
              <div
                key={wIdx}
                className="flex flex-col space-y-0.5 border-r border-[#00FF41]/10 pr-1.5 last:border-none"
              >
                {(Array.isArray(week) ? week : []).map((cell, dIdx) => {
                  if (!cell) {
                    return (
                      <span
                        key={dIdx}
                        className="w-3 h-3 text-[9px] leading-none text-transparent select-none"
                        aria-hidden="true"
                      >
                        ·
                      </span>
                    );
                  }

                  const level = Number(cell.level) || 0;
                  const opacity = OPACITY_BY_LEVEL[level] ?? 0.3;
                  const char = level === 0 ? "·" : "■";
                  const className =
                    level === 0
                      ? "text-[#00FF41]/10"
                      : "text-[#00FF41] shadow-glow";

                  return (
                    <span
                      key={dIdx}
                      className={`w-3 h-3 text-[9px] leading-none transition-all duration-700 ${className}`}
                      style={{ opacity }}
                      title={`${cell.day} • ${formatTokenValue(cell.value)} tokens`}
                    >
                      {char}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-3 text-[7px] border-t border-[#00FF41]/5 pt-2 opacity-40 font-black uppercase tracking-widest">
        <div className="flex space-x-3 items-center">
          <span>Density_Scale:</span>
          <div className="flex gap-1.5 font-mono">
            <span className="opacity-20 text-[10px]">·</span>
            <span className="opacity-40 text-[10px]">■</span>
            <span className="opacity-60 text-[10px]">■</span>
            <span className="opacity-80 text-[10px]">■</span>
            <span className="opacity-100 text-[10px] shadow-glow">■</span>
          </div>
        </div>
        <span>UTC</span>
      </div>
    </div>
  );
}
