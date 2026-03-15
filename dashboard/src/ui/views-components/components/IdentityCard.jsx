import { Button } from "@base-ui/react/button";
import React, { useEffect, useState } from "react";
import { copy } from "../../../lib/copy";
import { AsciiBox } from "../../foundation/AsciiBox.jsx";
import { MatrixAvatar } from "../../foundation/MatrixAvatar.jsx";
import { ScrambleText } from "../../foundation/ScrambleText.jsx";

function normalizeBadgePart(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function toTitleWords(value) {
  const normalized = normalizeBadgePart(value);
  if (!normalized) return "";
  return normalized
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((token) => token.slice(0, 1).toUpperCase() + token.slice(1).toLowerCase())
    .join(" ");
}

function buildSubscriptionItems(subscriptions) {
  if (!Array.isArray(subscriptions)) return [];
  const deduped = new Map();
  for (const entry of subscriptions) {
    if (!entry || typeof entry !== "object") continue;
    const toolRaw = normalizeBadgePart(entry.tool);
    const planRaw = normalizeBadgePart(entry.planType) || normalizeBadgePart(entry.plan_type);
    if (!toolRaw || !planRaw) continue;
    const tool = toTitleWords(toolRaw) || toolRaw;
    const plan = toTitleWords(planRaw) || planRaw;
    deduped.set(`${toolRaw.toLowerCase()}::${planRaw.toLowerCase()}`, { tool, plan });
  }
  return Array.from(deduped.values());
}

export function IdentityCard({
  name = copy("identity_card.name_default"),
  avatarUrl,
  isPublic = false,
  onDecrypt,
  title = copy("identity_card.title_default"),
  subtitle,
  rankLabel,
  streakDays,
  subscriptions = [],
  showStats = true,
  animateTitle = true,
  scrambleDurationMs = 2200,
  scrambleLoop = false,
  scrambleLoopDelayMs = 2400,
  scrambleStartScrambled = true,
  scrambleRespectReducedMotion = false,
  scanlines = true,
  className = "",
  avatarSize = 56,
  animate = true,
}) {
  const unknownLabel = copy("identity_card.unknown");
  const displayName = isPublic ? name : unknownLabel;
  const avatarName = isPublic ? name : unknownLabel;
  const [avatarFailed, setAvatarFailed] = useState(false);
  const safeAvatarUrl = typeof avatarUrl === "string" ? avatarUrl.trim() : "";
  const showAvatar = isPublic && safeAvatarUrl && !avatarFailed;
  const rankValue = rankLabel ?? copy("identity_card.rank_placeholder");
  const streakValue = Number.isFinite(Number(streakDays))
    ? copy("identity_card.streak_value", { days: Number(streakDays) })
    : copy("identity_card.rank_placeholder");
  const shouldShowStats = showStats && (rankLabel !== undefined || streakDays !== undefined);
  const subscriptionItems = buildSubscriptionItems(subscriptions);

  useEffect(() => {
    setAvatarFailed(false);
  }, [safeAvatarUrl]);

  const titleNode =
    typeof title === "string" && animateTitle ? (
      <ScrambleText
        text={title}
        durationMs={scrambleDurationMs}
        loop={scrambleLoop}
        loopDelayMs={scrambleLoopDelayMs}
        startScrambled={scrambleStartScrambled}
        respectReducedMotion={scrambleRespectReducedMotion}
      />
    ) : (
      title
    );

  return (
    <AsciiBox title={titleNode} subtitle={subtitle} className={className}>
      <div className="relative overflow-hidden">
        <div className="relative z-10 px-0.5">
          {shouldShowStats ? (
            <div className="grid w-full grid-cols-2 gap-2">
              <div className="group rounded-xl border border-white/80 bg-white/50 p-2 text-center shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-400/30 hover:shadow-lg hover:shadow-amber-500/10 sm:p-2.5">
                <div className="text-[10px] text-[#64748B] font-bold mb-1 uppercase tracking-wider group-hover:text-amber-600/70 transition-colors">
                  {copy("identity_card.rank_label")}
                </div>
                <div className="text-amber-600 font-extrabold text-[16px] font-display tracking-wide">{rankValue}</div>
              </div>
              <div className="group rounded-xl border border-white/80 bg-white/50 p-2 text-center shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-400/30 hover:shadow-lg hover:shadow-amber-500/10 sm:p-2.5">
                <div className="text-[10px] text-[#64748B] font-bold mb-1 uppercase tracking-wider group-hover:text-amber-600/70 transition-colors">
                  {copy("identity_card.streak_label")}
                </div>
                <div className="text-amber-600 font-extrabold tracking-wide text-[16px] font-display">{streakValue}</div>
              </div>
            </div>
          ) : null}

          {subscriptionItems.length !== 0 ? (
            <div className={shouldShowStats ? "pt-2" : ""}>
              <div className="mb-1 text-[11px] text-[#94A3B8] font-medium">
                {copy("identity_card.subscriptions_label")}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {subscriptionItems.map((entry, index) => (
                  <span
                    key={`${entry.tool}:${entry.plan}:${index}`}
                    className="inline-flex items-center px-2.5 py-1 bg-fuchsia-50/50 border border-fuchsia-200/50 shadow-sm rounded-lg text-[11px] font-bold text-fuchsia-700 backdrop-blur-md transition-all hover:bg-fuchsia-100/50 hover:border-fuchsia-300/50"
                  >
                    {copy("identity_card.subscription_item", {
                      tool: entry.tool,
                      plan: entry.plan,
                    })}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </AsciiBox>
  );
}
