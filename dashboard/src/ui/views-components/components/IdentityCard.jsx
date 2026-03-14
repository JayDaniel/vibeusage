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
        <div className="relative z-10 flex items-center space-x-5 px-1">
          {showAvatar ? (
            <div
              style={{ width: avatarSize, height: avatarSize }}
              className="relative rounded-xl overflow-hidden shrink-0"
            >
              <img
                src={safeAvatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
                onError={() => setAvatarFailed(true)}
              />
            </div>
          ) : (
            <MatrixAvatar name={avatarName} isAnon={!isPublic} size={avatarSize} />
          )}

          <div className="flex-1 space-y-2 min-w-0">
            <div>
              <div className="text-xl md:text-2xl font-bold text-[#1E293B] tracking-wide leading-none font-display">
                {animate ? (
                  <ScrambleText
                    text={displayName}
                    durationMs={scrambleDurationMs}
                    loop={scrambleLoop}
                    loopDelayMs={scrambleLoopDelayMs}
                    startScrambled={scrambleStartScrambled}
                    respectReducedMotion={scrambleRespectReducedMotion}
                  />
                ) : (
                  displayName
                )}
              </div>
            </div>

            {!isPublic && onDecrypt ? (
              <Button
                type="button"
                onClick={onDecrypt}
                className="text-[12px] text-white bg-[#2563EB] px-3 py-1.5 font-semibold rounded-md hover:bg-[#1D4ED8] transition-colors"
              >
                {copy("identity_card.decrypt")}
              </Button>
            ) : null}

            {shouldShowStats ? (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-[#F8FAFC] p-2.5 border border-[#E2E8F0] rounded-lg text-center">
                  <div className="text-[11px] text-[#94A3B8] font-medium mb-0.5">
                    {copy("identity_card.rank_label")}
                  </div>
                  <div className="text-amber-600 font-bold text-[16px] font-display tracking-wide">{rankValue}</div>
                </div>
                <div className="bg-[#F8FAFC] p-2.5 border border-[#E2E8F0] rounded-lg text-center">
                  <div className="text-[11px] text-[#94A3B8] font-medium mb-0.5">
                    {copy("identity_card.streak_label")}
                  </div>
                  <div className="text-amber-600 font-bold tracking-wide text-[16px] font-display">{streakValue}</div>
                </div>
              </div>
            ) : null}

            {subscriptionItems.length !== 0 ? (
              <div className="pt-2">
                <div className="mb-1 text-[11px] text-[#94A3B8] font-medium">
                  {copy("identity_card.subscriptions_label")}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {subscriptionItems.map((entry, index) => (
                    <span
                      key={`${entry.tool}:${entry.plan}:${index}`}
                      className="inline-flex items-center px-2.5 py-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-md text-[11px] font-medium text-[#475569]"
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
      </div>
    </AsciiBox>
  );
}
