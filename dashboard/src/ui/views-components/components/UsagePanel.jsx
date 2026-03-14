import { Button } from "@base-ui/react/button";
import React from "react";
import { copy } from "../../../lib/copy";
import { AsciiBox } from "../../foundation/AsciiBox.jsx";
import { MatrixButton } from "../../foundation/MatrixButton.jsx";
import { ScrambleText } from "../../foundation/ScrambleText.jsx";

function normalizePeriods(periods) {
  if (!Array.isArray(periods)) return [];
  return periods.map((p) => {
    if (typeof p === "string") {
      return { key: p, label: p.charAt(0).toUpperCase() + p.slice(1) };
    }
    return { key: p.key, label: p.label || String(p.key).charAt(0).toUpperCase() + String(p.key).slice(1) };
  });
}

export const UsagePanel = React.memo(function UsagePanel({
  title = copy("usage.panel.title"),
  period,
  periods,
  onPeriodChange,
  metrics = [],
  showSummary = false,
  summaryLabel = copy("usage.summary.total_system_output"),
  summaryValue = "—",
  summaryCostValue,
  onCostInfo,
  costInfoLabel = copy("usage.cost_info.label"),
  costInfoIcon = copy("usage.cost_info.icon"),
  summarySubLabel,
  breakdown,
  breakdownCollapsed = false,
  onToggleBreakdown,
  collapseLabel,
  expandLabel,
  collapseAriaLabel,
  expandAriaLabel,
  useSummaryLayout = false,
  onRefresh,
  loading = false,
  error,
  rangeLabel,
  rangeTimeZoneLabel,
  statusLabel,
  summaryAnimate = true,
  summaryScrambleDurationMs = 2200,
  hideHeader = false,
  className = "",
}) {
  const tabs = normalizePeriods(periods);
  const toggleLabel = breakdownCollapsed ? expandLabel : collapseLabel;
  const toggleAriaLabel = breakdownCollapsed ? expandAriaLabel : collapseAriaLabel;
  const showBreakdownToggle = Boolean(onToggleBreakdown && toggleLabel);
  const costLabelText = typeof costInfoIcon === "string" ? costInfoIcon : "";
  const costLabelMatch = costLabelText.match(/^\[\s*(.+?)\s*\]$/);
  const costLabelCore = costLabelMatch ? costLabelMatch[1] : null;
  const breakdownRows =
    breakdown && breakdown.length
      ? breakdown
      : [
          {
            key: copy("usage.metric.input"),
            label: copy("usage.metric.input"),
          },
          {
            key: copy("usage.metric.output"),
            label: copy("usage.metric.output"),
          },
          {
            key: copy("usage.metric.cached_input"),
            label: copy("usage.metric.cached_short"),
          },
          {
            key: copy("usage.metric.reasoning_output"),
            label: copy("usage.metric.reasoning_short"),
          },
        ]
          .map((item) => {
            const match = metrics.find((row) => row.label === item.key);
            if (!match) return null;
            return { label: item.label, value: match.value };
          })
          .filter(Boolean);

  return (
    <AsciiBox title={title} className={className}>
      {!hideHeader ? (
        <div className="flex flex-wrap items-center justify-between border-b border-[#E2E8F0] mb-4 pb-3 gap-4 px-1">
          <div className="flex flex-wrap gap-1 bg-[#F1F5F9] rounded-lg p-1">
            {tabs.map((p) => (
              <Button
                key={p.key}
                type="button"
                className={`text-[12px] font-semibold px-3 py-1.5 rounded-md transition-all ${
                  period === p.key
                    ? "text-[#2563EB] bg-white shadow-sm"
                    : "text-[#64748B] hover:text-[#1E293B]"
                }`}
                onClick={() => onPeriodChange?.(p.key)}
              >
                {p.label}
              </Button>
            ))}
          </div>
          {onRefresh || statusLabel ? (
            <div className="flex items-center gap-3">
              {statusLabel ? (
                <span className="text-[12px] font-medium text-[#64748B]">
                  {statusLabel}
                </span>
              ) : null}
              {showBreakdownToggle ? (
                <MatrixButton
                  className="px-3 py-1.5 text-[11px]"
                  aria-label={toggleAriaLabel}
                  title={toggleAriaLabel}
                  onClick={onToggleBreakdown}
                >
                  {toggleLabel}
                </MatrixButton>
              ) : null}
              {onRefresh ? (
                <MatrixButton primary disabled={loading} onClick={onRefresh}>
                  {loading ? copy("usage.button.loading") : copy("usage.button.refresh")}
                </MatrixButton>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <div className="text-[13px] text-red-500 px-2 py-2 bg-red-50 rounded-lg mb-3">
          {copy("shared.error.prefix", { error })}
        </div>
      ) : null}

      {showSummary || useSummaryLayout ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-6">
          <div className="text-center relative">
            <div className="text-[13px] text-[#64748B] font-medium mb-3">{summaryLabel}</div>
            <div className="text-5xl md:text-7xl font-extrabold text-[#1E293B] tracking-[0.02em] tabular-nums leading-none select-none font-display">
              {summaryValue && summaryValue !== "—" ? (
                <span className="relative inline-block leading-none">
                  {summaryAnimate ? (
                    <ScrambleText
                      text={summaryValue}
                      durationMs={summaryScrambleDurationMs}
                      startScrambled
                      respectReducedMotion
                    />
                  ) : (
                    summaryValue
                  )}
                </span>
              ) : (
                summaryValue
              )}
            </div>
            {summaryCostValue ? (
              <div className="flex items-center justify-center gap-3 mt-4 md:mt-6">
                <span className="sr-only">{copy("usage.metric.total_cost")}</span>
                <span className="text-xl md:text-2xl font-bold text-amber-600 leading-none font-display">
                  {summaryCostValue}
                </span>
                {onCostInfo ? (
                  <Button
                    type="button"
                    onClick={onCostInfo}
                    title={costInfoLabel}
                    aria-label={costInfoLabel}
                    className="group inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 transition-all hover:text-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 rounded"
                  >
                    {costLabelCore ? (
                      <span className="group-hover:underline">{costLabelCore}</span>
                    ) : (
                      <span>{costInfoIcon}</span>
                    )}
                  </Button>
                ) : null}
              </div>
            ) : null}
            {summarySubLabel ? (
              <div className="text-[12px] text-[#94A3B8] mt-2">{summarySubLabel}</div>
            ) : null}
          </div>

          {!breakdownCollapsed && breakdownRows.length ? (
            <div className="w-full px-4">
              <div className="grid grid-cols-2 gap-3 border-t border-[#E2E8F0] pt-4">
                {breakdownRows.map((row, idx) => (
                  <div
                    key={`${row.label}-${idx}`}
                    className="flex flex-col items-center p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg"
                  >
                    <span className="text-[11px] text-[#94A3B8] font-medium mb-1">
                      {row.label}
                    </span>
                    <span className="text-[18px] font-bold text-[#2563EB] tracking-wide font-display">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-3 px-2 py-2">
          {metrics.map((row, idx) => (
            <div
              key={`${row.label}-${idx}`}
              className="border border-[#E2E8F0] bg-[#F8FAFC] rounded-lg p-4 text-center"
            >
              <div className="text-[11px] text-[#94A3B8] font-medium mb-2">{row.label}</div>
              <div
                className={`text-[18px] font-bold text-[#1E293B] font-display ${
                  row.valueClassName || ""
                }`}
              >
                {row.value}
              </div>
              {row.subValue ? (
                <div className="text-[12px] text-[#94A3B8] mt-1">{row.subValue}</div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {rangeLabel ? (
        <div className="mt-3 text-[11px] text-[#94A3B8] font-medium px-2">
          {copy("usage.range_label", { range: rangeLabel })}
          {rangeTimeZoneLabel ? ` ${rangeTimeZoneLabel}` : ""}
        </div>
      ) : null}
    </AsciiBox>
  );
});
