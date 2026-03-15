import { Button } from "@base-ui/react/button";
import React from "react";
import { copy } from "../../../lib/copy";
import { AsciiBox } from "../../foundation/AsciiBox.jsx";
import { JumpingNumber } from "../../foundation/JumpingNumber.jsx";
import { MatrixButton } from "../../foundation/MatrixButton.jsx";

function normalizePeriods(periods) {
  if (!Array.isArray(periods)) return [];
  return periods.map((p) => {
    if (typeof p === "string") {
      return { key: p, label: p.charAt(0).toUpperCase() + p.slice(1) };
    }
    return { key: p.key, label: p.label || String(p.key).charAt(0).toUpperCase() + String(p.key).slice(1) };
  });
}

function isPlaceholderValue(value) {
  if (value == null) return true;
  const normalized = String(value).trim();
  return normalized === "" || normalized === "-" || normalized === "--" || normalized === "—";
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
  const summaryPlaceholder = isPlaceholderValue(summaryValue);
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
        <div className="flex flex-wrap items-center justify-between border-b border-[#E2E8F0] mb-3 pb-2 gap-3 px-1">
          <div className="flex flex-wrap gap-1 bg-slate-100/50 backdrop-blur-sm rounded-lg p-1 border border-slate-200/50">
            {tabs.map((p) => (
              <Button
                key={p.key}
                type="button"
                className={`text-[12px] font-bold px-4 py-1.5 rounded-lg transition-all duration-300 ${
                  period === p.key
                    ? "text-blue-700 bg-white shadow-md shadow-blue-500/10 border border-blue-200/50 transform scale-105"
                    : "text-[#64748B] hover:text-[#1E293B] hover:bg-slate-200/50"
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
        <div className={`grid gap-3 py-0.5 ${!breakdownCollapsed && breakdownRows.length ? "xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]" : ""}`}>
          <div className="rounded-2xl border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(239,246,255,0.9))] p-3 shadow-sm shadow-blue-500/5 sm:p-4">
            <div className="flex flex-col gap-3">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#64748B]">
                {summaryLabel}
              </div>
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div className={`${summaryPlaceholder ? "text-3xl md:text-4xl" : "text-4xl md:text-5xl"} font-extrabold tracking-[0.02em] tabular-nums leading-none select-none font-display ${summaryPlaceholder ? "text-slate-500" : "text-[#0F172A]"}`}>
                  {summaryPlaceholder ? (
                    summaryValue
                  ) : (
                    <JumpingNumber
                      value={summaryValue}
                      staggerMs={45}
                      durationMs={650}
                    />
                  )}
                </div>
                {summaryCostValue ? (
                  <div className="flex items-center gap-2">
                    <span className="sr-only">{copy("usage.metric.total_cost")}</span>
                    <span className="text-lg font-bold leading-none text-amber-600 md:text-xl font-display">
                      <JumpingNumber value={summaryCostValue} staggerMs={35} durationMs={500} />
                    </span>
                    {onCostInfo ? (
                      <Button
                        type="button"
                        onClick={onCostInfo}
                        title={costInfoLabel}
                        aria-label={costInfoLabel}
                        className="group inline-flex items-center gap-1 rounded text-[11px] font-semibold text-amber-600 transition-all hover:text-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
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
              </div>
              {summarySubLabel ? (
                <div className="text-[12px] text-[#94A3B8]">{summarySubLabel}</div>
              ) : null}
            </div>
          </div>

          {!breakdownCollapsed && breakdownRows.length ? (
            <div className="grid grid-cols-2 gap-3">
              {breakdownRows.map((row, idx) => (
                <div
                  key={`${row.label}-${idx}`}
                  className="group flex flex-col justify-between rounded-xl border border-white/80 bg-white/50 p-2.5 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300/50 hover:shadow-lg hover:shadow-blue-500/10"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] transition-colors group-hover:text-blue-600/70">
                    {row.label}
                  </span>
                  <span className="mt-1.5 text-[16px] font-extrabold tracking-wide text-[#2563EB] font-display">
                    <JumpingNumber value={row.value} staggerMs={30} durationMs={500} />
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-2 py-2 md:grid-cols-3 xl:grid-cols-5">
          {metrics.map((row, idx) => (
            <div
              key={`${row.label}-${idx}`}
              className={`group rounded-2xl border p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                row.valueClassName
                  ? "col-span-2 border-blue-400/30 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-700 shadow-blue-500/15 md:col-span-3 xl:col-span-1"
                  : "border-white/80 bg-white/50 shadow-sm backdrop-blur-md hover:border-blue-300/50 hover:shadow-blue-500/10"
              }`}
            >
              <div className={`mb-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${row.valueClassName ? "text-blue-100/75" : "text-[#94A3B8] group-hover:text-[#1E293B]/70"}`}>{row.label}</div>
              <div className={row.valueClassName ? `text-[20px] font-extrabold text-white font-display ${row.valueClassName}` : "text-[20px] font-extrabold bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent font-display"}>
                {row.value}
              </div>
              {row.subValue ? (
                <div className={`mt-1 text-[12px] ${row.valueClassName ? "text-blue-100/70" : "text-[#94A3B8]"}`}>{row.subValue}</div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {rangeLabel ? (
        <div className="mt-2 text-[10px] text-[#94A3B8] font-medium px-1">
          {copy("usage.range_label", { range: rangeLabel })}
          {rangeTimeZoneLabel ? ` ${rangeTimeZoneLabel}` : ""}
        </div>
      ) : null}
    </AsciiBox>
  );
});
