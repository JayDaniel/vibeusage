import React from "react";
import { copy } from "../../../lib/copy";
import { formatCompactNumber } from "../../../lib/format";
import { TEXTURES } from "./MatrixConstants";

export const NeuralAdaptiveFleet = React.memo(function NeuralAdaptiveFleet({
  label,
  totalPercent,
  usage = 0,
  models = [],
}) {
  const percentSymbol = copy("shared.unit.percent");
  const thousandSuffix = copy("shared.unit.thousand_abbrev");
  const millionSuffix = copy("shared.unit.million_abbrev");
  const billionSuffix = copy("shared.unit.billion_abbrev");
  const usageValue = formatCompactNumber(usage, {
    thousandSuffix,
    millionSuffix,
    billionSuffix,
    decimals: 1,
  });
  const usageLabel = copy("dashboard.model_breakdown.usage_label", {
    value: usageValue,
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-baseline border-b border-[#E2E8F0] pb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] font-bold text-[#1E293B]">{label}</span>
          <span className="text-[12px] text-[#94A3B8]">{usageLabel}</span>
        </div>
        <div className="flex items-baseline space-x-1">
          <span className="text-[18px] font-bold text-[#2563EB] font-display tracking-wide">{totalPercent}</span>
          <span className="text-[11px] text-[#2563EB] font-medium">{percentSymbol}</span>
        </div>
      </div>

      <div className="h-2 w-full bg-[#F1F5F9] flex overflow-hidden rounded-full relative">
        {models.map((model, index) => {
          const styleConfig = TEXTURES[index % TEXTURES.length];
          const modelKey = model?.id ? String(model.id) : `${model.name}-${index}`;
          return (
            <div
              key={modelKey}
              className="h-full relative transition-all duration-1000 ease-out"
              style={{
                width: `${model.share}%`,
                backgroundColor: styleConfig.bg,
              }}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-y-2 gap-x-6 pl-1">
        {models.map((model, index) => {
          const styleConfig = TEXTURES[index % TEXTURES.length];
          const modelKey = model?.id ? String(model.id) : `${model.name}-${index}`;
          return (
            <div key={modelKey} className="flex items-center space-x-2">
              <div
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{
                  backgroundColor: styleConfig.bg,
                }}
              />
              <div className="flex items-baseline space-x-2 min-w-0">
                <span
                  className="text-[12px] truncate text-[#1E293B] font-semibold"
                  title={model.name}
                >
                  {model.name}
                </span>
                <span className="text-[12px] text-[#94A3B8] font-medium">
                  {model.share}
                  {percentSymbol}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
