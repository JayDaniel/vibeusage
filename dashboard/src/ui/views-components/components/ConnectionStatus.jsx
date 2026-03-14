import React, { useMemo } from "react";
import { isScreenshotModeEnabled } from "../../../lib/screenshot-mode.js";

export function ConnectionStatus({ status = "STABLE", title, className = "" }) {
  const screenshotMode = useMemo(() => {
    if (typeof window === "undefined") return false;
    return isScreenshotModeEnabled(window.location.search);
  }, []);

  const configs = {
    STABLE: {
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      dotColor: "bg-emerald-500",
      label: "Online",
    },
    UNSTABLE: {
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      dotColor: "bg-amber-500",
      label: "Unstable",
    },
    LOST: {
      color: "text-red-600",
      bgColor: "bg-red-50",
      dotColor: "bg-red-500",
      label: "Offline",
    },
  };

  const current = configs[status] || configs.STABLE;

  return (
    <div
      title={title}
      className={[
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-300",
        current.color,
        current.bgColor,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dotColor}`}></span>
      <span>{current.label}</span>
    </div>
  );
}
