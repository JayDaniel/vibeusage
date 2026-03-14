import { Dialog } from "@base-ui/react/dialog";
import React from "react";
import { copy } from "../../../lib/copy";
import { formatUsdCurrency, toFiniteNumber } from "../../../lib/format";
import { AsciiBox } from "../../foundation/AsciiBox.jsx";

function formatUsdValue(value) {
  if (!Number.isFinite(value)) return copy("shared.placeholder.short");
  const formatted = formatUsdCurrency(value.toFixed(6));
  return formatted === "-" ? copy("shared.placeholder.short") : formatted;
}

export const CostAnalysisModal = React.memo(function CostAnalysisModal({
  isOpen,
  onClose,
  fleetData = [],
}) {
  if (!isOpen) return null;

  const percentSymbol = copy("shared.unit.percent");
  const calcPrefix = copy("dashboard.cost_breakdown.calc_prefix");
  const calcFallback = copy("dashboard.cost_breakdown.calc_dynamic");

  const normalizedFleet = (Array.isArray(fleetData) ? fleetData : []).map((fleet) => {
    const usdValue = toFiniteNumber(fleet?.usd);
    const normalizedUsd = Number.isFinite(usdValue) ? usdValue : 0;
    const models = Array.isArray(fleet?.models) ? fleet.models : [];
    return {
      label: fleet?.label ? String(fleet.label) : "",
      usdValue: normalizedUsd,
      usdLabel: formatUsdValue(normalizedUsd),
      models: models.map((model) => {
        const shareValue = toFiniteNumber(model?.share);
        const shareLabel = Number.isFinite(shareValue)
          ? `${shareValue}${percentSymbol}`
          : copy("shared.placeholder.short");
        const calcRaw = typeof model?.calc === "string" ? model.calc.trim() : "";
        const calcValue = calcRaw ? calcRaw.toUpperCase() : calcFallback;
        return {
          id: model?.id ? String(model.id) : "",
          name: model?.name ? String(model.name) : "",
          shareLabel,
          calcValue,
          calcRaw,
        };
      }),
    };
  });

  const totalUsd = normalizedFleet.reduce((acc, fleet) => acc + fleet.usdValue, 0);
  const totalUsdLabel = formatUsdValue(totalUsd);

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose?.();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop
          className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
          data-cost-analysis-backdrop="true"
        />
        <Dialog.Viewport className="fixed inset-0 z-[101] flex items-center justify-center p-4">
          <Dialog.Popup className="w-full max-w-2xl transform animate-in fade-in zoom-in duration-200">
            <AsciiBox title={copy("dashboard.cost_breakdown.title")}>
              <div className="space-y-8 py-4">
                <div className="text-center pb-6 border-b border-[#E2E8F0]">
                  <div className="text-[12px] text-[#94A3B8] font-medium mb-2">
                    {copy("dashboard.cost_breakdown.total_label")}
                  </div>
                  <div className="text-2xl font-extrabold text-[#F59E0B]">
                    {totalUsdLabel}
                  </div>
                </div>

                <div className="space-y-6 max-h-[45vh] overflow-y-auto no-scrollbar pr-2">
                  {normalizedFleet.map((fleet, index) => (
                    <div key={`${fleet.label}-${index}`} className="space-y-3">
                      <div className="flex justify-between items-baseline border-b border-[#E2E8F0] pb-2">
                        <span className="text-[18px] font-bold text-[#1E293B] font-display tracking-wide">
                          {fleet.label}
                        </span>
                        <span className="text-[18px] font-bold text-[#F59E0B] font-display tracking-wide">{fleet.usdLabel}</span>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5">
                        {fleet.models.map((model, modelIndex) => {
                          const modelKey = model?.id || `${model.name}-${modelIndex}`;
                          return (
                            <div
                              key={modelKey}
                              className="flex justify-between text-[12px] text-[#64748B]"
                            >
                              <span>
                                {model.name} ({model.shareLabel})
                              </span>
                              <span className="text-[#94A3B8]">
                                {calcPrefix} {model.calcValue}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-[#E2E8F0] flex justify-between items-center">
                  <Dialog.Close
                    className="text-[13px] font-semibold text-[#2563EB] bg-white border border-[#2563EB] px-6 py-2 rounded-lg hover:bg-[#2563EB] hover:text-white transition-all"
                    type="button"
                  >
                    {copy("dashboard.cost_breakdown.close")}
                  </Dialog.Close>
                  <p className="text-[11px] text-[#94A3B8]">
                    {copy("dashboard.cost_breakdown.footer")}
                  </p>
                </div>
              </div>
            </AsciiBox>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
});
