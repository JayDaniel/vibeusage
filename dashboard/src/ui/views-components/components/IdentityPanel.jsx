import React, { useMemo } from "react";
import { copy } from "../../../lib/copy";

function toHandle(auth) {
  const raw = auth?.name?.trim();
  const safe = raw && !raw.includes("@") ? raw : copy("dashboard.identity.fallback");
  return safe.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function IdentityPanel({ auth, streakDays = 0, rankLabel }) {
  const handle = useMemo(() => toHandle(auth), [auth]);
  const rankValue = rankLabel ?? copy("identity_panel.rank_placeholder");
  const streakValue = Number.isFinite(Number(streakDays))
    ? copy("identity_panel.streak_value", { days: Number(streakDays) })
    : copy("identity_panel.rank_placeholder");

  return (
    <div className="flex items-center space-x-6">
      <div className="relative group">
        <div className="w-20 h-20 border border-[#E2E8F0] flex items-center justify-center text-[15px] font-bold bg-[#F1F5F9] rounded-xl">
          {copy("identity_panel.badge")}
        </div>
        <div className="absolute -bottom-1 -right-1 bg-[#2563EB] text-white text-[10px] px-1.5 py-0.5 font-bold rounded-md">
          {copy("identity_panel.level")}
        </div>
      </div>

      <div className="space-y-3 flex-1 min-w-0">
        <div className="border-l-3 border-[#2563EB] pl-3 py-2 bg-[#F8FAFC] rounded-r-lg">
          <div className="text-2xl md:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-none truncate">
            {handle}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#F8FAFC] p-2 border border-[#E2E8F0] text-center rounded-lg">
            <div className="text-[11px] text-[#94A3B8] font-medium">
              {copy("identity_panel.rank_label")}
            </div>
            <div className="text-[#2563EB] font-bold text-[18px] font-display tracking-wide">{rankValue}</div>
          </div>
          <div className="bg-[#F8FAFC] p-2 border border-[#E2E8F0] text-center rounded-lg">
            <div className="text-[11px] text-[#94A3B8] font-medium">
              {copy("identity_panel.streak_label")}
            </div>
            <div className="text-[#F59E0B] font-bold text-[18px] font-display tracking-wide">{streakValue}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
