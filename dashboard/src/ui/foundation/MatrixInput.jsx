import { Input } from "@base-ui/react/input";
import React from "react";

export function MatrixInput({ label, className = "", ...props }) {
  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="text-[12px] text-[#64748B] font-medium">{label}</span>
      <Input
        className="h-10 bg-white border border-[#E2E8F0] rounded-lg px-3 text-[15px] text-[#1E293B] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
        {...props}
      />
    </label>
  );
}
