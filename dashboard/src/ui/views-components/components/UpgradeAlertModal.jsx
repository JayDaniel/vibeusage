import { Button } from "@base-ui/react/button";
import { Input } from "@base-ui/react/input";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { copy } from "../../../lib/copy";
import { safeGetItem, safeSetItem, safeWriteClipboard } from "../../../lib/safe-browser";

export function UpgradeAlertModal({ requiredVersion, installCommand, onClose }) {
  const normalizedRequired = typeof requiredVersion === "string" ? requiredVersion.trim() : "";
  const hasVersion = normalizedRequired.length > 0;
  const unknownDismissKey = "vibeusage_upgrade_dismissed_unknown";
  const resolvedInstallCommand = installCommand ?? copy("dashboard.upgrade_alert.install_command");
  const sparkleLabel = copy("dashboard.upgrade_alert.sparkle");
  const titleLabel = copy("dashboard.upgrade_alert.title");
  const subtitleLabel = hasVersion
    ? copy("dashboard.upgrade_alert.subtitle", {
        required: normalizedRequired,
      })
    : copy("dashboard.upgrade_alert.subtitle_generic");
  const promptLabel = copy("dashboard.upgrade_alert.prompt");
  const copyLabel = copy("dashboard.upgrade_alert.copy");
  const copiedLabel = copy("dashboard.upgrade_alert.copied");
  const ignoreLabel = copy("dashboard.upgrade_alert.ignore");
  const [copied, setCopied] = useState(false);
  const storageKey = useMemo(
    () => (hasVersion ? `vibeusage_upgrade_dismissed_${normalizedRequired}` : unknownDismissKey),
    [hasVersion, normalizedRequired, unknownDismissKey],
  );
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") return true;
    return !safeGetItem(storageKey);
  });
  const bannerRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = safeGetItem(storageKey);
    setIsVisible(!dismissed);
  }, [storageKey]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (!isVisible) {
      root.style.setProperty("--ui-banner-offset", "0px");
      return;
    }
    const updateOffset = () => {
      const height = bannerRef.current?.offsetHeight ?? 0;
      root.style.setProperty("--ui-banner-offset", `${height}px`);
    };
    updateOffset();
    window.addEventListener("resize", updateOffset);
    return () => {
      window.removeEventListener("resize", updateOffset);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const handleCopy = async () => {
    const didCopy = await safeWriteClipboard(resolvedInstallCommand);
    if (!didCopy) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDismiss = () => {
    safeSetItem(storageKey, "true");
    setIsVisible(false);
    if (onClose) onClose();
  };

  return (
    <div
      ref={bannerRef}
      className="fixed top-0 left-0 right-0 z-[200] border-b border-[#F59E0B]/20 bg-[#FFFBEB] shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 py-2 relative flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Side: Notice */}
        <div className="flex items-center space-x-3">
          <span className="text-xl">{sparkleLabel}</span>
          <div className="flex flex-col">
            <h3 className="text-[#92400E] font-bold text-[15px] leading-none">
              {titleLabel}
            </h3>
            <p className="text-[12px] text-[#B45309] mt-1">{subtitleLabel}</p>
          </div>
        </div>

        {/* Middle: Command Area */}
        <div className="flex-1 flex items-center justify-center max-w-xl w-full">
          <div className="flex items-center w-full bg-white border border-[#F59E0B]/30 pl-3 rounded-lg group hover:border-[#F59E0B]/50 transition-all overflow-hidden">
            <span className="text-[12px] text-[#B45309] shrink-0">{promptLabel}</span>
            <Input
              readOnly
              value={resolvedInstallCommand}
              className="bg-transparent border-none text-[14px] text-[#1E293B] w-full px-2 py-1 outline-none pointer-events-none"
            />
            <Button
              onClick={handleCopy}
              className="shrink-0 bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 border-l border-[#F59E0B]/20 px-3 py-1.5 text-[12px] font-bold text-[#92400E] transition-all rounded-r-lg"
            >
              {copied ? copiedLabel : copyLabel}
            </Button>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center space-x-4">
          <Button
            onClick={handleDismiss}
            className="text-[12px] font-semibold text-[#B45309]/60 hover:text-[#92400E] transition-all"
          >
            {ignoreLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
