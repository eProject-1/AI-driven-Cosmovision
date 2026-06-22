import React from "react";

const sizeMap = {
  default: "h-9 px-4",
  sm: "h-8 px-3 text-xs",
  lg: "h-12 px-7 text-sm",
  icon: "h-9 w-9",
};

const Button = React.forwardRef(({ asChild = false, size = "default", className = "", children, ...props }, ref) => {
  const Comp = asChild ? "span" : "button";
  const sizeCls = sizeMap[size] || sizeMap.default;
  return (
    <Comp ref={ref} className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium ${sizeCls} ${className}`} {...props}>
      {children}
    </Comp>
  );
});
Button.displayName = "Button";

export { Button };
