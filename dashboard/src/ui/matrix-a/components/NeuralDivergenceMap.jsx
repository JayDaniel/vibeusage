import React from "react";

import { copy } from "../../../lib/copy.js";
import { AsciiBox } from "./AsciiBox.jsx";
import { NeuralAdaptiveFleet } from "./NeuralAdaptiveFleet.jsx";

export const NeuralDivergenceMap = React.memo(function NeuralDivergenceMap({
  fleetData = [],
  className = "",
  title = copy("dashboard.model_breakdown.title"),
  footer = copy("dashboard.model_breakdown.footer"),
}) {
  const count = fleetData.length;
  // 单个时全宽(cols-1)，多个时双列(cols-2)
  const gridClass =
    count === 1 ? "grid grid-cols-1" : "grid grid-cols-1 md:grid-cols-2";

  return (
    <AsciiBox title={title} className={className}>
      <div className={`${gridClass} gap-6 py-1 overflow-y-auto no-scrollbar`}>
        {fleetData.map((fleet, index) => {
          // 如果总数是奇数且大于1，且是最后一个元素，则让它横跨两列
          const isLastAndOdd =
            count > 1 && count % 2 !== 0 && index === count - 1;
          const itemClass = isLastAndOdd ? "md:col-span-2" : "";

          return (
            <div key={`${fleet.label}-${index}`} className={itemClass}>
              <NeuralAdaptiveFleet
                label={fleet.label}
                totalPercent={fleet.totalPercent}
                models={fleet.models}
              />
            </div>
          );
        })}
      </div>
      {footer ? (
        <div className="mt-auto pt-1 border-t border-white/5 opacity-10 text-[7px] uppercase tracking-[0.4em] text-center italic leading-none">
          {footer}
        </div>
      ) : null}
    </AsciiBox>
  );
});
