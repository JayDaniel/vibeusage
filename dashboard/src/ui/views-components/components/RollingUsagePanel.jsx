import React, { useEffect, useRef, useState } from "react";
import { copy } from "../../../lib/copy";
import { formatCompactNumber } from "../../../lib/format";
import { AsciiBox } from "../../foundation/AsciiBox.jsx";

/// 将原始数据值动画计数到目标值，返回当前显示值
function useAnimatedValue(target, durationMs = 1200) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    if (target == null || !Number.isFinite(target) || target === 0) {
      setDisplay(target ?? 0);
      return;
    }
    startRef.current = performance.now();
    const animate = (now) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / durationMs, 1);
      // easeOutExpo for smooth deceleration
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.round(target * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs]);

  return display;
}

/// 带动画计数效果的统计数值卡片
function AnimatedStatCard({ label, rawValue, formattedValue, delay = 0, className = "" }) {
  const animatedRaw = useAnimatedValue(rawValue);
  const compactConfig = {
    thousandSuffix: copy("shared.unit.thousand_abbrev"),
    millionSuffix: copy("shared.unit.million_abbrev"),
    billionSuffix: copy("shared.unit.billion_abbrev"),
  };

  const displayValue = rawValue != null && Number.isFinite(rawValue) && rawValue > 0
    ? formatCompactNumber(animatedRaw, compactConfig)
    : formattedValue;

  return (
    <div
      className={`flex flex-col items-center text-center gap-0.5 bg-white/40 border border-white/60 shadow-sm rounded-lg px-2 py-2 transition-all duration-300 hover:bg-white/70 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-200/60 ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="text-[10px] font-semibold tracking-wider uppercase text-[#94A3B8]">
        {label}
      </span>
      <span className="text-lg md:text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-slate-900 via-blue-800 to-slate-600 tabular-nums font-mono tracking-tight transition-colors">
        {displayValue}
      </span>
    </div>
  );
}

export const RollingUsagePanel = React.memo(function RollingUsagePanel({
  rolling,
  costValue,
  className = "",
}) {
  const placeholder = copy("shared.placeholder.short");
  const compactConfig = {
    thousandSuffix: copy("shared.unit.thousand_abbrev"),
    millionSuffix: copy("shared.unit.million_abbrev"),
    billionSuffix: copy("shared.unit.billion_abbrev"),
  };
  const formatValue = (value) => {
    if (value == null) return placeholder;
    const formatted = formatCompactNumber(value, compactConfig);
    return formatted === "-" ? placeholder : formatted;
  };

  const items = [
    {
      key: "total_cost",
      label: copy("dashboard.rolling.total_cost"),
      rawValue: null,
      value: costValue || placeholder,
    },
    {
      key: "last_7d",
      label: copy("dashboard.rolling.last_7d"),
      rawValue: rolling?.last_7d?.totals?.billable_total_tokens ?? null,
      value: formatValue(rolling?.last_7d?.totals?.billable_total_tokens),
    },
    {
      key: "last_30d",
      label: copy("dashboard.rolling.last_30d"),
      rawValue: rolling?.last_30d?.totals?.billable_total_tokens ?? null,
      value: formatValue(rolling?.last_30d?.totals?.billable_total_tokens),
    },
    {
      key: "avg_active_day",
      label: copy("dashboard.rolling.avg_active_day"),
      rawValue: rolling?.last_30d?.avg_per_active_day ?? null,
      value: formatValue(rolling?.last_30d?.avg_per_active_day),
    },
  ];

  return (
    <AsciiBox title={copy("dashboard.rolling.title")} className={className} bodyClassName="py-2">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {items.map((item, idx) => (
          <AnimatedStatCard
            key={item.key}
            label={item.label}
            rawValue={item.rawValue}
            formattedValue={item.value}
            delay={idx * 150}
          />
        ))}
      </div>
    </AsciiBox>
  );
});
