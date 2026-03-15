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
      : "inline-flex items-center justify-center px-4 py-2 border text-[13px] font-semibold rounded-xl transition-all duration-300 select-none shadow-sm active:scale-95";
  const variant =
    size === "header"
      ? "text-[#1E293B]"
      : primary
        ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white border-transparent hover:from-blue-500 hover:to-blue-400 hover:shadow-blue-500/25 hover:shadow-lg"
        : "bg-white/80 backdrop-blur-md text-[#1E293B] border-white/60 hover:bg-white hover:border-slate-200 hover:shadow-md";
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
