import React from "react";
import { copy } from "../../../lib/copy";
import { AsciiBox } from "../../foundation/AsciiBox.jsx";
import { NeuralAdaptiveFleet } from "./NeuralAdaptiveFleet.jsx";

export const NeuralDivergenceMap = React.memo(function NeuralDivergenceMap({
  fleetData = [],
  className = "",
  title = copy("dashboard.model_breakdown.title"),
  footer = copy("dashboard.model_breakdown.footer"),
}) {
  const count = fleetData.length;
  const gridClass = count === 1 ? "grid grid-cols-1" : "grid grid-cols-1 md:grid-cols-2";

  return (
    <AsciiBox title={title} className={className}>
      <div className={`${gridClass} gap-4 py-1 overflow-y-auto no-scrollbar`}>
        {fleetData.map((fleet, index) => {
          const isFirstAndOdd = count > 1 && count % 2 !== 0 && index === 0;
          const itemClass = isFirstAndOdd ? "md:col-span-2" : "";

          return (
            <div key={`${fleet.label}-${index}`} className={itemClass}>
              <NeuralAdaptiveFleet
                label={fleet.label}
                totalPercent={fleet.totalPercent}
                usage={fleet.usage}
                models={fleet.models}
              />
            </div>
          );
        })}
      </div>
      {footer ? (
        <div className="mt-auto pt-3 border-t border-[#E2E8F0] text-[11px] text-center italic leading-none text-[#94A3B8]">
          {footer}
        </div>
      ) : null}
    </AsciiBox>
  );
});
