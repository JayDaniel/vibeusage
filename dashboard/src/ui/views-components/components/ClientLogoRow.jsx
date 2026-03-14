import React from "react";
import { CLIENTS } from "./ClientLogos.jsx";

export function ClientLogoRow({ className = "" }) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-3 ${className}`}>
      {CLIENTS.map(({ id, name, Icon }) => (
        <div
          key={id}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#E2E8F0] bg-white/80"
          title={name}
        >
          <Icon className="w-4 h-4 text-[#64748B]" />
          <span className="text-[12px] font-medium text-[#475569]">{name}</span>
        </div>
      ))}
    </div>
  );
}

export default ClientLogoRow;
