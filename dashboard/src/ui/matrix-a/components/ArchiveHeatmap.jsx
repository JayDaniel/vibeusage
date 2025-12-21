import React from "react";

import { copy } from "../../../lib/copy.js";
import { ActivityHeatmap } from "./ActivityHeatmap.jsx";
import { AsciiBox } from "./AsciiBox.jsx";

export function ArchiveHeatmap({
  heatmap,
  title = copy("archive.title"),
  rangeLabel,
  footerLeft = copy("archive.footer.left"),
  footerRight,
  className = "",
}) {
  const showFooter = Boolean(footerLeft || footerRight);

  return (
    <AsciiBox title={title} className={className}>
      <div className="flex flex-col h-full">
        <ActivityHeatmap heatmap={heatmap} />
        {rangeLabel ? (
          <div className="mt-3 text-[8px] opacity-30 uppercase tracking-widest font-black">
            {copy("shared.range.simple", { range: rangeLabel })}
          </div>
        ) : null}
        {showFooter ? (
          <div className="mt-auto pt-2 border-t border-[#00FF41]/10 text-[8px] opacity-50 flex justify-between uppercase">
            <span>{footerLeft}</span>
            {footerRight ? <span>{footerRight}</span> : null}
          </div>
        ) : null}
      </div>
    </AsciiBox>
  );
}
