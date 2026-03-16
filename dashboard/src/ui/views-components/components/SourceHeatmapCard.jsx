import React, { useMemo } from "react";
import { buildActivityHeatmap, computeActiveStreakDays, computeLongestStreakDays } from "../../../lib/activity-heatmap";
import { copy } from "../../../lib/copy";
import { formatCompactNumber, toFiniteNumber } from "../../../lib/format";

const CELL_SIZE = 13;
const CELL_GAP = 3;
const LABEL_WIDTH = 0;

/**
 * 每个 source 对应一个颜色主题（hue 区间 + CSS rgba）。
 * 主题包含 5 级不透明度用于热力图（level 0-4）以及高亮色。
 */
const SOURCE_THEMES = {
  claude_code: {
    label: "Claude Code",
    hue: "orange",
    levels: [
      "rgba(251,191,36,0.10)",
      "rgba(251,191,36,0.30)",
      "rgba(245,158,11,0.50)",
      "rgba(234,88,12,0.70)",
      "rgba(217,70,0,1)",
    ],
    accent: "#F59E0B",
    accentLight: "#FBBF24",
  },
  claude: {
    label: "Claude",
    hue: "orange",
    levels: [
      "rgba(251,191,36,0.10)",
      "rgba(251,191,36,0.30)",
      "rgba(245,158,11,0.50)",
      "rgba(234,88,12,0.70)",
      "rgba(217,70,0,1)",
    ],
    accent: "#F59E0B",
    accentLight: "#FBBF24",
  },
  codex: {
    label: "Codex",
    hue: "blue",
    levels: [
      "rgba(37,99,235,0.08)",
      "rgba(37,99,235,0.25)",
      "rgba(37,99,235,0.45)",
      "rgba(37,99,235,0.65)",
      "rgba(37,99,235,1)",
    ],
    accent: "#2563EB",
    accentLight: "#60A5FA",
  },
  cursor: {
    label: "Cursor",
    hue: "purple",
    levels: [
      "rgba(139,92,246,0.08)",
      "rgba(139,92,246,0.25)",
      "rgba(139,92,246,0.45)",
      "rgba(139,92,246,0.65)",
      "rgba(139,92,246,1)",
    ],
    accent: "#8B5CF6",
    accentLight: "#A78BFA",
  },
  windsurf: {
    label: "Windsurf",
    hue: "teal",
    levels: [
      "rgba(20,184,166,0.08)",
      "rgba(20,184,166,0.25)",
      "rgba(20,184,166,0.45)",
      "rgba(20,184,166,0.65)",
      "rgba(20,184,166,1)",
    ],
    accent: "#14B8A6",
    accentLight: "#2DD4BF",
  },
  gemini: {
    label: "Gemini",
    hue: "indigo",
    levels: [
      "rgba(99,102,241,0.08)",
      "rgba(99,102,241,0.25)",
      "rgba(99,102,241,0.45)",
      "rgba(99,102,241,0.65)",
      "rgba(99,102,241,1)",
    ],
    accent: "#6366F1",
    accentLight: "#818CF8",
  },
};

const DEFAULT_THEME = {
  label: "",
  hue: "emerald",
  levels: [
    "rgba(16,185,129,0.08)",
    "rgba(16,185,129,0.25)",
    "rgba(16,185,129,0.45)",
    "rgba(16,185,129,0.65)",
    "rgba(16,185,129,1)",
  ],
  accent: "#10B981",
  accentLight: "#34D399",
};

/// 根据 source 名称获取对应的颜色主题配置
function getTheme(source) {
  if (!source) return DEFAULT_THEME;
  const key = String(source).toLowerCase().replace(/[\s-]/g, "_");
  return SOURCE_THEMES[key] || DEFAULT_THEME;
}

const MONTH_LABELS = [
  copy("heatmap.month.jan"), copy("heatmap.month.feb"), copy("heatmap.month.mar"),
  copy("heatmap.month.apr"), copy("heatmap.month.may"), copy("heatmap.month.jun"),
  copy("heatmap.month.jul"), copy("heatmap.month.aug"), copy("heatmap.month.sep"),
  copy("heatmap.month.oct"), copy("heatmap.month.nov"), copy("heatmap.month.dec"),
];

function parseUtcDate(value) {
  if (typeof value !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

function addUtcDays(date, days) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
}

function diffUtcDays(a, b) {
  return Math.floor(
    (Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate()) -
      Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate())) / 86400000
  );
}

function getWeekStart(date, weekStartsOn) {
  const desired = weekStartsOn === "mon" ? 1 : 0;
  const dow = date.getUTCDay();
  return addUtcDays(date, -((dow - desired + 7) % 7));
}

/// 构建月份标记，用于在热力图顶部显示月份标签
function buildMonthMarkers({ weeksCount, to, weekStartsOn }) {
  if (!weeksCount) return [];
  const end = parseUtcDate(to) || new Date();
  const endMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  const months = [];
  for (let i = 11; i >= 0; i -= 1) {
    months.push(new Date(Date.UTC(endMonth.getUTCFullYear(), endMonth.getUTCMonth() - i, 1)));
  }
  const endWeekStart = getWeekStart(end, weekStartsOn);
  const startAligned = addUtcDays(endWeekStart, -(weeksCount - 1) * 7);
  const markers = [];
  const usedIndexes = new Set();
  for (const monthStart of months) {
    const weekIndex = Math.floor(diffUtcDays(startAligned, monthStart) / 7);
    if (weekIndex < 0 || weekIndex >= weeksCount) continue;
    if (usedIndexes.has(weekIndex)) continue;
    usedIndexes.add(weekIndex);
    markers.push({ label: MONTH_LABELS[monthStart.getUTCMonth()], index: weekIndex });
  }
  return markers;
}

/// 格式化 token 数值为紧凑的显示形式（如 952M / 72.1B）
function formatTokenCompact(value) {
  const n = toFiniteNumber(value);
  if (n == null || n === 0) return "0";
  return formatCompactNumber(n, {
    thousandSuffix: "K",
    millionSuffix: "M",
    billionSuffix: "B",
    decimals: 1,
  });
}

/// 将 source key 转换为显示名称
function formatSourceLabel(source) {
  if (!source) return "";
  const theme = getTheme(source);
  if (theme.label) return theme.label;
  return String(source)
    .split(/[_-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * SourceHeatmapCard - 单个 source 的热力图卡片
 * 展示样式参照截图：title（source 名）+ token 统计头 + 热力图网格 + 底部统计
 *
 * @param {Object} props
 * @param {string} props.source - source 标识（如 "claude_code"）
 * @param {Object} props.heatmap - 热力图数据（含 weeks/to/from）
 * @param {Array} props.daily - 每日行数据
 * @param {Object} props.sourceBreakdown - 来自 model breakdown 的该 source 统计信息
 * @param {string} props.timeZoneShortLabel - 时区短标签
 */
export const SourceHeatmapCard = React.memo(function SourceHeatmapCard({
  source,
  heatmap,
  daily = [],
  sourceBreakdown = null,
  timeZoneShortLabel,
}) {
  const theme = getTheme(source);
  const sourceLabel = formatSourceLabel(source);
  const weekStartsOn = heatmap?.week_starts_on === "mon" ? "mon" : "sun";

  // 标准化 heatmap
  const normalizedHeatmap = useMemo(() => {
    const sourceWeeks = Array.isArray(heatmap?.weeks) ? heatmap.weeks : [];
    if (!sourceWeeks.length) return { weeks: [] };
    const rows = [];
    for (const week of sourceWeeks) {
      for (const cell of Array.isArray(week) ? week : []) {
        if (!cell?.day) continue;
        rows.push({
          day: cell.day,
          total_tokens: cell.total_tokens ?? cell.value ?? 0,
          billable_total_tokens: cell.billable_total_tokens ?? cell.value ?? cell.total_tokens ?? 0,
        });
      }
    }
    return buildActivityHeatmap({
      dailyRows: rows,
      weeks: Math.max(52, sourceWeeks.length),
      to: heatmap?.to,
      weekStartsOn,
    });
  }, [heatmap?.to, heatmap?.weeks, weekStartsOn]);

  const weeks = normalizedHeatmap?.weeks || [];

  // Token 统计 —— 从 sourceBreakdown（model breakdown 的 source 级 totals）获取
  const inputTokens = toFiniteNumber(sourceBreakdown?.totals?.input_tokens) ?? 0;
  const outputTokens = toFiniteNumber(sourceBreakdown?.totals?.output_tokens) ?? 0;
  const totalTokens = toFiniteNumber(
    sourceBreakdown?.totals?.billable_total_tokens ?? sourceBreakdown?.totals?.total_tokens
  ) ?? 0;

  // 最常用模型
  const topModel = useMemo(() => {
    const models = Array.isArray(sourceBreakdown?.models) ? sourceBreakdown.models : [];
    let best = null;
    let bestTokens = 0;
    for (const m of models) {
      const tokens = toFiniteNumber(m?.totals?.billable_total_tokens ?? m?.totals?.total_tokens) ?? 0;
      if (tokens > bestTokens) {
        bestTokens = tokens;
        best = m;
      }
    }
    return best;
  }, [sourceBreakdown?.models]);

  const topModelName = topModel?.model || "-";
  const topModelTokens = toFiniteNumber(
    topModel?.totals?.billable_total_tokens ?? topModel?.totals?.total_tokens
  ) ?? 0;

  // 最近 30 天最常用模型
  const recentTopModel = useMemo(() => {
    // 简单地复用 topModel，因为 breakdown 已是选定时间范围内的数据
    return topModel;
  }, [topModel]);

  const recentModelName = recentTopModel?.model || "-";
  const recentModelTokens = toFiniteNumber(
    recentTopModel?.totals?.billable_total_tokens ?? recentTopModel?.totals?.total_tokens
  ) ?? 0;

  // Streak 计算
  const dailyRows = useMemo(() => {
    if (daily.length) return daily;
    const rows = [];
    for (const week of Array.isArray(heatmap?.weeks) ? heatmap.weeks : []) {
      for (const cell of Array.isArray(week) ? week : []) {
        if (!cell?.day) continue;
        rows.push({
          day: cell.day,
          total_tokens: cell.total_tokens ?? cell.value ?? 0,
          billable_total_tokens: cell.billable_total_tokens ?? cell.value ?? cell.total_tokens ?? 0,
        });
      }
    }
    return rows;
  }, [daily, heatmap?.weeks]);

  const currentStreak = useMemo(
    () => computeActiveStreakDays({ dailyRows, to: normalizedHeatmap?.to }),
    [dailyRows, normalizedHeatmap?.to],
  );

  const longestStreak = useMemo(
    () => computeLongestStreakDays({ dailyRows }),
    [dailyRows],
  );

  // 月份标记
  const monthMarkers = useMemo(
    () => buildMonthMarkers({ weeksCount: weeks.length, to: normalizedHeatmap?.to, weekStartsOn }),
    [normalizedHeatmap?.to, weekStartsOn, weeks.length],
  );

  // Day labels（只显示 Mon 和 Sun，其他留空，参照截图样式）
  const dayLabels = weekStartsOn === "mon"
    ? ["Mon", "", "", "", "", "", "Sun"]
    : ["Sun", "Mon", "", "", "", "", ""];

  if (!weeks.length) {
    return null;
  }

  const gridColumns = {
    display: "grid",
    gridTemplateColumns: `${LABEL_WIDTH ? LABEL_WIDTH + "px " : ""}repeat(${weeks.length}, ${CELL_SIZE}px)`,
    columnGap: `${CELL_GAP}px`,
  };

  const gridRows = {
    display: "grid",
    gridAutoFlow: "column",
    gridTemplateRows: `repeat(7, ${CELL_SIZE}px)`,
    gap: `${CELL_GAP}px`,
  };

  const labelRows = {
    display: "grid",
    gridTemplateRows: `repeat(7, ${CELL_SIZE}px)`,
    rowGap: `${CELL_GAP}px`,
  };

  return (
    <div className="flex flex-col gap-2.5 py-6 first:pt-0 last:pb-0 border-b border-slate-100 last:border-b-0">
      {/* Header: Source Name + Token Stats */}
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-[26px] font-extrabold text-slate-800 tracking-tight leading-none">
          {sourceLabel}
        </h3>
        <div className="flex items-end gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-slate-400 uppercase tracking-[0.15em] font-semibold leading-none">
              {copy("source_heatmap.input_tokens")}
            </span>
            <span className="text-[18px] font-extrabold text-slate-700 tabular-nums leading-tight mt-0.5">
              {formatTokenCompact(inputTokens)}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-slate-400 uppercase tracking-[0.15em] font-semibold leading-none">
              {copy("source_heatmap.output_tokens")}
            </span>
            <span className="text-[18px] font-extrabold text-slate-700 tabular-nums leading-tight mt-0.5">
              {formatTokenCompact(outputTokens)}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-slate-400 uppercase tracking-[0.15em] font-semibold leading-none">
              {copy("source_heatmap.total_tokens")}
            </span>
            <span className="text-[22px] font-black text-slate-800 tabular-nums leading-tight mt-0.5">
              {formatTokenCompact(totalTokens)}
            </span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto no-scrollbar select-none" style={{ scrollbarWidth: "none" }}>
        <div className="inline-flex flex-col min-w-max">
          {/* Month Labels */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `24px repeat(${weeks.length}, ${CELL_SIZE}px)`,
              columnGap: `${CELL_GAP}px`,
            }}
            className="text-[10px] font-medium text-slate-400 mb-1"
          >
            <span></span>
            {monthMarkers.map((marker) => (
              <span
                key={`${marker.label}-${marker.index}`}
                style={{ gridColumnStart: marker.index + 2 }}
                className="whitespace-nowrap"
              >
                {marker.label}
              </span>
            ))}
          </div>

          {/* Day Labels + Cells */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `24px repeat(${weeks.length}, ${CELL_SIZE}px)`,
              columnGap: `${CELL_GAP}px`,
            }}
          >
            {/* Day labels column */}
            <div style={labelRows} className="text-[10px] font-medium text-slate-400">
              {dayLabels.map((label, i) => (
                <span key={i} className="leading-none flex items-center">
                  {label}
                </span>
              ))}
            </div>

            {/* Heatmap cells */}
            <div style={gridRows}>
              {weeks.map((week, wIdx) =>
                (Array.isArray(week) ? week : []).map((cell, dIdx) => {
                  const key = cell?.day || `empty-${wIdx}-${dIdx}`;
                  if (!cell) {
                    return (
                      <span
                        key={key}
                        className="rounded-[2px]"
                        style={{ width: CELL_SIZE, height: CELL_SIZE }}
                      />
                    );
                  }
                  const level = Number(cell.level) || 0;
                  const color = theme.levels[level] || theme.levels[0];

                  return (
                    <span
                      key={key}
                      title={`${cell.day} • ${formatTokenCompact(cell.value)} tokens`}
                      className="rounded-[2px] transition-colors duration-150"
                      style={{
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        background: color,
                      }}
                    />
                  );
                }),
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">
        <span>{copy("heatmap.legend.less")}</span>
        <div className="flex gap-[3px]">
          {[0, 1, 2, 3, 4].map((level) => (
            <span
              key={level}
              className="rounded-[2px]"
              style={{
                width: 10,
                height: 10,
                background: theme.levels[level],
              }}
            />
          ))}
        </div>
        <span>{copy("heatmap.legend.more")}</span>
      </div>

      {/* Bottom Stats Row */}
      <div className="grid grid-cols-4 gap-4 pt-3 mt-1">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-[0.15em] leading-tight">
            {copy("source_heatmap.most_used_model")}
          </span>
          <span className="text-[14px] font-extrabold text-slate-800 truncate leading-snug" title={topModelName}>
            {topModelName}
            <span className="text-[12px] font-normal text-slate-400 ml-1">({formatTokenCompact(topModelTokens)})</span>
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-[0.15em] leading-tight">
            {copy("source_heatmap.recent_use")}
          </span>
          <span className="text-[14px] font-extrabold text-slate-800 truncate leading-snug" title={recentModelName}>
            {recentModelName}
            <span className="text-[12px] font-normal text-slate-400 ml-1">({formatTokenCompact(recentModelTokens)})</span>
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-[0.15em] leading-tight">
            {copy("source_heatmap.longest_streak")}
          </span>
          <span className="text-[16px] font-black text-slate-800 tabular-nums leading-snug">
            {longestStreak} {copy("source_heatmap.days")}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-[0.15em] leading-tight">
            {copy("source_heatmap.current_streak")}
          </span>
          <span className="text-[16px] font-black text-slate-800 tabular-nums leading-snug">
            {currentStreak} {copy("source_heatmap.days")}
          </span>
        </div>
      </div>
    </div>
  );
});
