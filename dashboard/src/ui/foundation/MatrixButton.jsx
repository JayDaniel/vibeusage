import { Button } from "@base-ui/react/button";
import React from "react";

export function MatrixButton({
  as: Comp = "button",
  children,
  primary = false,
  size = "default",
  className = "",
  ...props
}) {
  const base =
    size === "header"
      ? "ui-chip ui-action text-[13px] font-semibold select-none"
      : "inline-flex items-center justify-center px-4 py-2 border text-[13px] font-semibold rounded-lg transition-all duration-200 select-none";
  const variant =
    size === "header"
      ? "text-[#1E293B]"
      : primary
        ? "bg-[#2563EB] text-white border-[#2563EB] hover:bg-[#1D4ED8] hover:border-[#1D4ED8] active:bg-[#1E40AF]"
        : "bg-white text-[#1E293B] border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] active:bg-[#F1F5F9]";
  const disabled = "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white";

  const mergedClassName = `${base} ${variant} ${disabled} ${className}`;

  if (Comp === "button") {
    return (
      <Button className={mergedClassName} {...props}>
        {children}
      </Button>
    );
  }

  const userRole = props.role;

  return (
    <Button
      className={mergedClassName}
      {...props}
      nativeButton={false}
      render={(renderProps) => {
        const { children: renderChildren, role: resolvedRole, ...rest } = renderProps;

        const role = Comp === "a" && userRole === undefined ? undefined : resolvedRole;

        return (
          <Comp {...rest} role={role}>
            {renderChildren}
          </Comp>
        );
      }}
    >
      {children}
    </Button>
  );
}
