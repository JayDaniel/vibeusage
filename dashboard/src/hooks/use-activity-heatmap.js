import { useCallback, useEffect, useMemo, useState } from "react";

import {
  buildActivityHeatmap,
  computeActiveStreakDays,
  getHeatmapRangeUtc,
} from "../lib/activity-heatmap.js";
import { getUsageDaily, getUsageHeatmap } from "../lib/vibescore-api.js";

export function useActivityHeatmap({
  baseUrl,
  accessToken,
  weeks = 52,
  weekStartsOn = "sun",
} = {}) {
  const range = useMemo(() => {
    return getHeatmapRangeUtc({ weeks, weekStartsOn });
  }, [weeks, weekStartsOn]);
  const [daily, setDaily] = useState([]);
  const [heatmap, setHeatmap] = useState(null);
  const [source, setSource] = useState("edge");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      try {
        const res = await getUsageHeatmap({
          baseUrl,
          accessToken,
          weeks,
          to: range.to,
          weekStartsOn,
        });
        setHeatmap(res || null);
        setDaily([]);
        setSource("edge");
        return;
      } catch (e) {
        const status = e?.status;
        if (status === 401 || status === 403) throw e;
      }

      const dailyRes = await getUsageDaily({
        baseUrl,
        accessToken,
        from: range.from,
        to: range.to,
      });
      const rows = Array.isArray(dailyRes?.data) ? dailyRes.data : [];
      setDaily(rows);
      const localHeatmap = buildActivityHeatmap({
        dailyRows: rows,
        weeks,
        to: range.to,
        weekStartsOn,
      });
      setHeatmap({
        ...localHeatmap,
        week_starts_on: weekStartsOn,
        active_days: rows.filter((r) => Number(r?.total_tokens) > 0).length,
        streak_days: computeActiveStreakDays({ dailyRows: rows, to: range.to }),
      });
      setSource("client");
    } catch (e) {
      setError(e?.message || String(e));
      setDaily([]);
      setHeatmap(null);
      setSource("edge");
    } finally {
      setLoading(false);
    }
  }, [accessToken, baseUrl, range.from, range.to, weekStartsOn, weeks]);

  useEffect(() => {
    if (!accessToken) {
      setDaily([]);
      setLoading(false);
      setError(null);
      setHeatmap(null);
      setSource("edge");
      return;
    }
    refresh();
  }, [accessToken, refresh]);

  return { range, daily, heatmap, source, loading, error, refresh };
}
