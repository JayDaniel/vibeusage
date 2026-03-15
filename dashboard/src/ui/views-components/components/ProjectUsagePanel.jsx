import React, { useEffect, useMemo, useState } from "react";
import { Select } from "@base-ui/react/select";

import { copy } from "../../../lib/copy";
import { formatCompactNumber, toDisplayNumber, toFiniteNumber } from "../../../lib/format";
import { AsciiBox } from "../../foundation/AsciiBox.jsx";
import { shouldFetchGithubStars } from "../util/should-fetch-github-stars.js";

const LIMIT_OPTIONS = [3, 6, 10];
const REPO_META_CACHE = new Map();

function splitRepoKey(value) {
  if (typeof value !== "string") return { owner: "", repo: "" };
  const [owner, repo] = value.split("/");
  return { owner: owner || "", repo: repo || "" };
}

function normalizeStars(value) {
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.round(value));
}

function resolveTokens(entry) {
  if (!entry) return null;
  const total = entry.total_tokens ?? null;
  const billable = entry.billable_total_tokens ?? null;
  const billableValue = toFiniteNumber(billable);
  const totalValue = toFiniteNumber(total);
  if (billableValue === 0 && totalValue != null && totalValue > 0) {
    return total;
  }
  return billable ?? total ?? null;
}

function resolveRepoMeta(repoId) {
  if (!repoId) return null;
  return REPO_META_CACHE.get(repoId) || null;
}

function cacheRepoMeta(repoId, meta) {
  if (!repoId || !meta) return;
  REPO_META_CACHE.set(repoId, meta);
}

function useGithubRepoMeta(repoId) {
  const [state, setState] = useState(() => resolveRepoMeta(repoId) || null);

  useEffect(() => {
    if (!repoId) return;
    const cached = resolveRepoMeta(repoId);
    if (cached) {
      setState(cached);
      return;
    }

    if (typeof window === "undefined") return;
    const prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const screenshotCapture =
      typeof document !== "undefined" &&
      (document.documentElement?.classList.contains("screenshot-capture") ||
        document.body?.classList.contains("screenshot-capture"));
    if (!shouldFetchGithubStars({ prefersReducedMotion, screenshotCapture })) {
      return;
    }

    let active = true;
    fetch(`https://api.github.com/repos/${repoId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        const meta = {
          stars: normalizeStars(data?.stargazers_count),
          avatarUrl: typeof data?.owner?.avatar_url === "string" ? data.owner.avatar_url : null,
        };
        cacheRepoMeta(repoId, meta);
        setState(meta);
      })
      .catch(() => {
        if (!active) return;
        const meta = { stars: null, avatarUrl: null };
        cacheRepoMeta(repoId, meta);
        setState(meta);
      });

    return () => {
      active = false;
    };
  }, [repoId]);

  return state;
}

export function ProjectUsagePanel({
  entries = [],
  limit = 3,
  onLimitChange,
  loading = false,
  error = null,
  className = "",
}) {
  const placeholder = copy("shared.placeholder.short");
  const tokensLabel = copy("dashboard.projects.tokens_label");
  const starsLabel = copy("dashboard.projects.stars_label");
  const emptyLabel = copy("dashboard.projects.empty");
  const limitLabel = copy("dashboard.projects.limit_label");
  const limitAria = copy("dashboard.projects.limit_aria");
  const optionLabels = {
    3: copy("dashboard.projects.limit_top_3"),
    6: copy("dashboard.projects.limit_top_6"),
    10: copy("dashboard.projects.limit_top_10"),
  };
  const resolvedLimit = LIMIT_OPTIONS.includes(limit) ? limit : LIMIT_OPTIONS[0];

  const sortedEntries = useMemo(() => {
    const list = Array.isArray(entries) ? entries.slice() : [];
    return list.sort((a, b) => {
      const aValue = toFiniteNumber(resolveTokens(a)) ?? 0;
      const bValue = toFiniteNumber(resolveTokens(b)) ?? 0;
      return bValue - aValue;
    });
  }, [entries]);

  const displayEntries = sortedEntries.slice(0, Math.max(1, limit));

  const tokenFormatOptions = {
    thousandSuffix: copy("shared.unit.thousand_abbrev"),
    millionSuffix: copy("shared.unit.million_abbrev"),
    billionSuffix: copy("shared.unit.billion_abbrev"),
    decimals: 1,
  };

  return (
    <AsciiBox
      title={copy("dashboard.projects.title")}
      subtitle={copy("dashboard.projects.subtitle")}
      className={className}
      bodyClassName="py-4"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className="text-[12px] text-[#94A3B8] font-medium">
          {limitLabel}
        </span>
        <div className="relative">
          <Select.Root
            value={resolvedLimit}
            items={LIMIT_OPTIONS.map((value) => ({
              value,
              label: optionLabels[value],
            }))}
            onValueChange={(value) => {
              if (typeof onLimitChange === "function" && value != null) {
                onLimitChange(value);
              }
            }}
          >
            <Select.Trigger
              aria-label={limitAria}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-[12px] font-bold text-slate-600 bg-white/50 border border-white/80 shadow-sm backdrop-blur-md rounded-lg hover:bg-white/70 hover:shadow-md hover:shadow-blue-500/5 transition-all duration-300"
            >
              <Select.Value />
              <span className="text-[#94A3B8]">▾</span>
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner align="end" side="bottom" sideOffset={8} className="z-50">
                <Select.Popup className="w-40 border border-slate-200/60 bg-white/90 backdrop-blur-xl rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] pointer-events-auto overflow-hidden">
                  <Select.List aria-label={limitAria} role="listbox">
                    {LIMIT_OPTIONS.map((value) => (
                      <Select.Item
                        key={value}
                        value={value}
                        className={({ selected }) =>
                          `w-full text-left px-3 py-2.5 text-[12px] font-medium transition-colors ${
                            selected
                              ? "bg-[#EFF6FF] text-[#2563EB] border-l-2 border-[#2563EB]"
                              : "text-[#475569] hover:bg-[#F8FAFC] data-[highlighted]:bg-[#F8FAFC]"
                          }`
                        }
                      >
                        <Select.ItemText>{optionLabels[value]}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.List>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </div>
      </div>

      {displayEntries.length === 0 ? (
        <div className="text-[12px] text-[#94A3B8]">
          {loading ? placeholder : error ? placeholder : emptyLabel}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {displayEntries.map((entry) => (
            <ProjectUsageCard
              key={`${entry?.project_key || "repo"}-${entry?.project_ref || ""}`}
              entry={entry}
              placeholder={placeholder}
              tokensLabel={tokensLabel}
              starsLabel={starsLabel}
              tokenFormatOptions={tokenFormatOptions}
            />
          ))}
        </div>
      )}
    </AsciiBox>
  );
}

function ProjectUsageCard({
  entry,
  placeholder,
  tokensLabel,
  starsLabel,
  tokenFormatOptions,
}) {
  const repoKey = typeof entry?.project_key === "string" ? entry.project_key : "";
  const projectRef = typeof entry?.project_ref === "string" ? entry.project_ref : "";
  const { owner, repo } = splitRepoKey(
    repoKey || projectRef.replace("https://github.com/", "")
  );
  const repoId = owner && repo ? `${owner}/${repo}` : repoKey;
  const meta = useGithubRepoMeta(repoId);
  const avatarUrl =
    meta?.avatarUrl || (owner ? `https://github.com/${owner}.png?size=80` : "");
  const starsRaw = meta?.stars;
  const starsFull =
    starsRaw == null ? placeholder : toDisplayNumber(starsRaw);
  const starsCompact =
    starsRaw == null
      ? placeholder
      : formatCompactNumber(starsRaw, tokenFormatOptions);
  const tokensRaw = resolveTokens(entry);
  const tokensFull =
    tokensRaw == null ? placeholder : toDisplayNumber(tokensRaw);
  const tokensCompact =
    tokensRaw == null
      ? placeholder
      : formatCompactNumber(tokensRaw, tokenFormatOptions);

  return (
    <a
      href={projectRef || (repoId ? `https://github.com/${repoId}` : "#")}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex h-full min-h-[142px] flex-col gap-4 rounded-2xl border border-white/80 bg-white/50 px-4 py-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-blue-300/60 hover:bg-white/70 hover:shadow-xl hover:shadow-blue-500/10"
      data-project-card="true"
    >
      <div className="flex items-start gap-3 min-w-0" data-card-line="identity">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-white/50 ring-4 ring-white/60 shadow-md shadow-blue-500/5 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-blue-500/10">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={owner || repoKey}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-[#F1F5F9]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#94A3B8]" data-card-field="owner">
            {owner || placeholder}
          </div>
          <div
            className="mt-1 text-[15px] font-bold text-[#1E293B] truncate group-hover:text-blue-700 transition-colors"
            title={repo || repoKey}
            data-card-line="repo"
            data-card-field="repo"
          >
            {repo || repoKey || placeholder}
          </div>
        </div>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-white/80 bg-white/70 px-3 py-2 shadow-sm" data-card-line="tokens">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">{tokensLabel}</div>
          <div
            className="mt-1 text-[16px] font-extrabold tracking-wide text-[#2563EB] tabular-nums font-display"
            title={tokensFull}
          >
            {tokensCompact}
          </div>
        </div>
        <div className="rounded-xl border border-white/80 bg-white/70 px-3 py-2 shadow-sm" data-card-line="stars">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">{starsLabel}</div>
          <div className="mt-1 inline-flex items-center gap-1.5 text-[16px] font-extrabold tracking-wide text-slate-700 font-display" title={starsFull}>
            <svg
              viewBox="0 0 16 16"
              className="h-[0.95em] w-[0.95em] fill-[#F59E0B]"
              data-star-icon="true"
              aria-hidden="true"
            >
              <path d="M8 1.1 10.1 5.4l4.8.7-3.5 3.4.8 4.8L8 11.9l-4.2 2.4.8-4.8L1.1 6.1l4.8-.7L8 1.1z" />
            </svg>
            <span className="tabular-nums">{starsCompact}</span>
          </div>
        </div>
      </div>
    </a>
  );
}
