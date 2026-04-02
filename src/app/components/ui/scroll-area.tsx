import * as React from "react";

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function ScrollArea({ children, className = "", ...props }: ScrollAreaProps) {
  return (
    <div
      className={`overflow-y-auto overflow-x-hidden ${className}`}
      style={{ maxHeight: "calc(100vh - 200px)" }}
      {...props}
    >
      {children}
    </div>
  );
}
