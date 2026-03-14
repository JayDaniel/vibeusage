import { Button } from "@base-ui/react/button";
import React from "react";
import { copy } from "../../../lib/copy";

export function BootScreen({ onSkip }) {
  const canSkip = Boolean(onSkip);

  const className = `min-h-screen bg-[#F8FAFC] text-[#1E293B] font-['Fira_Code',monospace] flex flex-col items-center justify-center p-8 text-center text-[15px] ${
    canSkip ? "cursor-pointer" : ""
  }`;

  const content = (
    <>
      <div className="text-4xl font-extrabold text-[#2563EB] mb-6 select-none">
        VibeUsage
      </div>
      <div className="animate-pulse text-[13px] font-medium text-[#94A3B8] mb-4">
        {copy("boot.prompt")}
      </div>
      <div className="w-64 h-1.5 bg-[#E2E8F0] rounded-full relative overflow-hidden">
        <div className="absolute inset-0 bg-[#2563EB] rounded-full animate-[loader_2s_linear_infinite]"></div>
      </div>
      {canSkip ? (
        <p className="mt-6 text-[12px] text-[#94A3B8]">{copy("boot.skip_hint")}</p>
      ) : null}
      <style>{`@keyframes loader { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`}</style>
    </>
  );

  if (!canSkip) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Button
      className={className}
      onClick={onSkip}
      aria-label={copy("boot.skip_aria")}
      nativeButton={false}
      render={(renderProps) => {
        const { children, ...rest } = renderProps;
        return <div {...rest}>{children}</div>;
      }}
    >
      {content}
    </Button>
  );
}
