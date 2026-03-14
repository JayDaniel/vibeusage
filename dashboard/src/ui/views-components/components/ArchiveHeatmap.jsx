import React from "react";
import { copy } from "../../../lib/copy";
import { AsciiBox } from "../../foundation/AsciiBox.jsx";
import { ActivityHeatmap } from "./ActivityHeatmap.jsx";

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
          <div className="mt-4 text-[11px] text-[#CBD5E1] font-medium">
            {copy("shared.range.simple", { range: rangeLabel })}
          </div>
        ) : null}
        {showFooter ? (
          <div className="mt-auto pt-3 border-t border-[#E2E8F0] text-[11px] text-[#94A3B8] flex justify-between">
            <span>{footerLeft}</span>
            {footerRight ? <span>{footerRight}</span> : null}
          </div>
        ) : null}
      </div>
    </AsciiBox>
  );
}
