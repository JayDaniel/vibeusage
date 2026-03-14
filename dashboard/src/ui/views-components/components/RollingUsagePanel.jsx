import React from "react";
import { copy } from "../../../lib/copy";
import { formatCompactNumber } from "../../../lib/format";
import { AsciiBox } from "../../foundation/AsciiBox.jsx";

export const RollingUsagePanel = React.memo(function RollingUsagePanel({
  rolling,
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
      key: "last_7d",
      label: copy("dashboard.rolling.last_7d"),
      value: formatValue(rolling?.last_7d?.totals?.billable_total_tokens),
    },
    {
      key: "last_30d",
      label: copy("dashboard.rolling.last_30d"),
      value: formatValue(rolling?.last_30d?.totals?.billable_total_tokens),
    },
    {
      key: "avg_active_day",
      label: copy("dashboard.rolling.avg_active_day"),
      value: formatValue(rolling?.last_30d?.avg_per_active_day),
    },
  ];

  return (
    <AsciiBox title={copy("dashboard.rolling.title")} className={className} bodyClassName="py-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex flex-col items-center text-center gap-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-4"
          >
            <span className="text-[11px] font-medium text-[#94A3B8]">
              {item.label}
            </span>
            <span className="text-2xl md:text-3xl font-extrabold text-[#1E293B] tabular-nums font-display tracking-wide">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </AsciiBox>
  );
});
