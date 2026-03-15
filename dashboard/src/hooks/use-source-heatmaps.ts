import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildActivityHeatmap,
  computeActiveStreakDays,
  getHeatmapRangeLocal,
} from "../lib/activity-heatmap";
import { isAccessTokenReady, resolveAuthAccessToken } from "../lib/auth-token";
import { isMockEnabled } from "../lib/mock-data";
import { getUsageHeatmap } from "../lib/vibeusage-api";

type AnyRecord = Record<string, any>;

type SourceHeatmapEntry = {
  source: string;
  heatmap: any;
  daily: any[];
  streakDays: number;
  loading: boolean;
  error: string | null;
};

/**
 * 为每个 source（如 claude_code / codex）独立获取热力图数据，
 * 复用已有的 getUsageHeatmap API（通过 source 参数过滤），
 * 并分别计算各 source 的 streak / 活跃天数。
 *
 * - Parameters:
 *   - sources: 来自 model breakdown 的 source 标识数组（如 ["claude_code", "codex"]）
 *   - baseUrl / accessToken / timeZone / tzOffsetMinutes / now: 同 useActivityHeatmap
 *   - weeks: 热力图展示周数，默认 52
 * - Returns: 包含每个 source 热力图数据的数组 + 全局 loading/refresh 状态
 */
export function useSourceHeatmaps({
  sources = [],
  baseUrl,
  accessToken,
  guestAllowed = false,
  weeks = 52,
  weekStartsOn = "sun",
  timeZone,
  tzOffsetMinutes,
  now,
}: any = {}) {
  const range = useMemo(
    () => getHeatmapRangeLocal({ weeks, weekStartsOn, now }),
    [now, weeks, weekStartsOn],
  );

  const [entries, setEntries] = useState<SourceHeatmapEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const mockEnabled = isMockEnabled();
  const tokenReady = isAccessTokenReady(accessToken);

  const sourceKeys = useMemo(() => {
    const keys = (Array.isArray(sources) ? sources : [])
      .map((s: any) => (typeof s === "string" ? s.trim().toLowerCase() : ""))
      .filter(Boolean);
    return [...new Set(keys)];
  }, [sources]);

  const refresh = useCallback(async () => {
    const resolvedToken = await resolveAuthAccessToken(accessToken);
    if (!resolvedToken && !mockEnabled) return;
    if (!sourceKeys.length) {
      setEntries([]);
      return;
    }

    setLoading(true);

    const results: SourceHeatmapEntry[] = await Promise.all(
      sourceKeys.map(async (source) => {
        try {
          const res = await getUsageHeatmap({
            baseUrl,
            accessToken: resolvedToken,
            weeks,
            to: range.to,
            weekStartsOn,
            source,
            timeZone,
            tzOffsetMinutes,
          });

          const weeksData = Array.isArray(res?.weeks) ? res.weeks : [];
          const rows: any[] = [];
          for (const week of weeksData) {
            for (const cell of Array.isArray(week) ? week : []) {
              if (!cell?.day) continue;
              rows.push({
                day: cell.day,
                total_tokens: cell.total_tokens ?? cell.value ?? 0,
                billable_total_tokens:
                  cell.billable_total_tokens ?? cell.value ?? cell.total_tokens ?? 0,
              });
            }
          }

          const hasLevels = weeksData.some((week: any) =>
            (Array.isArray(week) ? week : []).some(
              (cell: any) => cell && Number.isFinite(Number(cell.level)),
            ),
          );

          let heatmap: any;
          if (!hasLevels && weeksData.length) {
            heatmap = buildActivityHeatmap({
              dailyRows: rows,
              weeks,
              to: res?.to || range.to,
              weekStartsOn,
            });
            heatmap.week_starts_on = weekStartsOn;
            heatmap.active_days = rows.filter(
              (r: any) => Number(r?.billable_total_tokens ?? r?.total_tokens) > 0,
            ).length;
            heatmap.streak_days = computeActiveStreakDays({
              dailyRows: rows,
              to: res?.to || range.to,
            });
          } else {
            heatmap = res || null;
          }

          return {
            source,
            heatmap,
            daily: rows,
            streakDays: heatmap?.streak_days ?? 0,
            loading: false,
            error: null,
          };
        } catch (e) {
          const err = e as any;
          return {
            source,
            heatmap: null,
            daily: [],
            streakDays: 0,
            loading: false,
            error: err?.message || String(err),
          };
        }
      }),
    );

    setEntries(results);
    setLoading(false);
  }, [
    accessToken,
    baseUrl,
    mockEnabled,
    range.to,
    sourceKeys,
    timeZone,
    tzOffsetMinutes,
    weekStartsOn,
    weeks,
  ]);

  useEffect(() => {
    if (!tokenReady && !guestAllowed && !mockEnabled) {
      setEntries([]);
      setLoading(false);
      return;
    }
    if (!sourceKeys.length) {
      setEntries([]);
      setLoading(false);
      return;
    }
    refresh();
  }, [guestAllowed, mockEnabled, refresh, sourceKeys, tokenReady]);

  return { entries, loading, refresh };
}
