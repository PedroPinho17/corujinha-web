import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
