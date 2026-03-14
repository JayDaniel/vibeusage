import React, { useMemo } from "react";
import { copy } from "../../lib/copy";

function hashCode(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

const AVATAR_COLORS = [
  "#2563EB", "#7C3AED", "#DB2777", "#DC2626",
  "#EA580C", "#D97706", "#059669", "#0891B2",
];

export function MatrixAvatar({
  name = "unknown",
  isAnon = false,
  isTheOne = false,
  size = 64,
  className = "",
}) {
  const hash = useMemo(() => hashCode(String(name || "unknown")), [name]);
  const colorIndex = Math.abs(hash) % AVATAR_COLORS.length;
  const bgColor = isAnon ? "#E2E8F0" : isTheOne ? "#FEF3C7" : AVATAR_COLORS[colorIndex];
  const textColor = isAnon ? "#94A3B8" : isTheOne ? "#92400E" : "#FFFFFF";
  const initials = String(name || "?").trim().charAt(0).toUpperCase();

  if (isAnon) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl flex items-center justify-center overflow-hidden ${className}`}
      >
        <span className="text-[#94A3B8] font-semibold text-body">
          {copy("shared.placeholder.anon_mark")}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size, backgroundColor: bgColor }}
      className={`relative rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-105 ${className}`}
    >
      <span
        style={{ color: textColor, fontSize: size * 0.38 }}
        className="font-bold select-none"
      >
        {initials}
      </span>
    </div>
  );
}
