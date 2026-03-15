import React, { useState } from "react";
import { copy } from "../../../lib/copy";
import { formatCompactNumber } from "../../../lib/format";
import { TEXTURES } from "./MatrixConstants";

const MAX_VISIBLE_MODELS = 5;

export const NeuralAdaptiveFleet = React.memo(function NeuralAdaptiveFleet({
  label,
  totalPercent,
  usage = 0,
  models = [],
}) {
  const [expanded, setExpanded] = useState(false);
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

  const hasOverflow = models.length > MAX_VISIBLE_MODELS;
  const visibleModels = expanded ? models : models.slice(0, MAX_VISIBLE_MODELS);
  const hiddenCount = models.length - MAX_VISIBLE_MODELS;

  return (
    <div className="w-full space-y-3 p-4 bg-white/40 shadow-sm border border-slate-200/60 rounded-xl transition-all duration-300 hover:bg-white/60">
      <div className="flex justify-between items-baseline border-b border-slate-200/60 pb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] font-bold text-slate-800">{label}</span>
          <span className="text-[12px] text-slate-500">{usageLabel}</span>
        </div>
        <div className="flex items-baseline space-x-1">
          <span className="text-[18px] font-bold text-[#2563EB] font-display tracking-wide">{totalPercent}</span>
          <span className="text-[11px] text-[#2563EB] font-medium">{percentSymbol}</span>
        </div>
      </div>

      <div className="h-2 w-full bg-slate-100/50 shadow-inner flex overflow-hidden rounded-full relative">
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

      <div className="flex flex-col gap-1.5 pl-1">
        {visibleModels.map((model, index) => {
          const styleConfig = TEXTURES[index % TEXTURES.length];
          const modelKey = model?.id ? String(model.id) : `${model.name}-${index}`;
          return (
            <div key={modelKey} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: styleConfig.bg }}
                />
                <span className="text-[12px] text-slate-700 font-semibold truncate" title={model.name}>
                  {model.name}
                </span>
              </div>
              <span className="text-[12px] text-slate-500 font-medium shrink-0">
                {model.share}{percentSymbol}
              </span>
            </div>
          );
        })}
        {hasOverflow ? (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="text-[11px] text-[#2563EB] font-medium hover:text-[#1d4ed8] transition-colors text-left mt-0.5 cursor-pointer"
          >
            {expanded
              ? copy("shared.button.collapse", { fallback: "Collapse" })
              : `+${hiddenCount} more`}
          </button>
        ) : null}
      </div>
    </div>
  );
});
