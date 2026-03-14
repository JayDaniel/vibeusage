import React from "react";
import { copy } from "../../../lib/copy";

export function VersionBadge({ version }) {
  const value = typeof version === "string" ? version.trim() : "";
  if (!value) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="text-[11px] text-[#94A3B8] font-medium">
        {copy("dashboard.version.label")}
      </div>
      <div className="text-[13px] text-[#1E293B] font-semibold tracking-tight">{value}</div>
    </div>
  );
}
